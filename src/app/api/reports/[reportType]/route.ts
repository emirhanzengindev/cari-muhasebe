import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

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

// Placeholder API route for sales by product report
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const reportType = url.pathname.split('/').pop(); // Get the last part of the path
    
    const tenantId = await getTenantIdFromJWT();
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return Response.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
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
          .eq('tenant_id', tenantId)
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
        type InvoiceRow = {
          id: string;
          total_amount: number;
          invoice_type: string;
          created_at: string;
        };
        
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
          .select(`
            id,
            total_amount,
            invoice_type,
            created_at
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        
        if (invoices && invoices.length > 0) {
          // Group by month/year and calculate totals
          const monthlyData = (invoices as unknown as InvoiceRow[]).reduce((acc: MonthlyData[], invoice: InvoiceRow) => {
            const date = new Date(invoice.created_at);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            const existing = acc.find(m => m.monthYear === monthYear);
            if (existing) {
              if (invoice.invoice_type === 'SALES') {
                existing.revenue += invoice.total_amount;
              } else if (invoice.invoice_type === 'PURCHASE') {
                existing.expenses += invoice.total_amount;
              }
            } else {
              const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
              
              acc.push({
                month: monthNames[date.getMonth()],
                year: date.getFullYear(),
                revenue: invoice.invoice_type === 'SALES' ? invoice.total_amount : 0,
                expenses: invoice.invoice_type === 'PURCHASE' ? invoice.total_amount : 0,
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
          // Return mock data if no invoices exist
          reportData = [
            { month: "October", year: 2023, profit: 15000, revenue: 50000, expenses: 35000 },
            { month: "September", year: 2023, profit: 12000, revenue: 45000, expenses: 33000 },
            { month: "August", year: 2023, profit: 8000, revenue: 40000, expenses: 32000 },
            { month: "July", year: 2023, profit: 10000, revenue: 38000, expenses: 28000 },
            { month: "June", year: 2023, profit: 7000, revenue: 35000, expenses: 28000 },
            { month: "May", year: 2023, profit: 9000, revenue: 37000, expenses: 28000 },
          ];
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
          email?: string;
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
            email,
            tax_number,
            tax_office,
            address,
            is_active,
            created_at,
            updated_at
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        
        if (accounts && accounts.length > 0) {
          reportData = (accounts as unknown as AccountRow[]).map(account => ({
            accountId: account.id,
            accountName: account.name,
            balance: account.balance || 0,
            phone: account.phone,
            email: account.email,
            isActive: account.is_active
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