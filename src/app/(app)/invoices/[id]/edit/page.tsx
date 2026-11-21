"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { Alert, Card, Field, PageHeader, Spinner, ui } from "@/components/app-ui/ui";

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
        if (!res.ok) throw new Error(body?.error || "Fatura bulunamadı.");

        if (cancelled) return;
        setInvoiceNumber(body.invoice_number || body.invoice_no || body.number || "");
        setInvoiceType((body.invoice_type || body.type || "SALES") === "PURCHASE" ? "PURCHASE" : "SALES");
        setDate((body.date || body.invoice_date || "").toString().slice(0, 10));
        setAccountId(body.account_id || body.current_account_id || "");
        setTotalAmount(Number(body.total_amount ?? body.total ?? body.amount ?? 0));
        setDescription(body.description || "");
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
      setError(err?.message || "Fatura güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className={`${ui.page} max-w-3xl`}>
      <PageHeader
        title="Faturayı Düzenle"
        description={invoiceNumber ? `Fatura #${invoiceNumber}` : undefined}
        back={{ href: `/invoices/${id}`, label: "Fatura detayı" }}
      />
      {error && <Alert>{error}</Alert>}

      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field id="invoiceNumber" label="Fatura no">
            <input id="invoiceNumber" className={ui.input} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </Field>
          <Field id="invoiceType" label="Fatura tipi">
            <select
              id="invoiceType"
              className={ui.input}
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as "SALES" | "PURCHASE")}
            >
              <option value="SALES">Satış</option>
              <option value="PURCHASE">Alış</option>
            </select>
          </Field>
          <Field id="date" label="Tarih">
            <input id="date" type="date" className={ui.input} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field id="accountId" label="Cari hesap">
            <select id="accountId" className={ui.input} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Seçiniz</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="totalAmount" label="Tutar (₺)">
            <input
              id="totalAmount"
              type="number"
              step="0.01"
              className={ui.input}
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
            />
          </Field>
          <Field id="description" label="Açıklama" className="sm:col-span-2">
            <textarea id="description" rows={3} className={ui.textarea} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-[var(--app-line)] pt-4 sm:col-span-2">
            <Link href={`/invoices/${id}`} className={ui.btn}>
              Vazgeç
            </Link>
            <button type="submit" disabled={saving} className={ui.btnDark}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
