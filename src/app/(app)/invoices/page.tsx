"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, CalendarDays, CircleDollarSign, FileText, Hash, Plus, Tag, UserRound } from "lucide-react";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import {
  Alert,
  Avatar,
  Card,
  EmptyState,
  PageHeader,
  RowActions,
  SearchInput,
  Spinner,
  Status,
  TableFoot,
  Tabs,
  tl,
  ui,
} from "@/components/app-ui/ui";

type Filter = "ALL" | "SALES" | "PURCHASE" | "DRAFT";

const TABS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "SALES", label: "Satış" },
  { value: "PURCHASE", label: "Alış" },
  { value: "DRAFT", label: "Taslaklar" },
];

const matchesFilter = (invoice: { invoiceType?: string; isDraft?: boolean }, filter: Filter) => {
  if (filter === "SALES") return invoice.invoiceType === "SALES";
  if (filter === "PURCHASE") return invoice.invoiceType === "PURCHASE";
  if (filter === "DRAFT") return Boolean(invoice.isDraft);
  return true;
};

const thInner = "inline-flex items-center gap-1.5";

export default function Invoices() {
  const { invoices, loading, error, fetchInvoices, deleteInvoice } = useInvoiceStore();
  const { accounts, fetchAccounts } = useCurrentAccountsStore();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
  }, [fetchInvoices, fetchAccounts]);

  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.name || "Bilinmeyen cari";
  };

  const allInvoices = invoices || [];
  const q = String(searchTerm ?? "").toLocaleLowerCase("tr-TR");
  const filteredInvoices = allInvoices.filter((invoice) => {
    if (!matchesFilter(invoice, filter)) return false;
    if (!q) return true;
    const invoiceNumber = String(invoice?.invoiceNumber ?? "").toLocaleLowerCase("tr-TR");
    const accountName = getAccountName(invoice.accountId).toLocaleLowerCase("tr-TR");
    return invoiceNumber.includes(q) || accountName.includes(q);
  });
  const filteredTotal = filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.totalAmount) || 0), 0);

  const formatInvoiceDate = (value: unknown) => {
    const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("tr-TR");
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className={ui.page}>
        <PageHeader title="Faturalar" />
        <Alert>{error}</Alert>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <PageHeader
        title="Faturalar"
        description="Satış ve alış faturalarınızı yönetin"
        actions={
          <Link href="/invoices/new" className={ui.btnDark}>
            <Plus aria-hidden="true" />
            Yeni Fatura Oluştur
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 pt-3.5">
          <Tabs
            items={TABS.map((tab) => ({
              ...tab,
              count: allInvoices.filter((invoice) => matchesFilter(invoice, tab.value)).length,
            }))}
            value={filter}
            onChange={setFilter}
            label="Fatura filtresi"
          />
          <div className="w-full sm:ml-auto sm:w-auto">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Fatura veya cari ara..." />
          </div>
        </div>

        {filteredInvoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className={ui.table}>
              <thead>
                <tr>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Hash size={13} className={ui.muted} aria-hidden="true" />Fatura</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><CalendarDays size={13} className={ui.muted} aria-hidden="true" />Tarih</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><UserRound size={13} className={ui.muted} aria-hidden="true" />Müşteri / Tedarikçi</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Tag size={13} className={ui.muted} aria-hidden="true" />Tür</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><CircleDollarSign size={13} className={ui.muted} aria-hidden="true" />Tutar</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Activity size={13} className={ui.muted} aria-hidden="true" />Durum</span>
                  </th>
                  <th scope="col" className={`${ui.th} text-right`}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const accountName = getAccountName(invoice.accountId);
                  const sales = invoice.invoiceType === "SALES";
                  const label = `Fatura #${invoice.invoiceNumber || "—"}`;
                  return (
                    <tr key={invoice.id} className={ui.tr}>
                      <td className={`${ui.td} ${ui.num}`}>
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          #{invoice.invoiceNumber || "—"}
                        </Link>
                      </td>
                      <td className={`${ui.td} ${ui.soft}`}>{formatInvoiceDate(invoice.date)}</td>
                      <td className={ui.td}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={accountName} size={26} />
                          {accountName}
                        </span>
                      </td>
                      <td className={ui.td}>
                        <Status tone={sales ? "green" : "violet"}>{sales ? "Satış" : "Alış"}</Status>
                      </td>
                      <td className={`${ui.td} ${ui.num}`}>{tl(Number(invoice.totalAmount) || 0)}</td>
                      <td className={ui.td}>
                        <Status tone={invoice.isDraft ? "amber" : "green"}>
                          {invoice.isDraft ? "Taslak" : "Tamamlandı"}
                        </Status>
                      </td>
                      <td className={ui.td}>
                        <RowActions
                          name={label}
                          viewHref={`/invoices/${invoice.id}`}
                          editHref={`/invoices/${invoice.id}/edit`}
                          onDelete={async () => {
                            if (confirm(`${label} silinsin mi?`)) {
                              try {
                                await deleteInvoice(invoice.id);
                              } catch (err: any) {
                                alert(err?.message || "Fatura silinirken hata oluştu.");
                              }
                            }
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {allInvoices.length === 0 ? (
          <EmptyState
            icon={<FileText aria-hidden="true" />}
            title="Henüz fatura yok"
            description="Yeni bir fatura oluşturarak başlayın."
            action={
              <Link href="/invoices/new" className={ui.btnDark}>
                <Plus aria-hidden="true" />
                Yeni Fatura Oluştur
              </Link>
            }
          />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState title="Bu filtreye uyan fatura yok" />
        ) : (
          <TableFoot>
            <span>
              {filteredInvoices.length} fatura gösteriliyor
              {filteredInvoices.length !== allInvoices.length ? ` · toplam ${allInvoices.length}` : ""}
            </span>
            <span className={ui.num}>Toplam: {tl(filteredTotal)}</span>
          </TableFoot>
        )}
      </Card>
    </div>
  );
}
