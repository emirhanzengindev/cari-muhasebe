"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useInvoiceItemStore } from "@/stores/invoiceItemStore";
import { useEffect, useState } from "react";
import jsPDF from 'jspdf';

export default function AccountDetail() {
  const params = useParams();
  const accountId = params.id as string;
  const { accounts, fetchAccounts } = useCurrentAccountsStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { products, fetchProducts } = useInventoryStore();
  const { fetchInvoiceItems, getInvoiceItemsByInvoiceId } = useInvoiceItemStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchAccounts(),
        fetchInvoices(),
        fetchProducts(),
        fetchInvoiceItems()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchAccounts, fetchInvoices, fetchProducts, fetchInvoiceItems]);

  const account = accounts.find(acc => acc.id === accountId);
  
  // Filter invoices for this account
  const accountInvoices = invoices.filter(invoice => invoice.accountId === accountId);

  // Create transaction history from invoices with proper running balance
  const transactions = accountInvoices
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date
    .map((invoice, index) => {
      const isSales = invoice.invoiceType === 'SALES';
      return {
        id: invoice.id,
        date: invoice.date.toISOString().split('T')[0],
        description: `${isSales ? 'Sales Invoice' : 'Purchase Invoice'} #${invoice.invoiceNumber}`,
        debit: isSales ? invoice.totalAmount : 0,
        credit: isSales ? 0 : invoice.totalAmount,
        currency: invoice.currency, // Para birimi bilgisini ekleyelim
        // Calculate running balance
        balance: accountInvoices
          .slice(0, index + 1)
          .reduce((acc, inv) => {
            return inv.invoiceType === 'SALES' 
              ? acc + inv.totalAmount  // Sales increase balance (customer owes us)
              : acc - inv.totalAmount; // Purchases decrease balance (we owe supplier)
          }, 0)
      };
    });

  // Calculate separate balances for different currencies
  const currencyBalances = accountInvoices.reduce((acc, invoice) => {
    const isSales = invoice.invoiceType === 'SALES';
    const amount = isSales ? invoice.totalAmount : -invoice.totalAmount;
    
    if (!acc[invoice.currency]) {
      acc[invoice.currency] = 0;
    }
    acc[invoice.currency] += amount;
    return acc;
  }, {} as Record<string, number>);

  // Function to get product info
  const getProductInfo = (productId: string) => {
    const product = products.find(prod => prod.id === productId);
    return product ? { name: product.name, sku: product.sku } : { name: "Unknown Product", sku: "" };
  };

  // Function to get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'TRY':
        return 'TL';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return currency;
    }
  };

  // Function to generate PDF statement in professional format with full details
  const generateStatementPDF = () => {
    if (!account) return;
    
    const doc = new jsPDF();
    
    // Set font size
    doc.setFontSize(8);
    
    // Simplified header
    doc.setFont('helvetica', 'bold');
    doc.text('CARI EKSTRE', 105, 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 105, 15, { align: 'center' });
    
    // Account Information
    doc.setFont('helvetica', 'bold');
    doc.text('Hesap Bilgileri:', 20, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`Unvan: ${account.name}`, 20, 32);
    doc.text(`Tarih Araligi: 01.01.2024 - ${new Date().toLocaleDateString('tr-TR')}`, 20, 39);
    
    // Transaction Table Header (Gri satır - sol kenar boşluksuz)
    doc.setFillColor(200, 200, 200);
    doc.rect(0, 45, 210, 8, 'F'); // Tam genişlikte gri başlık satırı (sol kenar boşluksuz)
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tarih', 2, 50); // En başa hizalandı
    doc.text('Fatura No', 22, 50);
    doc.text('Aciklama', 45, 50);
    doc.text('Urun', 65, 50); // 10 birim sola kaydırıldı
    doc.text('Miktar', 85, 50); // 10 birim sola kaydırıldı
    doc.text('Evrak Turu', 105, 50); // Fiyat bilgileri çıkarıldı, diğer sütunlar sola kaydırıldı
    doc.text('Borc', 135, 50); // 20 birim sola kaydırıldı
    doc.text('Alacak', 150, 50); // 20 birim sola kaydırıldı
    doc.text('Kalan', 165, 50); // 20 birim sola kaydırıldı
    
    // Transaction Rows (sol kenar boşluksuz)
    doc.setFont('helvetica', 'normal');
    let yPos = 58;
    
    // Calculate running balance for each transaction
    let runningBalance = 0;
    
    accountInvoices
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((invoice, index) => {
        // Calculate running balance
        if (invoice.invoiceType === 'SALES') {
          runningBalance += invoice.totalAmount;
        } else {
          runningBalance -= invoice.totalAmount;
        }
        
        // Get invoice items for this invoice
        const invoiceItems = getInvoiceItemsByInvoiceId(invoice.id);
        
        // Display each item in the invoice
        if (invoiceItems.length > 0) {
          invoiceItems.forEach((item, itemIndex) => {
            // Alternate row colors (tam genişlik)
            if ((index + itemIndex) % 2 === 0) {
              doc.setFillColor(240, 240, 240);
              doc.rect(0, yPos - 4, 210, 6, 'F'); // Tam genişlikte alternatif satır
            }
            
            const productInfo = getProductInfo(item.productId);
            
            // Açıklama varsa kullan, yoksa boş bırak
            const description = invoice.description || '';
            
            doc.text(invoice.date.toISOString().split('T')[0], 2, yPos); // En başa hizalandı
            doc.text(invoice.invoiceNumber, 22, yPos); // Fatura No
            // Açıklama varsa göster, yoksa boş bırak
            if (description) {
              doc.text(description.substring(0, 15), 45, yPos); // Açıklama (kısaltılmış, daha küçük alan)
            }
            doc.text(productInfo.name.substring(0, 15), 65, yPos); // Urun (kısaltılmış)
            doc.text(item.quantity.toString(), 85, yPos); // Miktar
            doc.text('Fatura', 105, yPos); // Evrak Turu
            doc.text(invoice.invoiceType === 'SALES' ? `${getCurrencySymbol(invoice.currency)}${item.total.toFixed(2)}` : '-', 135, yPos);
            doc.text(invoice.invoiceType === 'SALES' ? '-' : `${getCurrencySymbol(invoice.currency)}${item.total.toFixed(2)}`, 150, yPos);
            doc.text(`${runningBalance >= 0 ? '' : '-'}${getCurrencySymbol(invoice.currency)}${Math.abs(runningBalance).toFixed(2)}`, 165, yPos);
            
            yPos += 6;
            
            // Add new page if needed
            if (yPos > 280) {
              doc.addPage();
              yPos = 20;
            }
          });
        } else {
          // If no items in invoice, still show the invoice
          // Alternate row colors (tam genişlik)
          if (index % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(0, yPos - 4, 210, 6, 'F'); // Tam genişlikte alternatif satır
          }
          
          // Açıklama varsa kullan, yoksa boş bırak
          const description = invoice.description || '';
          
          doc.text(invoice.date.toISOString().split('T')[0], 2, yPos); // En başa hizalandı
          doc.text(invoice.invoiceNumber, 22, yPos); // Fatura No
          // Açıklama varsa göster, yoksa boş bırak
          if (description) {
            doc.text(description.substring(0, 15), 45, yPos); // Açıklama (kısaltılmış, daha küçük alan)
          }
          doc.text('Fatura Ogeleri Yok', 65, yPos); // Urun
          doc.text('-', 85, yPos); // Miktar
          doc.text('Fatura', 105, yPos); // Evrak Turu
          doc.text(invoice.invoiceType === 'SALES' ? `${getCurrencySymbol(invoice.currency)}${invoice.totalAmount.toFixed(2)}` : '-', 135, yPos);
          doc.text(invoice.invoiceType === 'SALES' ? '-' : `${getCurrencySymbol(invoice.currency)}${invoice.totalAmount.toFixed(2)}`, 150, yPos);
          doc.text(`${runningBalance >= 0 ? '' : '-'}${getCurrencySymbol(invoice.currency)}${Math.abs(runningBalance).toFixed(2)}`, 165, yPos);
          
          yPos += 6;
          
          // Add new page if needed
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        }
      });
    
    // Summary (en sağa hizalanmış ve daha büyük font)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12); // Font boyutunu büyültüyoruz
    
    // Her para birimi için ayrı toplam bakiye göster
    let summaryYPos = yPos + 15;
    Object.entries(currencyBalances).forEach(([currency, balance]) => {
      const summaryText = `Toplam Bakiye (${currency}): ${balance >= 0 ? '' : '-'}${getCurrencySymbol(currency)}${Math.abs(balance).toFixed(2)}`;
      const textWidth = doc.getTextWidth(summaryText);
      doc.text(summaryText, 210 - textWidth - 10, summaryYPos);
      summaryYPos += 8; // Bir sonraki satıra geç
    });
    
    doc.setFontSize(8); // Önceki font boyutuna geri dönüyoruz
    
    // Save the PDF
    doc.save(`cari-ekstre-${account.name.replace(/\s+/g, '-')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Not Found</h1>
        <p className="text-gray-600">The requested account could not be found.</p>
        <Link href="/current-accounts" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Back to Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Details</h1>
          <p className="mt-1 text-sm text-gray-500">{account.name}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateStatementPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Generate Statement PDF
          </button>
          <Link
            href={`/current-accounts/${accountId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Account
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
          <dl className="grid grid-cols-1 gap-2">
            <div className="border-t border-gray-100 pt-2">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{account.name}</dd>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{account.email || 'N/A'}</dd>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{account.phone || 'N/A'}</dd>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <dt className="text-sm font-medium text-gray-500">Tax Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{account.taxNumber || 'N/A'}</dd>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{account.address || 'N/A'}</dd>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <dt className="text-sm font-medium text-gray-500">Balance</dt>
              <dd className={`mt-1 text-sm font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {account.balance >= 0 ? '+' : ''}{account.balance.toFixed(2)} TL
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.debit > 0 ? `${transaction.debit.toFixed(2)} ${getCurrencySymbol(transaction.currency)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.credit > 0 ? `${transaction.credit.toFixed(2)} ${getCurrencySymbol(transaction.currency)}` : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.balance >= 0 ? '+' : ''}{transaction.balance.toFixed(2)} {getCurrencySymbol(transaction.currency)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Invoice History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountInvoices
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((invoice) => {
                  const invoiceItems = getInvoiceItemsByInvoiceId(invoice.id);
                  return (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.date.toISOString().split('T')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {invoice.description || ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <ul className="space-y-1">
                          {invoiceItems.slice(0, 3).map((item) => {
                            const productInfo = getProductInfo(item.productId);
                            return (
                              <li key={item.id} className="truncate">
                                {productInfo.name} ({item.quantity} x {item.unitPrice.toFixed(2)})
                              </li>
                            );
                          })}
                          {invoiceItems.length > 3 && (
                            <li className="text-gray-500">+{invoiceItems.length - 3} more items</li>
                          )}
                          {invoiceItems.length === 0 && (
                            <li className="text-gray-500">No items</li>
                          )}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.totalAmount.toFixed(2)} {getCurrencySymbol(invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.invoiceType === 'SALES' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {invoice.invoiceType === 'SALES' ? 'Sales' : 'Purchase'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              {accountInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}