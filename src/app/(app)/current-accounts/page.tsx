"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";

export default function CurrentAccounts() {
  const { accounts, loading, error, fetchAccounts, toggleAccountStatus, deleteAccount } = useCurrentAccountsStore();
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Filter accounts safely, ensuring all required properties exist
  const filteredAccounts = (accounts || []).filter(account => {
    // Skip accounts that don't have required properties
    if (!account || !account.id) return false;
    
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return account.isActive ?? true;
    if (filter === "PASSIVE") return !(account.isActive ?? true);
    if (filter === "CUSTOMERS") return account.accountType === "CUSTOMER";
    if (filter === "SUPPLIERS") return account.accountType === "SUPPLIER";
    return true;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Cari Hesaplar</h1>
          <p className="mt-1 text-sm text-gray-500">Müşterilerinizi ve tedarikçilerinizi yönetin</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/current-accounts/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Yeni Hesap Ekle
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === "ALL"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            All Hesaplar
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === "ACTIVE"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilter("PASSIVE")}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === "PASSIVE"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Pasif
          </button>
          <button
            onClick={() => setFilter("CUSTOMERS")}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === "CUSTOMERS"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Müşteriler
          </button>
          <button
            onClick={() => setFilter("SUPPLIERS")}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === "SUPPLIERS"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Tedarikçiler
          </button>
        </div>
      </div>

      {/* Accounts Table - Mobil uyumlu hale getirildi */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İsim
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bakiye
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
              {filteredAccounts.map((account) => {
                // Ensure account has all required properties
                if (!account || !account.id) return null;
                
                return (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{account.name || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{account.email || ''}</div>
                    <div className="text-sm text-gray-500">{account.phone || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      account.accountType === "CUSTOMER" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {account.accountType === "CUSTOMER" ? "Müşteri" : "Tedarikçi"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={(account.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                      {(account.balance || 0) >= 0 ? "₺" : "-₺"}{Math.abs(account.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      account.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {account.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                      <Link href={`/current-accounts/${account.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
                        Görüntüle
                      </Link>
                      <Link href={`/current-accounts/${account.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                        Düzenle
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("Bu hesabı silmek istediğinize emin misiniz?")) {
                            deleteAccount(account.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {accounts && accounts.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Hesap bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Yeni bir hesap oluşturarak başlayın.</p>
            <div className="mt-6">
              <Link href="/current-accounts/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Yeni Hesap Ekle
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {accounts && accounts.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            Gösterilen <span className="font-medium">1</span> - <span className="font-medium">{Math.min(10, accounts.length)}</span> / toplam{' '}
            <span className="font-medium">{accounts.length}</span> sonuç
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