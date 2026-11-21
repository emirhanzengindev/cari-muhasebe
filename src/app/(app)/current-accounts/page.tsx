"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CircleDollarSign,
  Download,
  Package,
  Phone,
  Plus,
  Tag,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
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

type ImportFailure = {
  row: number;
  reason: string;
  value?: string;
};

type ImportResult = {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  failures: ImportFailure[];
};

type Filter = "ALL" | "ACTIVE" | "PASSIVE" | "CUSTOMERS" | "SUPPLIERS";

const TABS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "PASSIVE", label: "Pasif" },
  { value: "CUSTOMERS", label: "Müşteriler" },
  { value: "SUPPLIERS", label: "Tedarikçiler" },
];

const matchesFilter = (account: { isActive?: boolean; accountType?: string }, filter: Filter) => {
  if (filter === "ACTIVE") return account.isActive ?? true;
  if (filter === "PASSIVE") return !(account.isActive ?? true);
  if (filter === "CUSTOMERS") return account.accountType === "CUSTOMER";
  if (filter === "SUPPLIERS") return account.accountType === "SUPPLIER";
  return true;
};

const thInner = "inline-flex items-center gap-1.5";

export default function CurrentAccounts() {
  const { accounts, loading, error, fetchAccounts, deleteAccount } = useCurrentAccountsStore();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<"insert" | "upsert">("insert");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const validAccounts = (accounts || []).filter((account) => account && account.id);
  const q = query.trim().toLocaleLowerCase("tr-TR");
  const filteredAccounts = validAccounts
    .filter((account) => matchesFilter(account, filter))
    .filter(
      (account) =>
        !q ||
        String(account.name ?? "").toLocaleLowerCase("tr-TR").includes(q) ||
        String(account.phone ?? "").includes(q)
    );
  const filteredNet = filteredAccounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);

  const triggerImportPicker = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const csv = [
      "name,phone,address,tax_number,tax_office,company,balance,account_type,is_active",
      "Ornek Musteri,5551112233,Istanbul,1234567890,Kadikoy,Ornek Ltd,1500.50,CUSTOMER,true",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cari-import-sablon.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setImportError("Yalnızca .xlsx veya .xls dosyaları yükleyin.");
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", importMode);

      const response = await fetch("/api/current-accounts/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "İçe aktarma sırasında hata oluştu.");
      }

      setImportResult(payload as ImportResult);
      await fetchAccounts();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "İçe aktarma sırasında hata oluştu.");
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className={ui.page}>
        <PageHeader title="Cari Hesaplar" />
        <Alert>{error}</Alert>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <PageHeader
        title="Cari Hesaplar"
        description="Müşteri ve tedarikçi hesaplarınızı yönetin"
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <button type="button" onClick={downloadTemplate} className={ui.btn}>
              <Download aria-hidden="true" />
              Şablon İndir
            </button>
            <label className="sr-only" htmlFor="import-mode">
              İçe aktarma modu
            </label>
            <select
              id="import-mode"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as "insert" | "upsert")}
              className={ui.btn}
            >
              <option value="insert">Yalnız ekle</option>
              <option value="upsert">Varsa güncelle</option>
            </select>
            <button type="button" onClick={triggerImportPicker} disabled={importing} className={ui.btn}>
              <Upload aria-hidden="true" />
              {importing ? "İçe aktarılıyor..." : "Excel Yükle"}
            </button>
            <Link href="/current-accounts/new" className={ui.btnDark}>
              <Plus aria-hidden="true" />
              Yeni Hesap Ekle
            </Link>
          </>
        }
      />

      {importError && <Alert>{importError}</Alert>}

      {importResult && (
        <Alert tone={importResult.failedCount > 0 ? "amber" : "green"}>
          <p>
            Toplam satır: <strong>{importResult.totalRows}</strong> · Başarılı:{" "}
            <strong>{importResult.importedCount}</strong> · Hatalı: <strong>{importResult.failedCount}</strong>
          </p>

          {importResult.failures.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 font-medium">Satır</th>
                    <th className="px-2 py-1 font-medium">Değer</th>
                    <th className="px-2 py-1 font-medium">Hata</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.failures.slice(0, 25).map((failure, idx) => (
                    <tr key={`${failure.row}-${idx}`} className="border-t border-black/5">
                      <td className="px-2 py-1">{failure.row}</td>
                      <td className="px-2 py-1">{failure.value || "-"}</td>
                      <td className="px-2 py-1">{failure.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Alert>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 pt-3.5">
          <Tabs
            items={TABS.map((tab) => ({
              ...tab,
              count: validAccounts.filter((account) => matchesFilter(account, tab.value)).length,
            }))}
            value={filter}
            onChange={setFilter}
            label="Cari filtresi"
          />
          <div className="w-full sm:ml-auto sm:w-auto">
            <SearchInput value={query} onChange={setQuery} placeholder="Cari ara..." />
          </div>
        </div>

        {filteredAccounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className={ui.table}>
              <thead>
                <tr>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><UserRound size={13} className={ui.muted} aria-hidden="true" />İsim</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Phone size={13} className={ui.muted} aria-hidden="true" />Telefon</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Tag size={13} className={ui.muted} aria-hidden="true" />Tip</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><CircleDollarSign size={13} className={ui.muted} aria-hidden="true" />Bakiye</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Activity size={13} className={ui.muted} aria-hidden="true" />Durum</span>
                  </th>
                  <th scope="col" className={`${ui.th} text-right`}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const balance = Number(account.balance) || 0;
                  const name = account.name || "Adsız cari";
                  const active = account.isActive ?? true;
                  const supplier = account.accountType === "SUPPLIER";
                  return (
                    <tr key={account.id} className={ui.tr}>
                      <td className={ui.td}>
                        <Link href={`/current-accounts/${account.id}`} className="flex items-center gap-2.5">
                          <Avatar name={name} />
                          <span className="font-medium">{name}</span>
                        </Link>
                      </td>
                      <td className={`${ui.td} ${ui.soft}`}>
                        {account.phone || <span className={ui.muted}>—</span>}
                      </td>
                      <td className={ui.td}>
                        <span className="inline-flex items-center gap-[7px]">
                          <i
                            className="grid h-[22px] w-[22px] place-items-center rounded-md"
                            style={
                              supplier
                                ? { background: "#f5f3ff", color: "#7c3aed" }
                                : { background: "var(--app-accent-soft)", color: "var(--app-accent)" }
                            }
                            aria-hidden="true"
                          >
                            {supplier ? <Package size={13} /> : <UserRound size={13} />}
                          </i>
                          {supplier ? "Tedarikçi" : "Müşteri"}
                        </span>
                      </td>
                      <td className={`${ui.td} ${ui.num} ${balance > 0 ? ui.pos : balance < 0 ? ui.neg : ui.muted}`}>
                        {tl(balance)}
                      </td>
                      <td className={ui.td}>
                        <Status tone={active ? "green" : "gray"}>{active ? "Aktif" : "Pasif"}</Status>
                      </td>
                      <td className={ui.td}>
                        <RowActions
                          name={name}
                          viewHref={`/current-accounts/${account.id}`}
                          editHref={`/current-accounts/${account.id}/edit`}
                          onDelete={() => {
                            if (confirm(`"${name}" hesabını silmek istediğinize emin misiniz?`)) {
                              deleteAccount(account.id);
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

        {validAccounts.length === 0 ? (
          <EmptyState
            icon={<Users aria-hidden="true" />}
            title="Henüz cari hesap yok"
            description="Yeni bir hesap oluşturarak veya Excel dosyasından içe aktararak başlayın."
            action={
              <Link href="/current-accounts/new" className={ui.btnDark}>
                <Plus aria-hidden="true" />
                Yeni Hesap Ekle
              </Link>
            }
          />
        ) : filteredAccounts.length === 0 ? (
          <EmptyState title="Bu filtreye uyan hesap yok" />
        ) : (
          <TableFoot>
            <span>{filteredAccounts.length} hesap gösteriliyor</span>
            <span className={ui.num}>
              Net bakiye:{" "}
              <span className={filteredNet > 0 ? ui.pos : filteredNet < 0 ? ui.neg : ui.muted}>
                {tl(filteredNet)}
              </span>
            </span>
          </TableFoot>
        )}
      </Card>
    </div>
  );
}
