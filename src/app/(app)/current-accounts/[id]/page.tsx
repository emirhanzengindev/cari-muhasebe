"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { downloadAccountStatementPdf } from "@/lib/pdfExports";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { Activity, CalendarClock, Download, Pencil, Plus, Trash2, UserRound, Wallet } from "lucide-react";
import { Alert, Avatar, Card, CardHead, EmptyState, Field, IconButton, PageHeader, Spinner, Status, tl, ui } from "@/components/app-ui/ui";

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

  if (loading) return <Spinner />;

  if (error || !account) {
    return (
      <div className={ui.page}>
        <PageHeader title="Cari Hesap" back={{ href: "/current-accounts", label: "Cari Hesaplar" }} />
        <Alert>{error || "Hesap bulunamadı."}</Alert>
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
      setPdfError("Cari ekstre PDF oluşturulamadı.");
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
      setCollectionError("Tutar 0'dan büyük olmalı.");
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
      setCollectionSuccess("Tahsilat/ödeme kaydedildi.");
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

  const balance = Number(account.balance ?? 0) || 0;
  const supplier = account.accountType === "SUPPLIER";
  const active = account.isActive ?? true;
  const openTotal = openInvoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const movementLabel = (type: string) =>
    type === "COLLECTION" ? "Tahsilat" : type === "PAYMENT" ? "Ödeme" : "Düzeltme";
  const formatDay = (value: unknown) => {
    if (!value) return "—";
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("tr-TR");
  };

  return (
    <div className={ui.page}>
      <PageHeader
        back={{ href: "/current-accounts", label: "Cari Hesaplar" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={account.name || "Cari"} size={36} />
            {account.name || "Cari Hesap"}
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Status tone={supplier ? "violet" : "green"}>{supplier ? "Tedarikçi" : "Müşteri"}</Status>
            <Status tone={active ? "green" : "gray"}>{active ? "Aktif" : "Pasif"}</Status>
          </span>
        }
        actions={
          <>
            <button type="button" onClick={() => router.push(`/current-accounts/${account.id}/edit`)} className={ui.btn}>
              <Pencil aria-hidden="true" />
              Düzenle
            </button>
            <button type="button" onClick={handleDownloadStatement} disabled={downloading} className={ui.btn}>
              <Download aria-hidden="true" />
              {downloading ? "Hazırlanıyor..." : "Ekstre PDF"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCollectionError("");
                setCollectionSuccess("");
                setShowCollectionModal(true);
              }}
              className={ui.btnDark}
            >
              <Plus aria-hidden="true" />
              Tahsilat / Ödeme
            </button>
          </>
        }
      />

      {collectionSuccess && <Alert tone="green">{collectionSuccess}</Alert>}
      {pdfError && <Alert>{pdfError}</Alert>}

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <small className={`block ${ui.soft}`}>Bakiye</small>
          <b className={`mt-1 block text-[20px] font-semibold tabular-nums tracking-[-0.02em] ${balance > 0 ? ui.pos : balance < 0 ? ui.neg : ""}`}>
            {tl(balance)}
          </b>
        </Card>
        <Card className="p-4">
          <small className={`block ${ui.soft}`}>Açık fatura</small>
          <b className="mt-1 block text-[20px] font-semibold tabular-nums">{openInvoices.length}</b>
        </Card>
        <Card className="p-4">
          <small className={`block ${ui.soft}`}>Vadesi geçen</small>
          <b className={`mt-1 block text-[20px] font-semibold tabular-nums ${overdueInvoices.length ? ui.neg : ""}`}>
            {overdueInvoices.length}
          </b>
        </Card>
        <Card className="p-4">
          <small className={`block ${ui.soft}`}>Açık toplam</small>
          <b className="mt-1 block text-[20px] font-semibold tabular-nums tracking-[-0.02em]">{tl(openTotal)}</b>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Card className="self-start">
          <CardHead icon={<UserRound aria-hidden="true" />} title="Hesap bilgileri" />
          <dl>
            {[
              { label: "Telefon", value: account.phone },
              { label: "Şirket", value: account.company },
              { label: "Vergi no", value: account.tax_number },
              { label: "Vergi dairesi", value: account.tax_office },
              { label: "Adres", value: account.address },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-4 border-t border-[#f2f2f3] px-4 py-2.5">
                <dt className={ui.soft}>{row.label}</dt>
                <dd className="text-right font-medium">{row.value || <span className={ui.muted}>—</span>}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="self-start">
          <CardHead icon={<CalendarClock aria-hidden="true" />} title="Vade durumu">
            <Link href="/invoices" className={ui.btn}>
              Faturalar
            </Link>
          </CardHead>
          {overdueInvoices.length === 0 ? (
            <EmptyState
              title={openInvoices.length ? "Vadesi geçen fatura yok" : "Açık fatura yok"}
              description={openInvoices.length ? `${openInvoices.length} açık fatura, toplam ${tl(openTotal)}.` : undefined}
            />
          ) : (
            <ul>
              {overdueInvoices.slice(0, 5).map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center gap-3 border-t border-[#f2f2f3] px-4 py-2.5 hover:bg-[#fafafa]"
                  >
                    <span className="h-8 w-[3px] rounded bg-[var(--app-red)]" aria-hidden="true" />
                    <span className="min-w-0">
                      <b className="block font-medium">Fatura #{invoice.invoice_number || invoice.invoice_no || "—"}</b>
                      <small className={ui.muted}>Vade {formatDay(invoice.due_date || invoice.dueDate)}</small>
                    </span>
                    <span className={`ml-auto ${ui.num} ${ui.neg}`}>{tl(invoiceTotal(invoice))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-3">
        <CardHead icon={<Activity aria-hidden="true" />} title="Tahsilat / Ödeme Hareketleri">
          <span className={ui.muted}>{movements.length} kayıt</span>
        </CardHead>

        {movements.length === 0 ? (
          <EmptyState icon={<Wallet aria-hidden="true" />} title="Henüz tahsilat veya ödeme kaydı yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className={ui.table}>
              <thead>
                <tr>
                  <th scope="col" className={ui.th}>Tür</th>
                  <th scope="col" className={ui.th}>Tarih</th>
                  <th scope="col" className={ui.th}>Tutar</th>
                  <th scope="col" className={ui.th}>Açıklama</th>
                  <th scope="col" className={`${ui.th} text-right`}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className={ui.tr}>
                    <td className={ui.td}>
                      <Status tone={movement.movement_type === "COLLECTION" ? "green" : movement.movement_type === "PAYMENT" ? "red" : "gray"}>
                        {movementLabel(movement.movement_type)}
                      </Status>
                    </td>
                    <td className={`${ui.td} ${ui.soft}`}>{formatDay(movement.document_date)}</td>
                    <td className={`${ui.td} ${ui.num}`}>{tl(Number(movement.amount ?? 0), movement.currency || "TRY")}</td>
                    <td className={`${ui.td} ${ui.soft}`}>{movement.description || <span className={ui.muted}>—</span>}</td>
                    <td className={ui.td}>
                      <div className="flex justify-end">
                        <IconButton
                          label={`${movementLabel(movement.movement_type)} kaydını sil`}
                          danger
                          onClick={() => {
                            setCollectionError("");
                            setCollectionSuccess("");
                            setMovementToDelete(movement);
                          }}
                          disabled={deletingMovementId !== null}
                        >
                          <Trash2 aria-hidden="true" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {movementToDelete && (
        <div className={ui.modalBackdrop}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-collection-title" className={`${ui.modal} max-w-md`}>
            <h2 id="delete-collection-title" className="text-[16px] font-semibold">
              Bu kaydı silmek istediğinize emin misiniz?
            </h2>
            <dl className={`mt-3 grid gap-1 ${ui.soft}`}>
              <div className="flex justify-between">
                <dt>Tutar</dt>
                <dd className="font-medium text-[var(--app-ink)]">
                  {tl(Number(movementToDelete.amount ?? 0), movementToDelete.currency || "TRY")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Tarih</dt>
                <dd className="font-medium text-[var(--app-ink)]">{formatDay(movementToDelete.document_date)}</dd>
              </div>
            </dl>

            {collectionError && <p className="mt-3 text-[var(--app-red)]">{collectionError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setMovementToDelete(null)} className={ui.btn} disabled={deletingMovementId !== null}>
                İptal
              </button>
              <button type="button" onClick={handleDeleteMovement} disabled={deletingMovementId !== null} className={ui.btnDanger}>
                {deletingMovementId ? "Siliniyor..." : "Evet, sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCollectionModal && (
        <div className={ui.modalBackdrop}>
          <div role="dialog" aria-modal="true" aria-labelledby="collection-title" className={`${ui.modal} max-w-md`}>
            <h2 id="collection-title" className="text-[16px] font-semibold">
              Tahsilat / Ödeme Ekle
            </h2>
            <p className={`mt-1 ${ui.soft}`}>{account.name}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="collectionType" label="İşlem tipi">
                <select
                  id="collectionType"
                  value={collectionType}
                  onChange={(e) => setCollectionType(e.target.value as "COLLECTION" | "PAYMENT")}
                  className={ui.input}
                >
                  <option value="COLLECTION">Tahsilat</option>
                  <option value="PAYMENT">Ödeme</option>
                </select>
              </Field>
              <Field id="collectionAmount" label="Tutar (₺)">
                <input
                  id="collectionAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(Number(e.target.value) || 0)}
                  className={ui.input}
                />
              </Field>
              <Field id="collectionDate" label="Tarih">
                <input
                  id="collectionDate"
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className={ui.input}
                />
              </Field>
              <Field id="collectionDocumentNo" label="Dekont no">
                <input
                  id="collectionDocumentNo"
                  type="text"
                  value={collectionDocumentNo}
                  onChange={(e) => setCollectionDocumentNo(e.target.value)}
                  className={ui.input}
                />
              </Field>
              <Field id="collectionDescription" label="Açıklama" className="sm:col-span-2">
                <textarea
                  id="collectionDescription"
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  rows={3}
                  className={ui.textarea}
                />
              </Field>
            </div>

            {collectionError && <p className="mt-3 text-[var(--app-red)]">{collectionError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCollectionModal(false);
                  setCollectionError("");
                }}
                className={ui.btn}
                disabled={savingCollection}
              >
                Vazgeç
              </button>
              <button type="button" onClick={handleSaveCollection} disabled={savingCollection} className={ui.btnDark}>
                {savingCollection ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
