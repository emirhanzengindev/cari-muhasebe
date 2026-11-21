import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import s from "./panel.module.css";
import { MONTHS, tl, type RecentInvoice } from "./format";

const statusOf = (invoice: RecentInvoice) => {
  if (invoice.isDraft) return { text: "Taslak", color: "var(--app-ink-3)" };
  if (invoice.overdue) return { text: "Vadesi geçti", color: "var(--app-red)" };
  if (invoice.type === "PURCHASE") return { text: "Tamamlandı", color: "#7c3aed" };
  return { text: "Tamamlandı", color: "var(--app-accent)" };
};

export default function RecentInvoices({ invoices }: { invoices: RecentInvoice[] | null }) {
  return (
    <section className={s.card} aria-labelledby="recent-invoices-title">
      <div className={s.cardHead}>
        <CalendarDays aria-hidden="true" />
        <h2 id="recent-invoices-title">Son Faturalar</h2>
        <Link href="/invoices" className={s.more}>
          Tümü
        </Link>
      </div>

      {!invoices ? (
        <div className={s.empty}>Yükleniyor…</div>
      ) : invoices.length === 0 ? (
        <div className={s.empty}>
          Henüz fatura yok. <Link href="/invoices/new" className={s.pos}>İlk faturayı oluştur</Link>
        </div>
      ) : (
        <ul className={s.agenda}>
          {invoices.map((invoice) => {
            const date = invoice.date ? new Date(invoice.date) : null;
            const valid = date && Number.isFinite(date.getTime());
            const status = statusOf(invoice);
            const kind = invoice.type === "PURCHASE" ? "Alış" : "Satış";
            return (
              <li key={invoice.id}>
                <Link href={`/invoices/${invoice.id}`} className={s.ag}>
                  <div className={s.date}>
                    <small>{valid ? MONTHS[date.getMonth()] : "—"}</small>
                    <b>{valid ? date.getDate() : ""}</b>
                  </div>
                  <span className={s.barline} style={{ background: status.color }} aria-hidden="true" />
                  <div className={s.agBody}>
                    <b>{invoice.accountName || "Cari belirtilmemiş"}</b>
                    <small>
                      Fatura #{invoice.number || "—"} · {kind}
                    </small>
                  </div>
                  <div className={s.amt}>
                    {tl(invoice.total)}
                    <small style={{ color: status.color }}>{status.text}</small>
                  </div>
                  <ChevronRight aria-hidden="true" className={s.chev} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
