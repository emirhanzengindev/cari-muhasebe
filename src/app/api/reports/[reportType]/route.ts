import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// Define types for the report data
interface SalesByProduct {
  productId: string;
  productName: string;
  totalSales: number;
  quantitySold: number;
}

interface MonthlyProfitLoss {
  month: string;
  year: number;
  profit: number;
  revenue: number;
  expenses: number;
  monthYear?: string;
}

interface AccountBalance {
  accountId: string;
  accountName: string;
  balance: number;
  phone?: string;
  email?: string;
  isActive: boolean;
}

const getTenantCandidates = (user: any): string[] => {
  const appTenantId = typeof user?.app_metadata?.tenant_id === 'string'
    ? user.app_metadata.tenant_id
    : null;
  const userTenantId = typeof user?.user_metadata?.tenant_id === 'string'
    ? user.user_metadata.tenant_id
    : null;

  return Array.from(new Set([appTenantId, userTenantId, user?.id].filter(Boolean)));
};

// Placeholder API route for sales by product report
export async function GET(request: NextRequest, { params }: { params: Promise<{ reportType: string }> }) {
  try {
    const { reportType } = await params;
    
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    const tenantCandidates = getTenantCandidates(user);
    const tenantId = tenantCandidates[0];

    // Validate that the resolved tenant is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return Response.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    let reportData: any[] = [];
    
    // For now, return mock data based on report type
    // In a real implementation, this would query the database with proper aggregations
    switch(reportType) {
      case 'sales-by-product': {
        // Define type for invoice items
        type InvoiceItemRow = {
          product_id: string;
          products: { name: string } | null;
          quantity: number;
          price: number;
          total_price: number;
        };
        
        // Query products and their sales data
        const { data: invoiceItems } = await supabase
          .from('invoice_items')
          .select(`
            product_id,
            products(name),
            quantity,
            price,
            total_price
          `)
          .in('tenant_id', tenantCandidates)
          .order('created_at', { ascending: false });
        
        if (invoiceItems && invoiceItems.length > 0) {
          // Group by product and calculate totals
          const groupedData = (invoiceItems as unknown as InvoiceItemRow[]).reduce((acc: SalesByProduct[], item: InvoiceItemRow) => {
            const existing = acc.find(p => p.productId === item.product_id);
            if (existing) {
              existing.totalSales += item.total_price;
              existing.quantitySold += item.quantity;
            } else {
              acc.push({
                productId: item.product_id,
                productName: item.products?.name || 'Unknown Product',
                totalSales: item.total_price,
                quantitySold: item.quantity
              });
            }
            return acc;
          }, []);
          
          reportData = groupedData;
        }
        break;
      }
        
      case 'monthly-profit-loss': {
        // Define type for invoice rows
        type InvoiceRow = Record<string, any>;
        
        // Define type for monthly data
        type MonthlyData = {
          month: string;
          year: number;
          revenue: number;
          expenses: number;
          monthYear: string;
        };
        
        // Query invoices to calculate revenue and expenses
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .in('tenant_id', tenantCandidates)
          .order('date', { ascending: false });
        
        if (invoices && invoices.length > 0) {
          // Group by month/year and calculate totals
          const monthlyData = (invoices as unknown as InvoiceRow[]).reduce((acc: MonthlyData[], invoice: InvoiceRow) => {
            const date = new Date(invoice.date || invoice.invoice_date || invoice.created_at);
            if (!Number.isFinite(date.getTime())) return acc;
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            const invoiceType = String(invoice.invoice_type || invoice.type || '').toUpperCase();
            const total = Number(invoice.total_amount ?? invoice.total ?? invoice.amount ?? 0) || 0;
            
            const existing = acc.find(m => m.monthYear === monthYear);
            if (existing) {
              if (invoiceType === 'SALES') {
                existing.revenue += total;
              } else if (invoiceType === 'PURCHASE') {
                existing.expenses += total;
              }
            } else {
              const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
              
              acc.push({
                month: monthNames[date.getMonth()],
                year: date.getFullYear(),
                revenue: invoiceType === 'SALES' ? total : 0,
                expenses: invoiceType === 'PURCHASE' ? total : 0,
                monthYear: monthYear
              });
            }
            return acc;
          }, []);
          
          // Calculate profit and sort by date
          reportData = monthlyData
            .map(item => ({
              month: item.month,
              year: item.year,
              revenue: item.revenue,
              expenses: item.expenses,
              profit: item.revenue - item.expenses,
            }))
            .sort((a: MonthlyProfitLoss, b: MonthlyProfitLoss) => {
              const dateA = new Date(`${a.month} 1, ${a.year}`);
              const dateB = new Date(`${b.month} 1, ${b.year}`);
              return dateB.getTime() - dateA.getTime(); // Descending order
            })
            .slice(0, 6); // Limit to last 6 months
          } else {
            reportData = [];
        }
        break;
      }
        
      case 'account-balances': {
        // Define type for account rows
        type AccountRow = {
          id: string;
          name: string;
          balance: number | null;
          phone?: string;
          tax_number?: string;
          tax_office?: string;
          address?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        
        // Query current accounts and calculate their balances
        const { data: accounts } = await supabase
          .from('current_accounts')
          .select(`
            id,
            name,
            balance,
            phone,
            tax_number,
            tax_office,
            address,
            is_active,
            created_at,
            updated_at
          `)
          .in('tenant_id', tenantCandidates)
          .order('created_at', { ascending: false });
        
        if (accounts && accounts.length > 0) {
          reportData = (accounts as unknown as AccountRow[]).map(account => ({
            accountId: account.id,
            accountName: account.name,
            balance: account.balance || 0,
            phone: account.phone,
            isActive: account.is_active ?? true
          }));
        }
        break;
      }
        
      default:
        return Response.json({ error: 'Invalid report type' }, { status: 400 });
    }
    
    return Response.json(reportData);
  } catch (error) {
    console.error(`Error fetching ${request.url} report:`, error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}