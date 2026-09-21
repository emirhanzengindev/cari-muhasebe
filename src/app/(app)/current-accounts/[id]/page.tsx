"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { downloadAccountStatementPdf } from "@/lib/pdfExports";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { Trash2 } from "lucide-react";

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
  const { addCollection, deleteCollection } = useCurrentAccountsStore();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accountInvoices, setAccountInvoices] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [error, setError] = useState("");
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const [collectionSuccess, setCollectionSuccess] = useState("");
  const [movementToDelete, setMovementToDelete] = useState<any | null>(null);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);
  const [collectionType, setCollectionType] = useState<"COLLECTION" | "PAYMENT">("COLLECTION");
  const [collectionAmount, setCollectionAmount] = useState(0);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [collectionDocumentNo, setCollectionDocumentNo] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");

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

        const invoiceRes = await fetch("/api/invoices", { credentials: "include" });
        const invoiceBody = invoiceRes.ok ? await invoiceRes.json() : [];
        const accountInvoiceRows = (Array.isArray(invoiceBody) ? invoiceBody : []).filter((invoice: any) => {
          const invoiceAccountId =
            invoice.account_id ||
            invoice.current_account_id ||
            invoice.accountId ||
            invoice.currentAccountId;
          return String(invoiceAccountId || "") === String(params.id || "");
        });
        setAccountInvoices(accountInvoiceRows);

        const mvRes = await fetch(`/api/current-accounts/${params.id}/collections`, {
          credentials: "include",
        });
        const mvBody = mvRes.ok ? await mvRes.json() : [];
        setMovements(Array.isArray(mvBody) ? mvBody : []);
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

  const openInvoices = accountInvoices.filter((invoice) => {
    const status = String(invoice.status || "").toUpperCase();
    return !invoice.is_draft && !["PAID", "CANCELLED", "CANCELED"].includes(status);
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueInvoices = openInvoices.filter((invoice) => {
    const rawDueDate = invoice.due_date || invoice.dueDate;
    if (!rawDueDate) return false;
    const dueDate = new Date(String(rawDueDate));
    return Number.isFinite(dueDate.getTime()) && dueDate < today;
  });
  const invoiceTotal = (invoice: any) =>
    Number(invoice.total_amount ?? invoice.total ?? invoice.amount ?? 0) || 0;

  const handleDownloadStatement = async () => {
    if (!account) return;
    setDownloading(true);
    setPdfError("");
    try {
      const [invRes, itemRes, productRes, movementRes] = await Promise.all([
        fetch("/api/invoices", { credentials: "include" }),
        fetch("/api/invoice-items", { credentials: "include" }),
        fetch("/api/products", { credentials: "include" }),
        fetch("/api/stock-movements", { credentials: "include" }),
      ]);

      const invoices = invRes.ok ? await invRes.json() : [];
      const invoiceItems = itemRes.ok ? await itemRes.json() : [];
      const products = productRes.ok ? await productRes.json() : [];
      const stockMovements = movementRes.ok ? await movementRes.json() : [];
      const normalizedInvoiceItems = Array.isArray(invoiceItems) ? invoiceItems : [];
      const normalizedStockMovements = Array.isArray(stockMovements) ? stockMovements : [];

      const toStr = (...values: any[]) => {
        for (const value of values) {
          if (value !== undefined && value !== null) {
            const str = String(value).trim();
            if (str) return str;
          }
        }
        return "";
      };
      const toNum = (...values: any[]) => {
        for (const value of values) {
          const n = Number(value);
          if (Number.isFinite(n)) return n;
        }
        return 0;
      };

      const productNameById = new Map<string, string>();
      const productUnitById = new Map<string, string>();
      for (const p of Array.isArray(products) ? products : []) {
        productNameById.set(String(p.id), String(p.name || p.product_name || "-"));
        productUnitById.set(String(p.id), String(p.unit || "metre"));
      }

      const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const hasInvoiceRefInDescription = (description: string, invoiceNo: string, invoiceId: string) => {
        const text = String(description || "");
        if (!text) return false;
        if (invoiceId && text.includes(invoiceId)) return true;
        if (!invoiceNo || invoiceNo === "-") return false;

        const escapedNo = escapeRegExp(invoiceNo);
        const prefixedPattern = new RegExp(`\\b(?:fatura|invoice)[^\\n\\r]*?#?\\s*${escapedNo}\\b`, "i");
        const plainPattern = new RegExp(`(^|[^A-Za-z0-9-])#?${escapedNo}([^A-Za-z0-9-]|$)`, "i");
        return prefixedPattern.test(text) || plainPattern.test(text);
      };

      const accountInvoices = (Array.isArray(invoices) ? invoices : []).filter((inv: any) => {
        const invAccountId = inv.account_id || inv.current_account_id || inv.accountId || inv.currentAccountId;
        return String(invAccountId || "") === String(account.id);
      });

      // Bir stok hareketi tek bir faturaya baglanmali: kullanilan hareketleri isaretliyoruz.
      const usedStockMovementIds = new Set<string>();
      const stockMovementTimeWindowMs = 5 * 60 * 1000;

      // Eski faturalarda invoice_items kaydi hic olusmamis olabilir. Bu durumda urun/birim/
      // miktar/fiyat bilgisi ayni fatura kaydi ile ayni anda olusan stok hareketlerinden
      // kurtarilir. Eslestirme sadece hareketlerin toplami fatura toplamina birebir esitse
      // kabul edilir, boylece borc/alacak/kalan tutarlari hicbir sekilde degismez.
      const matchMovementsByCreationTime = (inv: any) => {
        const invoiceCreatedAt = new Date(
          String(inv.created_at || inv.date || inv.invoice_date || "")
        ).getTime();
        if (!Number.isFinite(invoiceCreatedAt)) return [];

        const invoiceTotal = toNum(inv.total_amount ?? inv.total ?? inv.amount);
        if (invoiceTotal <= 0) return [];

        const expectedMovementType =
          String(inv.invoice_type || inv.type || "SALES").toUpperCase() === "PURCHASE"
            ? "in"
            : "out";

        const candidates = normalizedStockMovements
          .filter((mv: any) => {
            if (!mv?.id || usedStockMovementIds.has(String(mv.id))) return false;
            if (String(mv.movement_type || "").toLowerCase() !== expectedMovementType) {
              return false;
            }
            const movementCreatedAt = new Date(String(mv.created_at || "")).getTime();
            if (!Number.isFinite(movementCreatedAt)) return false;
            return (
              movementCreatedAt >= invoiceCreatedAt &&
              movementCreatedAt - invoiceCreatedAt <= stockMovementTimeWindowMs
            );
          })
          .sort(
            (a: any, b: any) =>
              new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime()
          );

        const matched: any[] = [];
        let runningTotal = 0;

        for (const mv of candidates) {
          matched.push(mv);
          runningTotal +=
            Math.abs(toNum(mv.quantity, 0)) * toNum(mv.price, mv.unit_price, mv.unitPrice);

          if (Math.abs(runningTotal - invoiceTotal) < 0.01) {
            matched.forEach((row: any) => usedStockMovementIds.add(String(row.id)));
            return matched;
          }

          if (runningTotal > invoiceTotal + 0.01) break;
        }

        return [];
      };

      const invoiceRows = accountInvoices.flatMap((inv: any) => {
        const invItems = normalizedInvoiceItems.filter((it: any) => {
          const itemInvoiceId = toStr(
            it.invoice_id,
            it.invoiceId,
            it.fatura_id,
            it.faturaId
          );
          return itemInvoiceId === String(inv.id);
        });

        const invType = String(inv.invoice_type || inv.type || "SALES").toUpperCase();
        const mapAmount = (v: any) => Number(v ?? 0);
        const invDate = inv.date || inv.invoice_date || inv.created_at;
        const invNo = inv.invoice_number || inv.invoice_no || inv.number || "-";
        const invDesc = inv.description || "-";

        if (invItems.length === 0) {
          const matchedMovements = normalizedStockMovements.filter((mv: any) => {
            const mvType = String(mv.movement_type || "").toLowerCase();
            const typeMatch = invType === "PURCHASE" ? mvType === "in" : mvType === "out";
            if (!typeMatch) return false;
            return hasInvoiceRefInDescription(
              String(mv.description || ""),
              String(invNo),
              String(inv.id || "")
            );
          });

          if (matchedMovements.length > 0) {
            matchedMovements.forEach((mv: any) => {
              if (mv?.id) usedStockMovementIds.add(String(mv.id));
            });

            return matchedMovements.map((mv: any) => {
              const pid = toStr(mv.product_id, mv.productId);
              const quantity = Math.abs(toNum(mv.quantity, 0));
              const unitPrice = toNum(mv.price, mv.unit_price, mv.unitPrice);
              const lineTotal = quantity * unitPrice;
              return {
                date: invDate,
                invoiceNo: invNo,
                description: invDesc,
                productName: toStr(productNameById.get(pid), pid) || "-",
                unit: toStr(productUnitById.get(pid), "metre"),
                quantity,
                unitPrice,
                documentType: "Fatura",
                debit: invType === "SALES" ? lineTotal : 0,
                credit: invType === "PURCHASE" ? lineTotal : 0,
              };
            });
          }

          // Aciklama fatura numarasini icermiyorsa satirlar olusma zamanina gore kurtarilir.
          const timeMatchedMovements = matchMovementsByCreationTime(inv);

          if (timeMatchedMovements.length > 0) {
            return timeMatchedMovements.map((mv: any) => {
              const pid = toStr(mv.product_id, mv.productId);
              const quantity = Math.abs(toNum(mv.quantity, 0));
              const unitPrice = toNum(mv.price, mv.unit_price, mv.unitPrice);
              const lineTotal = quantity * unitPrice;
              return {
                date: invDate,
                invoiceNo: invNo,
                description: invDesc,
                productName: toStr(productNameById.get(pid), pid) || "-",
                unit: toStr(productUnitById.get(pid), "metre"),
                quantity,
                unitPrice,
                documentType: "Fatura",
                debit: invType === "SALES" ? lineTotal : 0,
                credit: invType === "PURCHASE" ? lineTotal : 0,
              };
            });
          }

          const total = mapAmount(inv.total_amount ?? inv.total ?? inv.amount);
          return [{
            date: invDate,
            invoiceNo: invNo,
            description: invDesc,
            productName: "-",
            unit: "-",
            quantity: 0,
            unitPrice: 0,
            documentType: "Fatura",
            debit: invType === "SALES" ? total : 0,
            credit: invType === "PURCHASE" ? total : 0,
          }];
        }

        return invItems.map((it: any) => {
          const lineTotal = mapAmount(it.total ?? (Number(it.quantity ?? 0) * Number(it.unit_price ?? it.unitPrice ?? 0)));
          const pid = toStr(it.product_id, it.productId, it.urun_id, it.urunId);
          const unit = toStr(it.unit, it.unit_name, productUnitById.get(pid)) || "metre";
          const productName = toStr(
            it.product_name,
            it.productName,
            it.name,
            productNameById.get(pid),
            pid
          ) || "-";
          return {
            date: invDate,
            invoiceNo: invNo,
            description: invDesc,
            productName,
            unit,
            quantity: toNum(it.quantity, it.qty, it.amount_quantity),
            unitPrice: toNum(it.unit_price ?? it.unitPrice ?? 0),
            currency: inv.currency || it.currency || "TRY",
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
          unit: "-",
          quantity: 0,
          unitPrice: 0,
          currency: tx.currency || "TRY",
          documentType: "Islem",
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
        };
      });

      const movementRows = (Array.isArray(movements) ? movements : []).map((mv: any) => {
        const amount = Math.abs(Number(mv.amount ?? mv.signed_amount ?? 0));
        const direction = Number(mv.direction ?? 0);
        const mvType = String(mv.movement_type || "").toUpperCase();
        const isCredit = direction < 0 || mvType === "COLLECTION" || mvType === "PAYMENT";
        return {
          date: mv.document_date || mv.created_at,
          invoiceNo: mv.document_no || "-",
          description: mv.description || "-",
          productName: "-",
          unit: "-",
          quantity: 0,
          unitPrice: 0,
          currency: mv.currency || "TRY",
          documentType: "Tahsilat/Odeme",
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
        };
      });

      const statementRows = [...invoiceRows, ...transactionRows, ...movementRows];

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

  const refreshAccountData = async () => {
    const [accountRes, movementRes] = await Promise.all([
      fetch(`/api/current-accounts/${params.id}`, { credentials: "include" }),
      fetch(`/api/current-accounts/${params.id}/collections`, { credentials: "include" }),
    ]);

    if (accountRes.ok) {
      setAccount(await accountRes.json());
    }
    if (movementRes.ok) {
      const body = await movementRes.json();
      setMovements(Array.isArray(body) ? body : []);
    }
  };

  const resetCollectionForm = () => {
    setCollectionType("COLLECTION");
    setCollectionAmount(0);
    setCollectionDate(new Date().toISOString().split("T")[0]);
    setCollectionDocumentNo("");
    setCollectionDescription("");
  };

  const handleSaveCollection = async () => {
    setCollectionError("");
    setCollectionSuccess("");

    if (!account?.id) return;

    if (!Number.isFinite(collectionAmount) || collectionAmount <= 0) {
      setCollectionError("Tutar 0'dan buyuk olmali.");
      return;
    }

    try {
      setSavingCollection(true);
      await addCollection(account.id, {
        movementType: collectionType,
        direction: -1,
        amount: collectionAmount,
        documentDate: collectionDate,
        documentNo: collectionDocumentNo || undefined,
        description: collectionDescription || undefined,
        currency: "TRY",
      });

      await refreshAccountData();
      setShowCollectionModal(false);
      resetCollectionForm();
      setCollectionSuccess("Tahsilat/odeme kaydedildi.");
    } catch (err: any) {
      setCollectionError(err?.message || "Tahsilat kaydedilemedi.");
    } finally {
      setSavingCollection(false);
    }
  };

  const handleDeleteMovement = async () => {
    if (!movementToDelete?.id || !account?.id) return;

    setCollectionError("");

    try {
      setDeletingMovementId(movementToDelete.id);
      await deleteCollection(account.id, movementToDelete.id);
      await refreshAccountData();
      setMovementToDelete(null);
      setCollectionSuccess("Tahsilat başarıyla silindi.");
    } catch (err: any) {
      setCollectionError(err?.message || "Tahsilat silinemedi.");
    } finally {
      setDeletingMovementId(null);
    }
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{account.name || "Cari Hesap"}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCollectionError("");
              setCollectionSuccess("");
              setShowCollectionModal(true);
            }}
            className="px-3 py-2 rounded bg-indigo-600 text-white"
          >
            Tahsilat Ekle
          </button>
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
      {collectionSuccess && <p className="text-green-700 text-sm">{collectionSuccess}</p>}
      {pdfError && <p className="text-red-600 text-sm">{pdfError}</p>}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_10px_30px_rgba(28,55,75,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Vade durumu</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Bu cariye ait açık faturaların kısa özeti.</p>
          </div>
          <Link href="/invoices" className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]">Faturalara git</Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--surface-muted)] p-4"><p className="text-xs text-[var(--muted)]">Açık fatura</p><p className="mt-1 text-xl font-bold">{openInvoices.length}</p></div>
          <div className="rounded-xl bg-[#fff3f1] p-4"><p className="text-xs text-[var(--muted)]">Vadesi geçen</p><p className="mt-1 text-xl font-bold text-red-700">{overdueInvoices.length}</p></div>
          <div className="rounded-xl bg-[#f4fbf8] p-4"><p className="text-xs text-[var(--muted)]">Açık toplam</p><p className="mt-1 text-xl font-bold text-[var(--success)]">{openInvoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY</p></div>
        </div>
        {overdueInvoices.length > 0 && (
          <div className="mt-4 space-y-2">
            {overdueInvoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm">
                <span>{invoice.invoice_number || invoice.invoice_no || "Fatura"}</span>
                <span className="font-semibold text-red-700">{invoiceTotal(invoice).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Tahsilat/Odeme Hareketleri</h2>
          <span className="text-sm text-gray-500">{movements.length} kayıt</span>
        </div>

        {movements.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz tahsilat veya ödeme kaydı bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">Tür</th>
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Açıklama</th>
                  <th className="px-3 py-2 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3">
                      {movement.movement_type === "COLLECTION" ? "Tahsilat" : movement.movement_type === "PAYMENT" ? "Ödeme" : "Düzeltme"}
                    </td>
                    <td className="px-3 py-3">
                      {movement.document_date
                        ? new Date(movement.document_date).toLocaleDateString("tr-TR")
                        : "-"}
                    </td>
                    <td className="px-3 py-3 font-medium">
                      {Number(movement.amount ?? 0).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} {movement.currency || "TRY"}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{movement.description || "-"}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        title="Tahsilatı sil"
                        aria-label="Tahsilatı sil"
                        onClick={() => {
                          setCollectionError("");
                          setCollectionSuccess("");
                          setMovementToDelete(movement);
                        }}
                        disabled={deletingMovementId !== null}
                        className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {movementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-collection-title"
            className="w-full max-w-md rounded bg-white p-5 space-y-4"
          >
            <div>
              <h2 id="delete-collection-title" className="text-lg font-semibold">
                Bu tahsilatı silmek istediğinize emin misiniz?
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Tutar: {Number(movementToDelete.amount ?? 0).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} {movementToDelete.currency || "TRY"}
              </p>
              <p className="text-sm text-gray-600">
                Tarih: {movementToDelete.document_date
                  ? new Date(movementToDelete.document_date).toLocaleDateString("tr-TR")
                  : "-"}
              </p>
            </div>

            {collectionError && <p className="text-red-600 text-sm">{collectionError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMovementToDelete(null)}
                className="px-3 py-2 rounded border"
                disabled={deletingMovementId !== null}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteMovement}
                disabled={deletingMovementId !== null}
                className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-60"
              >
                {deletingMovementId ? "Siliniyor..." : "Evet, sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-5 space-y-4">
            <h2 className="text-lg font-semibold">Tahsilat/Odeme Ekle</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Islem Tipi</label>
                <select
                  value={collectionType}
                  onChange={(e) => setCollectionType(e.target.value as "COLLECTION" | "PAYMENT")}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="COLLECTION">Tahsilat</option>
                  <option value="PAYMENT">Odeme</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Tutar</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(Number(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Tarih</label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Dekont No</label>
                <input
                  type="text"
                  value={collectionDocumentNo}
                  onChange={(e) => setCollectionDocumentNo(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Aciklama</label>
                <textarea
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {collectionError && <p className="text-red-600 text-sm">{collectionError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCollectionModal(false);
                  setCollectionError("");
                }}
                className="px-3 py-2 rounded border"
                disabled={savingCollection}
              >
                Vazgec
              </button>
              <button
                type="button"
                onClick={handleSaveCollection}
                disabled={savingCollection}
                className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
              >
                {savingCollection ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
