"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Download, FileText, Pencil, UserRound } from "lucide-react";
import { downloadInvoicePdf } from "@/lib/pdfExports";
import { Alert, Card, CardHead, DetailGrid, PageHeader, Spinner, Status, tl, ui } from "@/components/app-ui/ui";

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
          throw new Error(body?.error || "Fatura yüklenemedi.");
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
        if (!cancelled) setError(err?.message || "Fatura yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className={ui.page}>
        <PageHeader title="Fatura" back={{ href: "/invoices", label: "Faturalar" }} />
        <Alert>{error}</Alert>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloading(true);
    setPdfError(null);
    try {
      const [itemRes, productRes] = await Promise.all([
        fetch("/api/invoice-items", { credentials: "include" }),
        fetch("/api/products", { credentials: "include" }),
      ]);
      const itemBody = itemRes.ok ? await itemRes.json() : [];
      const productBody = productRes.ok ? await productRes.json() : [];
      const productNameById = new Map<string, string>();
      for (const p of Array.isArray(productBody) ? productBody : []) {
        productNameById.set(String(p.id), String(p.name || p.product_name || ""));
      }
      const invoiceItems = (Array.isArray(itemBody) ? itemBody : [])
        .filter((x: any) => String(x.invoice_id || x.invoiceId || "") === String(invoice.id))
        .map((x: any) => ({
          productName:
            x.product_name ||
            x.productName ||
            x.name ||
            productNameById.get(String(x.product_id || x.productId || "")) ||
            x.product_id ||
            "Kalem",
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
      setPdfError("PDF oluşturulamadı.");
    } finally {
      setDownloading(false);
    }
  };

  const number = invoice?.invoice_number || invoice?.invoice_no || invoice?.number || "";
  const purchase = (invoice?.invoice_type || invoice?.type || "SALES").toUpperCase() === "PURCHASE";
  const rawDate = invoice?.date || invoice?.invoice_date;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const dateText = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString("tr-TR") : "—";
  const total = Number(invoice?.total_amount ?? invoice?.total ?? invoice?.amount ?? 0);

  return (
    <div className={`${ui.page} max-w-4xl`}>
      <PageHeader
        back={{ href: "/invoices", label: "Faturalar" }}
        title={`Fatura #${number || "—"}`}
        description={
          <span className="inline-flex items-center gap-2">
            <Status tone={purchase ? "violet" : "green"}>{purchase ? "Alış" : "Satış"}</Status>
            {dateText}
          </span>
        }
        actions={
          <>
            <Link href={`/invoices/${id}/edit`} className={ui.btn}>
              <Pencil aria-hidden="true" />
              Düzenle
            </Link>
            <button type="button" onClick={handleDownloadPdf} disabled={downloading} className={ui.btnDark}>
              <Download aria-hidden="true" />
              {downloading ? "Hazırlanıyor..." : "PDF İndir"}
            </button>
          </>
        }
      />

      {pdfError && <Alert>{pdfError}</Alert>}

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <small className={`flex items-center gap-1.5 ${ui.soft}`}><FileText size={14} aria-hidden="true" />Toplam tutar</small>
          <b className="mt-1 block text-[20px] font-semibold tabular-nums tracking-[-0.02em]">{tl(total)}</b>
        </Card>
        <Card className="p-4">
          <small className={`flex items-center gap-1.5 ${ui.soft}`}><UserRound size={14} aria-hidden="true" />Cari</small>
          <b className="mt-1 block truncate text-[15px] font-semibold">{accountName || "—"}</b>
        </Card>
        <Card className="p-4">
          <small className={`flex items-center gap-1.5 ${ui.soft}`}><CalendarDays size={14} aria-hidden="true" />Tarih</small>
          <b className="mt-1 block text-[15px] font-semibold">{dateText}</b>
        </Card>
      </div>

      <Card>
        <CardHead icon={<FileText aria-hidden="true" />} title="Fatura bilgileri" />
        <DetailGrid
          items={[
            { label: "Fatura no", value: number || null },
            { label: "Tür", value: purchase ? "Alış" : "Satış" },
            { label: "Ara toplam", value: tl(Number(invoice?.subtotal ?? 0)) },
            { label: "İndirim", value: tl(Number(invoice?.discount ?? 0)) },
            { label: "KDV", value: tl(Number(invoice?.vat_amount ?? 0)) },
            { label: "Genel toplam", value: tl(total) },
          ]}
        />
        {invoice?.description ? (
          <div className="border-t border-[#f2f2f3] px-4 py-3">
            <p className={ui.soft}>Açıklama</p>
            <p className="mt-1">{invoice.description}</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
