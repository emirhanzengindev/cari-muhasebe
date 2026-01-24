"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { Invoice } from "@/types";

// Helper function to group invoices by month
const groupInvoicesByMonth = (invoices: Invoice[]) => {
  const monthlyData: Record<string, { month: string; income: number; expense: number }> = {};
  
  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    const month = date.toLocaleString('tr-TR', { month: 'short' });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = { month: key, income: 0, expense: 0 };
    }
    
    if (invoice.invoiceType === 'SALES') {
      monthlyData[key].income += invoice.totalAmount;
    } else {
      monthlyData[key].expense += invoice.totalAmount;
    }
  });
  
  return Object.values(monthlyData);
};

// Helper function to get daily sales data
const getDailySalesData = (invoices: Invoice[]) => {
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const dailyData = days.map(day => ({ day, sales: 0 }));
  
  invoices
    .filter(invoice => invoice.invoiceType === 'SALES')
    .forEach(invoice => {
      const date = new Date(invoice.date);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      // Convert to our format (0 = Paz, 1 = Pzt, etc.)
      const ourDayIndex = dayIndex === 0 ? 0 : dayIndex;
      dailyData[ourDayIndex].sales += invoice.totalAmount;
    });
  
  return dailyData;
};

export default function Dashboard() {
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useCurrentAccountsStore();
  const { invoices, loading: invoicesLoading, fetchInvoices, clearAllInvoices } = useInvoiceStore();
  const { products, loading: productsLoading, fetchProducts } = useInventoryStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchAccounts(),
        fetchInvoices(),
        fetchProducts()
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchAccounts, fetchInvoices, fetchProducts]);

  // Calculate totals
  const totalSales = invoices
    .filter(inv => inv.invoiceType === 'SALES')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalPurchases = invoices
    .filter(inv => inv.invoiceType === 'PURCHASE')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalDebt = accounts
    .filter(acc => acc.accountType === 'SUPPLIER')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalReceivables = accounts
    .filter(acc => acc.accountType === 'CUSTOMER')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const lowStockCount = products.filter(p => (p.stockQuantity ?? 0) <= (p.criticalLevel ?? 0)).length;

  // Prepare chart data
  const monthlyData = groupInvoicesByMonth(invoices);
  const dailySalesData = getDailySalesData(invoices);

  // Function to clear all invoices
  const handleClearAllInvoices = async () => {
    if (window.confirm('Tüm faturaları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await clearAllInvoices();
        // Refresh data after clearing
        await fetchInvoices();
        alert('Tüm faturalar başarıyla silindi.');
      } catch (error) {
        alert('Faturalar silinirken bir hata oluştu.');
      }
    }
  };

  // Check if any store has an error
  const hasError = accountsError;
  const errorMessage = accountsError || "Bilinmeyen bir hata oluştu";

  // Prepare stats data
  const stats = [
    { name: "Günlük Toplam Satış", value: `₺${totalSales.toFixed(2)}`, change: "-", icon: "💰" },
    { name: "Toplam Borçlar", value: `₺${totalDebt.toFixed(2)}`, change: "-", icon: "💸" },
    { name: "Toplam Alacaklar", value: `₺${totalReceivables.toFixed(2)}`, change: "-", icon: "💳" },
    { name: "Düşük Stok Uyarıları", value: lowStockCount.toString(), change: "-", icon: "⚠️" },
  ];

  // Prepare chart data
  const incomeExpenseData = groupInvoicesByMonth(invoices).slice(-10);
  const salesData = getDailySalesData(invoices);

  if (loading || accountsLoading || invoicesLoading || productsLoading) {
    return (
      <div className="py-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Hata</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ana Sayfa</h1>
        <p className="mt-1 text-sm text-gray-500">İşletmenizin performans özeti</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-2xl">{stat.icon}</div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm text-green-600">
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clear All Invoices Button */}
      <div className="mb-8">
        <button
          onClick={handleClearAllInvoices}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Tüm Faturaları Temizle
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Income/Expense Chart */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gelir vs Gider (Son 10 Ay)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incomeExpenseData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₺${Number(value).toFixed(2)}`, '']} />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Gelir" />
                <Bar dataKey="expense" fill="#EF4444" name="Gider" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Haftalık Satış Trendi</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`₺${Number(value).toFixed(2)}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" activeDot={{ r: 8 }} name="Satışlar" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 shadow rounded-lg">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Son Aktiviteler</h2>
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {invoices.slice(0, 5).map((invoice) => (
              <li key={invoice.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600">🧾</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invoice.invoiceType === "SALES" ? "Satış" : "Satın Alma"} Faturası #{invoice.invoiceNumber} oluşturuldu
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Tutar: ₺{invoice.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}