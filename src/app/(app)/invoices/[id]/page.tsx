"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { downloadInvoicePdf } from "@/lib/pdfExports";

type InvoiceDetail = {
  id: string;
  invoice_number?: string;
  invoice_no?: string;
  number?: string;
  invoice_type?: string;
  type?: string;
  total_amount?: number;
  total?: number;
  amount?: number;
  subtotal?: number;
  discount?: number;
  vat_amount?: number;
  date?: string;
  invoice_date?: string;
  description?: string;
  account_id?: string;
  current_account_id?: string;
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [accountName, setAccountName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
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
        if (!cancelled) {
          setInvoice(body);

          const accountId = body.account_id || body.current_account_id;
          if (accountId) {
            const accRes = await fetch(`/api/current-accounts/${accountId}`, {
              credentials: "include",
            });
            if (accRes.ok) {
              const accBody = await accRes.json();
              setAccountName(accBody?.name || "");
            }
          }
        }
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

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloading(true);
    setPdfError(null);
    try {
      const itemRes = await fetch("/api/invoice-items", { credentials: "include" });
      const itemBody = itemRes.ok ? await itemRes.json() : [];
      const invoiceItems = (Array.isArray(itemBody) ? itemBody : [])
        .filter((x: any) => (x.invoice_id || x.invoiceId) === invoice.id)
        .map((x: any) => ({
          productName: x.product_name || x.name || x.product_id || "Kalem",
          quantity: Number(x.quantity ?? 0),
          unitPrice: Number(x.unit_price ?? x.unitPrice ?? 0),
          total: Number(x.total ?? 0),
        }));

      await downloadInvoicePdf(
        {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number || invoice.invoice_no || invoice.number || invoice.id,
          invoiceType: invoice.invoice_type || invoice.type || "-",
          date: invoice.date || invoice.invoice_date,
          totalAmount: Number(invoice.total_amount ?? invoice.total ?? invoice.amount ?? 0),
          subtotal: Number(invoice.subtotal ?? 0),
          discount: Number(invoice.discount ?? 0),
          vatAmount: Number(invoice.vat_amount ?? 0),
          description: invoice.description || "",
          accountName: accountName || "-",
        },
        invoiceItems
      );
    } catch (err) {
      console.error("Invoice PDF error:", err);
      setPdfError("PDF olusturulamadi");
    } finally {
      setDownloading(false);
    }
  };

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
      {pdfError && <p className="mt-4 text-red-600 text-sm">{pdfError}</p>}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
        >
          {downloading ? "Hazirlaniyor..." : "PDF Indir"}
        </button>
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
