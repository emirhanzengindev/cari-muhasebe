"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { downloadAccountStatementPdf } from "@/lib/pdfExports";

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");
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

        const accountBody = await res.json();
        setAccount(accountBody);

        const txRes = await fetch("/api/transactions", { credentials: "include" });
        const txBody = txRes.ok ? await txRes.json() : [];
        const accountTx = (Array.isArray(txBody) ? txBody : []).filter((tx: any) => {
          const txAccountId =
            tx.account_id ||
            tx.accountId ||
            tx.current_account_id ||
            tx.currentAccountId;
          return String(txAccountId || "") === String(params.id || "");
        });
        setTransactions(accountTx);
      } catch {
        setError("Hesap bilgisi alinamadi.");
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

  const handleDownloadStatement = async () => {
    if (!account) return;
    setDownloading(true);
    setPdfError("");
    try {
      const [invRes, itemRes, productRes] = await Promise.all([
        fetch("/api/invoices", { credentials: "include" }),
        fetch("/api/invoice-items", { credentials: "include" }),
        fetch("/api/products", { credentials: "include" }),
      ]);

      const invoices = invRes.ok ? await invRes.json() : [];
      const invoiceItems = itemRes.ok ? await itemRes.json() : [];
      const products = productRes.ok ? await productRes.json() : [];

      const productNameById = new Map<string, string>();
      for (const p of Array.isArray(products) ? products : []) {
        productNameById.set(String(p.id), String(p.name || p.product_name || "-"));
      }

      const accountInvoices = (Array.isArray(invoices) ? invoices : []).filter((inv: any) => {
        const invAccountId = inv.account_id || inv.current_account_id || inv.accountId || inv.currentAccountId;
        return String(invAccountId || "") === String(account.id);
      });

      const invoiceRows = accountInvoices.flatMap((inv: any) => {
        const invItems = (Array.isArray(invoiceItems) ? invoiceItems : []).filter(
          (it: any) => String(it.invoice_id || it.invoiceId || "") === String(inv.id)
        );

        const invType = String(inv.invoice_type || inv.type || "SALES").toUpperCase();
        const mapAmount = (v: any) => Number(v ?? 0);
        const invDate = inv.date || inv.invoice_date || inv.created_at;
        const invNo = inv.invoice_number || inv.invoice_no || inv.number || "-";
        const invDesc = inv.description || "-";

        if (invItems.length === 0) {
          const total = mapAmount(inv.total_amount ?? inv.total ?? inv.amount);
          return [{
            date: invDate,
            invoiceNo: invNo,
            description: invDesc,
            productName: "-",
            quantity: 0,
            documentType: "Fatura",
            debit: invType === "SALES" ? total : 0,
            credit: invType === "PURCHASE" ? total : 0,
          }];
        }

        return invItems.map((it: any) => {
          const lineTotal = mapAmount(it.total ?? (Number(it.quantity ?? 0) * Number(it.unit_price ?? it.unitPrice ?? 0)));
          const pid = String(it.product_id || it.productId || "");
          return {
            date: invDate,
            invoiceNo: invNo,
            description: invDesc,
            productName: productNameById.get(pid) || pid || "-",
            quantity: Number(it.quantity ?? 0),
            documentType: "Fatura",
            debit: invType === "SALES" ? lineTotal : 0,
            credit: invType === "PURCHASE" ? lineTotal : 0,
          };
        });
      });

      const transactionRows = (Array.isArray(transactions) ? transactions : []).map((tx: any) => {
        const amount = Math.abs(Number(tx.amount ?? 0));
        const txType = String(tx.transaction_type || tx.transactionType || "").toUpperCase();
        const isCredit = txType.includes("PAYMENT") || txType.includes("ODEME");
        return {
          date: tx.date || tx.created_at,
          invoiceNo: "-",
          description: tx.description || "-",
          productName: "-",
          quantity: 0,
          documentType: "Islem",
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
        };
      });

      const statementRows = [...invoiceRows, ...transactionRows];

      await downloadAccountStatementPdf(
        {
          id: account.id,
          name: account.name || "Cari Hesap",
          phone: account.phone || "",
          address: account.address || "",
          taxNumber: account.tax_number || "",
          taxOffice: account.tax_office || "",
          accountType: account.accountType || "",
          balance: Number(account.balance ?? 0),
        },
        statementRows as any
      );
    } catch (err) {
      console.error("Account statement PDF error:", err);
      setPdfError("Cari ekstre PDF olusturulamadi.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{account.name || "Cari Hesap"}</h1>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadStatement}
            disabled={downloading}
            className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
          >
            {downloading ? "Hazirlaniyor..." : "Ekstre PDF Indir"}
          </button>
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
      {pdfError && <p className="text-red-600 text-sm">{pdfError}</p>}
    </div>
  );
}
