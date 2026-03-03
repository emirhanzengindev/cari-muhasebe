"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { updateInvoice } = useInvoiceStore();
  const { accounts, fetchAccounts } = useCurrentAccountsStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceType, setInvoiceType] = useState<"SALES" | "PURCHASE">("SALES");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        await fetchAccounts();

        const res = await fetch(`/api/invoices/${id}`, { credentials: "include" });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Fatura bulunamadi");

        if (cancelled) return;
        setInvoiceNumber(body.invoice_number || body.invoice_no || body.number || "");
        setInvoiceType((body.invoice_type || body.type || "SALES") === "PURCHASE" ? "PURCHASE" : "SALES");
        setDate((body.date || body.invoice_date || "").toString().slice(0, 10));
        setAccountId(body.account_id || body.current_account_id || "");
        setTotalAmount(Number(body.total_amount ?? body.total ?? body.amount ?? 0));
        setDescription(body.description || "");
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Fatura yuklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, fetchAccounts]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);
    try {
      await updateInvoice(id, {
        invoiceNumber,
        invoiceType,
        date: new Date(date),
        accountId,
        totalAmount,
        description,
      } as any);
      router.push(`/invoices/${id}`);
    } catch (err: any) {
      setError(err?.message || "Fatura guncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6">Yukleniyor...</div>;
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900">Fatura Duzenle</h1>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <div>
          <label className="block text-sm mb-1">Fatura No</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Fatura Tipi</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value as "SALES" | "PURCHASE")}
          >
            <option value="SALES">Satis</option>
            <option value="PURCHASE">Alis</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Tarih</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Cari Hesap</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Seciniz</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Tutar</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            value={totalAmount}
            onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Aciklama</label>
          <textarea
            rows={3}
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <Link href={`/invoices/${id}`} className="px-4 py-2 rounded border border-gray-300 text-gray-700">
            Vazgec
          </Link>
        </div>
      </form>

      <div className="mt-4 flex gap-4">
        <Link href={`/invoices/${id}`} className="text-blue-600 hover:text-blue-800">
          Fatura detayina git
        </Link>
        <Link href="/invoices" className="text-gray-700 hover:text-gray-900">
          Fatura listesine don
        </Link>
      </div>
    </div>
  );
}
