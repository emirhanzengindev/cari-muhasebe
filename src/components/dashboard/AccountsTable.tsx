"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, CircleDollarSign, Eye, Package, Pencil, Search, Tag, UserRound, Users } from "lucide-react";
import s from "./panel.module.css";
import { colorOf, initials, tl } from "./format";

export type PanelAccount = {
  id: string;
  name?: string;
  phone?: string | null;
  balance?: number | string | null;
  account_type?: string;
  accountType?: string;
  is_active?: boolean;
  isActive?: boolean;
};

const LIMIT = 8;

/** Panelde bakiyesi en yüksek cariler. Tam liste /current-accounts'ta. */
export default function AccountsTable({ accounts, loading }: { accounts: PanelAccount[]; loading: boolean }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return accounts
      .map((a) => ({
        id: a.id,
        name: a.name || "Adsız cari",
        phone: a.phone || "",
        balance: Number(a.balance ?? 0) || 0,
        supplier: (a.accountType ?? a.account_type) === "SUPPLIER",
        active: a.isActive ?? a.is_active ?? true,
      }))
      .filter((a) => !q || a.name.toLocaleLowerCase("tr-TR").includes(q))
      .sort((a, b) => b.balance - a.balance);
  }, [accounts, query]);

  const shown = rows.slice(0, LIMIT);

  return (
    <section className={`${s.card} ${s.tableCard}`} aria-labelledby="accounts-title">
      <div className={s.cardHead}>
        <Users aria-hidden="true" />
        <h2 id="accounts-title">Cari Hesaplar</h2>
        <div className={s.tools}>
          <label className={s.search}>
            <Search aria-hidden="true" />
            <span className={s.srOnly}>Cari ara</span>
            <input
              type="search"
              placeholder="Cari ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col"><span className={s.th}><UserRound aria-hidden="true" />İsim</span></th>
              <th scope="col"><span className={s.th}><Tag aria-hidden="true" />Tip</span></th>
              <th scope="col"><span className={s.th}><CircleDollarSign aria-hidden="true" />Bakiye</span></th>
              <th scope="col"><span className={s.th}><Activity aria-hidden="true" />Durum</span></th>
              <th scope="col" className={s.right}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading && accounts.length === 0 ? (
              <tr><td colSpan={5} className={s.empty}>Yükleniyor…</td></tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={5} className={s.empty}>
                  {query ? "Aramaya uyan cari yok." : "Henüz cari hesap yok."}
                </td>
              </tr>
            ) : (
              shown.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className={s.who}>
                      <span className={s.av} style={{ background: colorOf(a.name) }} aria-hidden="true">
                        {initials(a.name)}
                      </span>
                      <div>
                        <b>{a.name}</b>
                        <small>{a.phone || "Telefon yok"}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {a.supplier ? (
                      <span className={s.typ}>
                        <i style={{ background: "#f5f3ff", color: "#7c3aed" }}><Package aria-hidden="true" /></i>
                        Tedarikçi
                      </span>
                    ) : (
                      <span className={s.typ}>
                        <i style={{ background: "var(--app-accent-soft)", color: "var(--app-accent)" }}><UserRound aria-hidden="true" /></i>
                        Müşteri
                      </span>
                    )}
                  </td>
                  <td className={`${s.num} ${a.balance > 0 ? s.pos : a.balance < 0 ? s.neg : s.muted}`}>
                    {tl(a.balance)}
                  </td>
                  <td>
                    <span className={s.status} style={{ color: a.active ? "var(--app-accent)" : "var(--app-ink-3)" }}>
                      <span>{a.active ? "Aktif" : "Pasif"}</span>
                    </span>
                  </td>
                  <td>
                    <div className={s.ops}>
                      <Link href={`/current-accounts/${a.id}`} className={s.op} title="Görüntüle" aria-label={`${a.name} görüntüle`}>
                        <Eye aria-hidden="true" />
                      </Link>
                      <Link href={`/current-accounts/${a.id}/edit`} className={s.op} title="Düzenle" aria-label={`${a.name} düzenle`}>
                        <Pencil aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={s.tfoot}>
        <span>
          {rows.length > LIMIT ? `${rows.length} hesaptan ${LIMIT} tanesi gösteriliyor` : `${rows.length} hesap`}
        </span>
        <Link href="/current-accounts" className={s.more}>
          Tüm cari hesaplar →
        </Link>
      </div>
    </section>
  );
}
