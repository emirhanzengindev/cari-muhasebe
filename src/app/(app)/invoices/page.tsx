"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";

export default function Invoices() {
  const { invoices, loading, error, fetchInvoices, deleteInvoice, updateInvoice } = useInvoiceStore();
  const { accounts, fetchAccounts } = useCurrentAccountsStore();
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
  }, [fetchInvoices, fetchAccounts]);

  const filteredInvoices = invoices?.filter(invoice => {
    const account = accounts?.find(acc => acc.id === invoice.accountId);
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (account && account.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "ALL") return matchesSearch;
    if (filter === "SALES") return matchesSearch && invoice.invoiceType === "SALES";
    if (filter === "PURCHASE") return matchesSearch && invoice.invoiceType === "PURCHASE";
    if (filter === "DRAFT") return matchesSearch && invoice.isDraft;
    return matchesSearch;
  }) || [];


  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : "Unknown Account";
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
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
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturalar</h1>
          <p className="mt-1 text-sm text-gray-500">Satış ve alış faturalarınızı yönetin</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/invoices/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Yeni Fatura Oluştur
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === "ALL"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Tüm Faturalar
            </button>
            <button
              onClick={() => setFilter("SALES")}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === "SALES"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Satış
            </button>
            <button
              onClick={() => setFilter("PURCHASE")}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === "PURCHASE"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Alış
            </button>
            <button
              onClick={() => setFilter("DRAFT")}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === "DRAFT"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Taslaklar
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Faturaları ara..."
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table - Mobil uyumlu hale getirildi */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fatura
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri/Tedarikçi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tür
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getAccountName(invoice.accountId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.invoiceType === "SALES" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {invoice.invoiceType === "SALES" ? "Satış" : "Alış"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₺{invoice.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.isDraft 
                        ? "bg-yellow-100 text-yellow-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {invoice.isDraft ? "Taslak" : "Tamamlandı"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                      <Link href={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
                        Görüntüle
                      </Link>
                      <Link href={`/invoices/${invoice.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                        Düzenle
                      </Link>
                      <button 
                        onClick={() => {
                          if (confirm("Bu faturayı silmek istediğinize emin misiniz?")) {
                            deleteInvoice(invoice.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {invoices?.length || 0 === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Fatura yok</h3>
            <p className="mt-1 text-sm text-gray-500">Yeni bir fatura oluşturarak başlayın.</p>
            <div className="mt-6">
              <Link href="/invoices/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Yeni Fatura Oluştur
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {invoices?.length || 0 > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            <span className="font-medium">1</span> - <span className="font-medium">{Math.min(10, invoices?.length || 0)}</span> arası gösteriliyor, Toplam: {' '}
            <span className="font-medium">{invoices?.length || 0}</span> fatura
          </div>
          <div className="flex space-x-2">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Önceki
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
