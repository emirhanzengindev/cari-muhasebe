"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type InvoiceDetail = {
  id: string;
  invoice_number?: string;
  invoice_type?: string;
  total_amount?: number;
  date?: string;
  description?: string;
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/invoices/${id}`, { credentials: "include" });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error || "Invoice could not be loaded");
        }
        if (!cancelled) setInvoice(body);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Invoice could not be loaded");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="py-6">Yukleniyor...</div>;
  }

  if (error) {
    return (
      <div className="py-6">
        <p className="text-red-600">{error}</p>
        <Link href="/invoices" className="text-blue-600 hover:text-blue-800">
          Faturalara don
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900">Fatura Detayi</h1>
      <div className="mt-4 space-y-2 text-sm text-gray-800">
        <div><strong>ID:</strong> {invoice?.id}</div>
        <div><strong>No:</strong> {invoice?.invoice_number || "-"}</div>
        <div><strong>Tur:</strong> {invoice?.invoice_type || "-"}</div>
        <div><strong>Tutar:</strong> {Number(invoice?.total_amount || 0).toFixed(2)}</div>
        <div><strong>Tarih:</strong> {invoice?.date ? new Date(invoice.date).toLocaleDateString() : "-"}</div>
        <div><strong>Aciklama:</strong> {invoice?.description || "-"}</div>
      </div>
      <div className="mt-6 flex gap-4">
        <Link href={`/invoices/${id}/edit`} className="text-blue-600 hover:text-blue-800">
          Duzenle
        </Link>
        <Link href="/invoices" className="text-gray-700 hover:text-gray-900">
          Listeye don
        </Link>
      </div>
    </div>
  );
}

