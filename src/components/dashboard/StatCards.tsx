"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  FileWarning,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import s from "./stat-cards.module.css";

export type StatSummary = {
  totalAccounts: number;
  stockValue: number;
  monthlySales: number;
  pendingInvoicesCount: number;
  pendingInvoicesTotal: number;
  overdueInvoicesCount: number;
  overdueInvoicesTotal: number;
  totalReceivable: number;
  totalDebt: number;
  netBalance: number;
};

const TICK_COUNT = 28;
const MAX_DOTS = 8;
const DOT_COLORS = ["#122b3a", "#176b87", "#6b6b6b", "#122b3a", "#4fa9c2", "#9a9a96", "#122b3a", "#176b87"];
const ARC_PATH = "M4 60 Q140 -20 276 60";

const num = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);

const tl = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const int = (n: number) => Math.round(n).toLocaleString("tr-TR");

const pct = (n: number) =>
  "%" + n.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const ease = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Panel özet kartları. Rakamlar veri ilk geldiğinde sıfırdan sayarak yükselir,
 * sonraki güncellemelerde doğrudan değişir. "Hareketi azalt" tercihinde
 * animasyon yapılmaz.
 */
export default function StatCards({
  summary,
  loading,
}: {
  summary: StatSummary | null;
  loading: boolean;
}) {
  const [entered, setEntered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [month, setMonth] = useState<{ today: number; days: number } | null>(null);
  const animated = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = new Date();
    setMonth({
      today: now.getDate(),
      days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    });
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Veri ilk geldiğinde animasyonu bir kez tetikle.
  useEffect(() => {
    if (summary && !loading && !animated.current) {
      animated.current = true;
      setStarted(true);
    }
  }, [summary, loading]);

  // 0 → 1 ilerleme. Yalnızca `started`e bağlı: veri yeniden yüklenirken
  // (loading değişince) yarıda iptal olup takılı kalmaz.
  useEffect(() => {
    if (!started) return;
    if (reduced.current) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1400);
      setProgress(ease(p));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    // Kartların girişi bitsin diye kısa gecikme.
    const timeout = window.setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [started]);

  const ready = started && !!summary;
  const p = ready ? progress : 0;

  const d = {
    accounts: num(summary?.totalAccounts),
    stock: num(summary?.stockValue),
    sales: num(summary?.monthlySales),
    pending: num(summary?.pendingInvoicesCount),
    pendingTotal: num(summary?.pendingInvoicesTotal),
    overdue: num(summary?.overdueInvoicesCount),
    overdueTotal: num(summary?.overdueInvoicesTotal),
    receivable: num(summary?.totalReceivable),
    debt: num(summary?.totalDebt),
    net: num(summary?.netBalance),
  };

  const flow = d.receivable + d.debt;
  const recvPct = flow > 0 ? (d.receivable / flow) * 100 : 0;
  const debtPct = flow > 0 ? (d.debt / flow) * 100 : 0;

  // Bekleyen faturalar şeridi: kırmızı çubuklar vadesi geçenlerin payı.
  const lateTicks =
    d.pending > 0 && d.overdue > 0
      ? Math.max(1, Math.round((TICK_COUNT * d.overdue) / d.pending))
      : 0;
  const okTicks = d.pending > 0 ? TICK_COUNT - lateTicks : 0;

  const monthFrac = month ? month.today / month.days : 0;

  let delay = 0;
  const card = (className: string, children: ReactNode) => {
    const style = { transitionDelay: `${(delay += 90)}ms` } as CSSProperties;
    return (
      <article className={`${s.card} ${className}`} data-in={entered} style={style}>
        {children}
      </article>
    );
  };

  return (
    <section className={s.wrap} aria-labelledby="ozet-baslik" aria-busy={loading}>
      <h2 id="ozet-baslik" className="sr-only">
        Özet
      </h2>
      <div className={s.grid}>
        {/* 1. Toplam Cari */}
        {card(
          "",
          <>
            <Head label="Toplam Cari" icon={<Users />} />
            <Value ready={ready} text={int(d.accounts * p)} final={int(d.accounts)} />
            <p className={s.sub}>Aktif tenant cari kayıtları</p>
            <div className={s.foot} aria-hidden="true">
              {ready && d.accounts === 0 ? (
                <span className={s.dotsEmpty}>Henüz cari yok</span>
              ) : (
                <div className={s.dots}>
                  {Array.from({ length: Math.min(d.accounts, MAX_DOTS) }, (_, i) => (
                    <span
                      key={i}
                      style={{ background: DOT_COLORS[i], transitionDelay: `${i * 90}ms` }}
                      data-on={p > 0}
                    />
                  ))}
                  {d.accounts > MAX_DOTS ? (
                    <span
                      style={{ background: "#c9c8c3", color: "#111", transitionDelay: `${MAX_DOTS * 90}ms` }}
                      data-on={p > 0}
                    >
                      +{d.accounts - MAX_DOTS}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )}

        {/* 2. Stok Değeri */}
        {card(
          "",
          <>
            <Head label="Stok Değeri" icon={<Package />} />
            <Value ready={ready} text={tl(d.stock * p)} final={tl(d.stock)} />
            <p className={s.sub}>Stok miktarı ve alış maliyeti</p>
            <div className={s.foot}>
              <div className={s.barRow}>
                <b>{ready && d.stock === 0 ? "Stok girişi yok" : "Depodaki ürünler"}</b>
                <Link href="/inventory" className={s.link}>
                  {ready && d.stock === 0 ? "Ürün ekle" : "Stoğu gör"}
                </Link>
              </div>
            </div>
          </>
        )}

        {/* 3. Bu Ay Satış */}
        {card(
          "",
          <>
            <Head label="Bu Ay Satış" icon={<TrendingUp />} />
            <Value ready={ready} text={tl(d.sales * p)} final={tl(d.sales)} />
            <p className={s.sub}>Bu ayki satış faturaları</p>
            <div className={s.foot}>
              <MonthArc fraction={monthFrac * p} />
              <div className={s.legend}>
                <span>01</span>
                <span>{month ? `Ayın ${month.today}. günü` : ""}</span>
                <span>{month ? String(month.days).padStart(2, "0") : ""}</span>
              </div>
            </div>
          </>
        )}

        {/* 4. Bekleyen Faturalar */}
        {card(
          "",
          <>
            <Head label="Bekleyen Faturalar" icon={<FileText />} />
            <Value ready={ready} text={int(d.pending * p)} final={int(d.pending)} />
            <p className={s.sub}>
              <span className={s.pill}>{tl(d.pendingTotal)} toplam</span>
            </p>
            <div className={s.foot}>
              <div className={s.ticks} aria-hidden="true">
                {Array.from({ length: TICK_COUNT }, (_, i) => {
                  const lit = i / TICK_COUNT < p;
                  const state = !lit ? undefined : i < okTicks ? "ok" : i < okTicks + lateTicks ? "late" : undefined;
                  return <i key={i} data-on={state} />;
                })}
              </div>
              <div className={s.legend}>
                <span>{d.pending > 0 ? "vadesi gelmemiş" : "bekleyen fatura yok"}</span>
                {d.overdue > 0 ? <span>vadesi geçen {int(d.overdue)}</span> : null}
              </div>
            </div>
          </>
        )}

        {/* 5. Toplam Alacak */}
        {card(
          s.green,
          <>
            <Head label="Toplam Alacak" icon={<TrendingUp />} />
            <Value ready={ready} text={tl(d.receivable * p)} final={tl(d.receivable)} />
            <p className={s.sub}>Cari hareket bakiyelerinden</p>
            <div className={s.foot}>
              <div className={s.barRow}>
                <b>Toplam içindeki payı</b>
                <span>{ready ? pct(recvPct) : ""}</span>
              </div>
              <div className={`${s.bar} ${s.barAccent}`} aria-hidden="true">
                <i style={{ width: `${recvPct * p}%` }} />
              </div>
            </div>
          </>
        )}

        {/* 6. Vadesi Geçenler */}
        {card(
          d.overdue > 0 ? s.red : "",
          <>
            <Head label="Vadesi Geçenler" icon={<FileWarning />} />
            <Value ready={ready} text={int(d.overdue * p)} final={int(d.overdue)} />
            <p className={s.sub}>{tl(d.overdueTotal)} açık bakiye</p>
            <div className={s.foot}>
              {ready && d.overdue === 0 ? (
                <div className={s.alert}>
                  <span className={`${s.ic} ${s.icOk}`} aria-hidden="true">
                    <CheckCircle />
                  </span>
                  <span className={`${s.pill} ${s.pillOk}`}>gecikme yok</span>
                </div>
              ) : (
                <div className={s.alert}>
                  <span className={s.ic} data-ping={ready} aria-hidden="true">
                    <Clock />
                  </span>
                  <Link href="/invoices" className={`${s.pill} ${s.pillRed}`}>
                    takip gerekiyor →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* 7. Toplam Borç */}
        {card(
          s.red,
          <>
            <Head label="Toplam Borç" icon={<FileText />} />
            <Value ready={ready} text={tl(d.debt * p)} final={tl(d.debt)} />
            <p className={s.sub}>Cari hareket bakiyelerinden</p>
            <div className={s.foot}>
              <div className={s.barRow}>
                <b>Toplam içindeki payı</b>
                <span>{ready ? pct(debtPct) : ""}</span>
              </div>
              <div className={s.bar} aria-hidden="true">
                <i style={{ width: `${(d.debt > 0 ? Math.max(debtPct, 1.5) : 0) * p}%` }} />
              </div>
            </div>
          </>
        )}

        {/* 8. Net Bakiye (vurgu kartı) */}
        {card(
          s.dark,
          <>
            <Head label="Net Bakiye" icon={<BarChart3 />} />
            <Value
              ready={ready}
              text={tl(d.net * p)}
              final={tl(d.net)}
              className={d.net < 0 ? s.valueNegative : undefined}
            />
            <p className={s.sub}>Alacak eksi borç</p>
            <div className={s.foot}>
              <div className={s.split} aria-hidden="true">
                <i className={s.splitA} style={{ width: `${recvPct * p}%` }} />
                <i
                  className={s.splitB}
                  style={{ width: `${(d.debt > 0 ? Math.max(debtPct, 1.5) : 0) * p}%` }}
                />
              </div>
              <div className={s.splitLegend}>
                <span>Alacak</span>
                <span>Borç</span>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Head({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <div className={s.head}>
      <h3 className={s.label}>{label}</h3>
      <span aria-hidden="true">{icon}</span>
    </div>
  );
}

/**
 * Animasyonlu rakam. Ekran okuyucuya ara değerler değil, son değer okunur.
 * Yazı boyutu karakter sayısına göre küçülür (bkz. .value / --len).
 */
function Value({
  ready,
  text,
  final,
  className,
}: {
  ready: boolean;
  text: string;
  final: string;
  className?: string;
}) {
  const shown = ready ? text : "—";
  const style = { "--len": Math.max(final.length, 4) } as CSSProperties;
  return (
    <div className={`${s.value} ${ready ? "" : s.loading} ${className ?? ""}`} style={style}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{ready ? final : "Yükleniyor"}</span>
    </div>
  );
}

/** Ayın ilerleme yayı. Nokta, yay üzerindeki gerçek konumdan hesaplanır. */
function MonthArc({ fraction }: { fraction: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [dot, setDot] = useState<{ x: number; y: number }>({ x: 4, y: 60 });

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const pt = path.getPointAtLength(path.getTotalLength() * fraction);
    setDot({ x: pt.x, y: pt.y });
  }, [fraction]);

  return (
    <svg className={s.arc} viewBox="0 0 280 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* Ölçüm bu yoldan yapılır: pathLength içermez, getPointAtLength tutarlı kalır. */}
      <path ref={pathRef} d={ARC_PATH} fill="none" stroke="var(--track)" strokeWidth="1.5" strokeDasharray="2 4" />
      <path
        d={ARC_PATH}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - fraction}
      />
      <circle cx={dot.x} cy={dot.y} r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}
