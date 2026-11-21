"use client";

import { useState, useEffect } from "react";
import { BarChart3, Package, Users } from "lucide-react";
import { useReportStore } from "@/stores/reportStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { Alert, Avatar, Card, CardHead, EmptyState, PageHeader, Spinner, Status, Tabs, tl, ui } from "@/components/app-ui/ui";

type TabKey = "profitLoss" | "salesByProduct" | "accountBalances";

export default function Reports() {
  const {
    monthlyProfitLoss,
    salesByProduct,
    loading,
    error,
    fetchMonthlyProfitLoss,
    fetchSalesByProduct,
  } = useReportStore();

  const { accounts, fetchAccounts } = useCurrentAccountsStore();
  const [activeTab, setActiveTab] = useState<TabKey>("profitLoss");

  useEffect(() => {
    Promise.all([fetchMonthlyProfitLoss(), fetchSalesByProduct(), fetchAccounts()]);
  }, [fetchMonthlyProfitLoss, fetchSalesByProduct, fetchAccounts]);

  const formatCurrency = (amount: number) => tl(Number(amount) || 0);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className={ui.page}>
        <PageHeader title="Raporlar" />
        <Alert>{error}</Alert>
      </div>
    );
  }

  const tabs: { value: TabKey; label: string }[] = [
    { value: "profitLoss", label: "Kâr / Zarar" },
    { value: "salesByProduct", label: "Ürün Bazlı Satış" },
    { value: "accountBalances", label: "Cari Bakiyeler" },
  ];

  return (
    <div className={ui.page}>
      <PageHeader title="Raporlar" description="Satış, kâr-zarar ve cari bakiye raporları" />

      <div className="mb-3.5">
        <Tabs items={tabs} value={activeTab} onChange={setActiveTab} label="Rapor türü" />
      </div>

      {activeTab === "profitLoss" && (
        <Card>
          <CardHead icon={<BarChart3 aria-hidden="true" />} title="Aylık Kâr / Zarar" />
          {monthlyProfitLoss.length === 0 ? (
            <EmptyState icon={<BarChart3 aria-hidden="true" />} title="Henüz fatura verisi yok" />
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ui.th}>Ay</th>
                    <th scope="col" className={`${ui.th} text-right`}>Gelir</th>
                    <th scope="col" className={`${ui.th} text-right`}>Gider</th>
                    <th scope="col" className={`${ui.th} text-right`}>Kâr</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyProfitLoss.map((report, index) => (
                    <tr key={index} className={ui.tr}>
                      <td className={`${ui.td} font-medium`}>
                        {report.month} {report.year}
                      </td>
                      <td className={`${ui.td} ${ui.num} text-right`}>{formatCurrency(report.revenue)}</td>
                      <td className={`${ui.td} ${ui.num} text-right ${ui.soft}`}>{formatCurrency(report.expenses)}</td>
                      <td className={`${ui.td} ${ui.num} text-right ${report.profit >= 0 ? ui.pos : ui.neg}`}>
                        {formatCurrency(report.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "salesByProduct" && (
        <Card>
          <CardHead icon={<Package aria-hidden="true" />} title="Ürün Bazlı Satış">
            <span className={ui.muted}>En çok satan 10 ürün</span>
          </CardHead>
          {salesByProduct.length === 0 ? (
            <EmptyState icon={<Package aria-hidden="true" />} title="Henüz ürün satış verisi yok" />
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ui.th}>Ürün</th>
                    <th scope="col" className={ui.th}>SKU</th>
                    <th scope="col" className={`${ui.th} text-right`}>Satılan Miktar</th>
                    <th scope="col" className={`${ui.th} text-right`}>Toplam Satış</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByProduct.slice(0, 10).map((report: any) => (
                    <tr key={report.productId} className={ui.tr}>
                      <td className={ui.td}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={report.productName || "Ürün"} square size={28} />
                          <span className="font-medium">{report.productName || "Ürün"}</span>
                        </span>
                      </td>
                      <td className={`${ui.td} ${ui.soft}`}>{report.sku || <span className={ui.muted}>—</span>}</td>
                      <td className={`${ui.td} ${ui.num} text-right`}>
                        {Number(report.quantitySold ?? 0).toLocaleString("tr-TR")}
                      </td>
                      <td className={`${ui.td} ${ui.num} text-right`}>{formatCurrency(Number(report.totalSales ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "accountBalances" && (
        <Card>
          <CardHead icon={<Users aria-hidden="true" />} title="Cari Bakiyeler" />
          {accounts.length === 0 ? (
            <EmptyState icon={<Users aria-hidden="true" />} title="Henüz cari bakiye verisi yok" />
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ui.th}>Cari</th>
                    <th scope="col" className={ui.th}>Tip</th>
                    <th scope="col" className={`${ui.th} text-right`}>Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className={ui.tr}>
                      <td className={ui.td}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={account.name} size={28} />
                          <span className="font-medium">{account.name}</span>
                        </span>
                      </td>
                      <td className={ui.td}>
                        <Status tone={account.accountType === "CUSTOMER" ? "green" : "violet"}>
                          {account.accountType === "CUSTOMER" ? "Müşteri" : "Tedarikçi"}
                        </Status>
                      </td>
                      <td
                        className={`${ui.td} ${ui.num} text-right ${
                          account.balance > 0 ? ui.pos : account.balance < 0 ? ui.neg : ui.muted
                        }`}
                      >
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
