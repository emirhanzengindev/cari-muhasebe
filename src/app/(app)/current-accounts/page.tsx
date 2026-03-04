"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";

type ImportFailure = {
  row: number;
  reason: string;
  value?: string;
};

type ImportResult = {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  failures: ImportFailure[];
};

export default function CurrentAccounts() {
  const { accounts, loading, error, fetchAccounts, deleteAccount } = useCurrentAccountsStore();
  const [filter, setFilter] = useState("ALL");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<"insert" | "upsert">("insert");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredAccounts = (accounts || []).filter((account) => {
    if (!account || !account.id) return false;
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return account.isActive ?? true;
    if (filter === "PASSIVE") return !(account.isActive ?? true);
    if (filter === "CUSTOMERS") return account.accountType === "CUSTOMER";
    if (filter === "SUPPLIERS") return account.accountType === "SUPPLIER";
    return true;
  });

  const triggerImportPicker = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const csv = [
      "name,phone,address,tax_number,tax_office,company,balance,account_type,is_active",
      "Ornek Musteri,5551112233,Istanbul,1234567890,Kadikoy,Ornek Ltd,1500.50,CUSTOMER,true",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cari-import-sablon.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setImportError("Yalnizca .xlsx veya .xls dosyalari yukleyin.");
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", importMode);

      const response = await fetch("/api/current-accounts/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Import sirasinda hata olustu.");
      }

      setImportResult(payload as ImportResult);
      await fetchAccounts();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import sirasinda hata olustu.");
    } finally {
      setImporting(false);
    }
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
          <h3 className="text-sm font-medium text-red-800">Hata</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cari Hesaplar</h1>
          <p className="mt-1 text-sm text-gray-500">Musteri ve tedarikci hesaplarinizi yonetin</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sablon Indir
          </button>
          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as "insert" | "upsert")}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="insert">Yalniz Ekle</option>
            <option value="upsert">Varsa Guncelle</option>
          </select>
          <button
            onClick={triggerImportPicker}
            disabled={importing}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {importing ? "Import Ediliyor..." : "Excel Yukle"}
          </button>
          <Link
            href="/current-accounts/new"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Yeni Hesap Ekle
          </Link>
        </div>
      </div>

      {importError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {importError}
        </div>
      )}

      {importResult && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Toplam satir: <strong>{importResult.totalRows}</strong> | Basarili:{" "}
            <strong>{importResult.importedCount}</strong> | Hatali:{" "}
            <strong>{importResult.failedCount}</strong>
          </p>

          {importResult.failures.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs text-red-900">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Satir</th>
                    <th className="px-2 py-1">Deger</th>
                    <th className="px-2 py-1">Hata</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.failures.slice(0, 25).map((failure, idx) => (
                    <tr key={`${failure.row}-${idx}`} className="border-t border-red-100">
                      <td className="px-2 py-1">{failure.row}</td>
                      <td className="px-2 py-1">{failure.value || "-"}</td>
                      <td className="px-2 py-1">{failure.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === "ALL" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Tum Hesaplar
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === "ACTIVE"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilter("PASSIVE")}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === "PASSIVE"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Pasif
          </button>
          <button
            onClick={() => setFilter("CUSTOMERS")}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === "CUSTOMERS"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Musteriler
          </button>
          <button
            onClick={() => setFilter("SUPPLIERS")}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === "SUPPLIERS"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Tedarikciler
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Isim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bakiye
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Islemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{account.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{account.phone || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        account.accountType === "CUSTOMER"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {account.accountType === "CUSTOMER" ? "Musteri" : "Tedarikci"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <span className={(account.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                      {(account.balance || 0) >= 0 ? "TRY " : "-TRY "}
                      {Math.abs(account.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        account.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {account.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Link href={`/current-accounts/${account.id}`} className="text-blue-600 hover:text-blue-900">
                        Goruntule
                      </Link>
                      <Link
                        href={`/current-accounts/${account.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Duzenle
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("Bu hesabi silmek istediginize emin misiniz?")) {
                            deleteAccount(account.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
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

        {accounts.length === 0 && (
          <div className="py-12 text-center">
            <h3 className="text-sm font-medium text-gray-900">Hesap bulunamadi</h3>
            <p className="mt-1 text-sm text-gray-500">Yeni bir hesap olusturarak baslayin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
