"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Account = {
  id: string;
  name?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
  company?: string;
  balance?: number;
  isActive?: boolean;
  accountType?: string;
};

export default function CurrentAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/current-accounts/${params.id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        setAccount(await res.json());
      } catch {
        setError("Hesap bilgisi alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return <div className="py-6">Yukleniyor...</div>;
  }

  if (error || !account) {
    return (
      <div className="py-6">
        <p className="text-red-600">{error || "Hesap bulunamadi."}</p>
        <Link href="/current-accounts" className="text-blue-600 underline">
          Geri don
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{account.name || "Cari Hesap"}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/current-accounts/${account.id}/edit`)}
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            Duzenle
          </button>
          <Link href="/current-accounts" className="px-3 py-2 rounded border">
            Listeye don
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4 space-y-2">
        <p><strong>Telefon:</strong> {account.phone || "-"}</p>
        <p><strong>Adres:</strong> {account.address || "-"}</p>
        <p><strong>Vergi No:</strong> {account.tax_number || "-"}</p>
        <p><strong>Vergi Dairesi:</strong> {account.tax_office || "-"}</p>
        <p><strong>Sirket:</strong> {account.company || "-"}</p>
        <p><strong>Bakiye:</strong> {(account.balance ?? 0).toFixed(2)}</p>
        <p><strong>Durum:</strong> {account.isActive ? "Aktif" : "Pasif"}</p>
        <p><strong>Tur:</strong> {account.accountType || "-"}</p>
      </div>
    </div>
  );
}
