"use client";

import { useState, useEffect } from "react";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { Activity, FileText, Landmark, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Alert, Avatar, Card, CardHead, EmptyState, PageHeader, Spinner, Status, Tabs, tl, ui } from "@/components/app-ui/ui";

type TabKey = "overview" | "safes" | "banks" | "transactions" | "cheques";

export default function Finance() {
  const { 
    safes, 
    banks, 
    transactions, 
    cheques, 
    loading, 
    error, 
    fetchSafes, 
    fetchBanks, 
    fetchTransactions, 
    fetchCheques,
    addSafe,
  } = useFinanceStore();
  
  const { accounts, fetchAccounts } = useCurrentAccountsStore();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showSafeModal, setShowSafeModal] = useState(false);
  const [safeName, setSafeName] = useState("");
  const [safeError, setSafeError] = useState("");
  const [safeSaving, setSafeSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchSafes(),
      fetchBanks(),
      fetchTransactions(),
      fetchCheques(),
      fetchAccounts()
    ]);
  }, [fetchSafes, fetchBanks, fetchTransactions, fetchCheques, fetchAccounts]);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : "Bilinmeyen cari";
  };

  const formatDate = (date: Date) => {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("tr-TR");
  };

  const formatCurrency = (amount: number) => {
    return tl(Number(amount) || 0);
  };

  const handleAddSafe = async () => {
    const name = safeName.trim();
    if (!name) {
      setSafeError("Kasa adı zorunludur.");
      return;
    }

    setSafeSaving(true);
    setSafeError("");
    try {
      await addSafe({ name, tenantId: "" });
      const storeError = useFinanceStore.getState().error;
      if (storeError) {
        setSafeError(storeError);
        return;
      }
      setSafeName("");
      setShowSafeModal(false);
      await fetchSafes();
    } catch (saveError) {
      setSafeError(saveError instanceof Error ? saveError.message : "Kasa eklenemedi.");
    } finally {
      setSafeSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const totalCash = safes.reduce((sum, safe) => sum + (Number(safe.balance) || 0), 0);
  const totalBank = banks.reduce((sum, bank) => sum + (Number(bank.balance) || 0), 0);
  const totalReceivable =
    accounts
      ?.filter((a) => a.accountType === "CUSTOMER")
      .reduce((sum, account) => sum + (account.balance > 0 ? account.balance : 0), 0) || 0;
  const totalPayable = Math.abs(
    accounts
      ?.filter((a) => a.accountType === "SUPPLIER")
      .reduce((sum, account) => sum + (account.balance < 0 ? account.balance : 0), 0) || 0
  );

  const stats = [
    { label: "Toplam Nakit", value: totalCash, icon: Wallet, tint: { background: "var(--app-accent-soft)", color: "var(--app-accent)" }, tone: "" },
    { label: "Toplam Banka Bakiyesi", value: totalBank, icon: Landmark, tint: { background: "#eff6ff", color: "#2563eb" }, tone: "" },
    { label: "Toplam Alacaklar", value: totalReceivable, icon: TrendingUp, tint: { background: "#f5f3ff", color: "#7c3aed" }, tone: ui.pos },
    { label: "Toplam Borçlar", value: totalPayable, icon: TrendingDown, tint: { background: "var(--app-red-soft)", color: "var(--app-red)" }, tone: ui.neg },
  ];

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: "overview", label: "Genel Bakış" },
    { value: "safes", label: "Kasa Hesapları", count: safes.length },
    { value: "banks", label: "Banka Hesapları", count: banks.length },
    { value: "transactions", label: "İşlemler", count: transactions.length },
    { value: "cheques", label: "Çekler ve Senetler", count: cheques.length },
  ];

  const transactionTable = (rows: typeof transactions) => (
    <div className="overflow-x-auto">
      <table className={ui.table}>
        <thead>
          <tr>
            <th scope="col" className={ui.th}>Tarih</th>
            <th scope="col" className={ui.th}>Açıklama</th>
            <th scope="col" className={ui.th}>Hesap</th>
            <th scope="col" className={ui.th}>Tür</th>
            <th scope="col" className={`${ui.th} text-right`}>Tutar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((transaction) => {
            const collection = transaction.transactionType === "COLLECTION";
            return (
              <tr key={transaction.id} className={ui.tr}>
                <td className={`${ui.td} ${ui.soft}`}>{formatDate(transaction.date)}</td>
                <td className={ui.td}>{transaction.description || <span className={ui.muted}>—</span>}</td>
                <td className={ui.td}>
                  {transaction.accountId ? getAccountName(transaction.accountId) : <span className={ui.muted}>—</span>}
                </td>
                <td className={ui.td}>
                  <Status tone={collection ? "green" : "red"}>{collection ? "Tahsilat" : "Ödeme"}</Status>
                </td>
                <td className={`${ui.td} ${ui.num} text-right ${collection ? ui.pos : ui.neg}`}>
                  {collection ? "+" : "−"}
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={ui.page}>
      <PageHeader
        title="Finans"
        description="Kasa, banka ve günlük para hareketlerini tek merkezden takip edin"
        actions={
          <button
            type="button"
            onClick={() => {
              setSafeError("");
              setShowSafeModal(true);
            }}
            className={ui.btnDark}
          >
            <Plus aria-hidden="true" />
            Kasa Ekle
          </button>
        }
      />

      {error && (
        <Alert tone="amber">
          <b className="font-semibold">Finans verilerinde uyarı.</b> Bazı hesaplar yüklenemedi; mevcut veriler
          görüntüleniyor.
        </Alert>
      )}

      <div className="mb-3.5">
        <Tabs items={tabs} value={activeTab} onChange={setActiveTab} label="Finans bölümleri" />
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4">
                  <span className="mb-3.5 grid h-[34px] w-[34px] place-items-center rounded-[9px]" style={stat.tint} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <small className={`block ${ui.soft}`}>{stat.label}</small>
                  <b className={`mt-1 block text-[20px] font-semibold tracking-[-0.02em] tabular-nums ${stat.tone}`}>
                    {formatCurrency(stat.value)}
                  </b>
                </Card>
              );
            })}
          </div>

          <Card className="mt-3">
            <CardHead icon={<Activity aria-hidden="true" />} title="Son İşlemler">
              {transactions.length > 5 ? (
                <button type="button" onClick={() => setActiveTab("transactions")} className={ui.btn}>
                  Tümü
                </button>
              ) : null}
            </CardHead>
            {transactions.length === 0 ? (
              <EmptyState icon={<Wallet aria-hidden="true" />} title="Henüz kasa veya banka hareketi yok" />
            ) : (
              transactionTable(transactions.slice(0, 5))
            )}
          </Card>
        </>
      )}

      {activeTab === "safes" && (
        <Card>
          <CardHead icon={<Wallet aria-hidden="true" />} title="Kasa Hesapları" />
          {safes.length === 0 ? (
            <EmptyState
              icon={<Wallet aria-hidden="true" />}
              title="Henüz kasa hesabı yok"
              description="Fiziksel nakdinizi takip etmek için bir kasa oluşturun."
              action={
                <button type="button" onClick={() => setShowSafeModal(true)} className={ui.btnDark}>
                  <Plus aria-hidden="true" />
                  Kasa Ekle
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ui.th}>Ad</th>
                    <th scope="col" className={`${ui.th} text-right`}>Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  {safes.map((safe) => (
                    <tr key={safe.id} className={ui.tr}>
                      <td className={ui.td}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={safe.name} square size={28} />
                          <span className="font-medium">{safe.name}</span>
                        </span>
                      </td>
                      <td className={`${ui.td} ${ui.num} text-right ${safe.balance >= 0 ? ui.pos : ui.neg}`}>
                        {formatCurrency(safe.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "banks" && (
        <Card>
          <CardHead icon={<Landmark aria-hidden="true" />} title="Banka Hesapları" />
          {banks.length === 0 ? (
            <EmptyState icon={<Landmark aria-hidden="true" />} title="Henüz banka hesabı yok" />
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ui.th}>Ad</th>
                    <th scope="col" className={ui.th}>IBAN</th>
                    <th scope="col" className={`${ui.th} text-right`}>Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map((bank) => (
                    <tr key={bank.id} className={ui.tr}>
                      <td className={ui.td}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={bank.name} square size={28} />
                          <span className="font-medium">{bank.name}</span>
                        </span>
                      </td>
                      <td className={`${ui.td} ${ui.soft} tabular-nums`}>{bank.iban || <span className={ui.muted}>—</span>}</td>
                      <td className={`${ui.td} ${ui.num} text-right ${bank.balance >= 0 ? ui.pos : ui.neg}`}>
                        {formatCurrency(bank.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "transactions" && (
        <Card>
          <CardHead icon={<Activity aria-hidden="true" />} title="İşlemler" />
          {transactions.length === 0 ? (
            <EmptyState icon={<Activity aria-hidden="true" />} title="Henüz işlem yok" />
          ) : (
            transactionTable(transactions)
          )}
        </Card>
      )}

      {activeTab === "cheques" && (
        <Card>
          <CardHead icon={<FileText aria-hidden="true" />} title="Çekler ve Senetler" />
          {cheques.length === 0 ? (
            <EmptyState icon={<FileText aria-hidden="true" />} title="Henüz çek veya senet yok" />
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ui.th}>Veriliş</th>
                    <th scope="col" className={ui.th}>Vade</th>
                    <th scope="col" className={ui.th}>Düzenleyen</th>
                    <th scope="col" className={ui.th}>Tür</th>
                    <th scope="col" className={ui.th}>Tutar</th>
                    <th scope="col" className={ui.th}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cheques.map((cheque) => (
                    <tr key={cheque.id} className={ui.tr}>
                      <td className={`${ui.td} ${ui.soft}`}>{formatDate(cheque.issueDate)}</td>
                      <td className={`${ui.td} ${ui.soft}`}>{formatDate(cheque.maturityDate)}</td>
                      <td className={ui.td}>
                        {cheque.issuerName}
                        {cheque.accountId && (
                          <small className={`block ${ui.muted}`}>{getAccountName(cheque.accountId)}</small>
                        )}
                      </td>
                      <td className={ui.td}>
                        <Status tone={cheque.chequeType === "CHEQUE" ? "blue" : "violet"}>
                          {cheque.chequeType === "CHEQUE" ? "Çek" : "Senet"}
                        </Status>
                      </td>
                      <td className={`${ui.td} ${ui.num}`}>{formatCurrency(cheque.amount)}</td>
                      <td className={ui.td}>
                        <Status tone={cheque.status === "PENDING" ? "amber" : cheque.status === "COLLECTED" ? "green" : "red"}>
                          {cheque.status === "PENDING" ? "Beklemede" : cheque.status === "COLLECTED" ? "Tahsil edildi" : "Karşılıksız"}
                        </Status>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showSafeModal && (
        <div className={ui.modalBackdrop}>
          <div className={`${ui.modal} max-w-md`} role="dialog" aria-modal="true" aria-labelledby="safe-modal-title">
            <h2 id="safe-modal-title" className="text-[16px] font-semibold">
              Yeni Kasa Hesabı
            </h2>
            <p className={`mt-1 ${ui.soft}`}>Fiziksel nakit paranızı takip etmek için bir kasa oluşturun.</p>
            <label className={`${ui.label} mt-5`} htmlFor="safe-name">
              Kasa adı
            </label>
            <input
              id="safe-name"
              autoFocus
              value={safeName}
              onChange={(event) => setSafeName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void handleAddSafe()}
              placeholder="Örn. Merkez Kasa"
              className={ui.input}
            />
            {safeError && <p className="mt-2 text-[var(--app-red)]">{safeError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSafeModal(false)} className={ui.btn} disabled={safeSaving}>
                İptal
              </button>
              <button type="button" onClick={handleAddSafe} className={ui.btnDark} disabled={safeSaving}>
                {safeSaving ? "Kaydediliyor..." : "Kasa Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
