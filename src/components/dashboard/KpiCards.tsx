"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  CircleDollarSign,
  Minus,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import s from "./panel.module.css";
import { tl, type PanelSummary } from "./format";

type Kpi = {
  label: string;
  href: string;
  icon: LucideIcon;
  value: number;
  series: number[];
  /** Borç gibi azalması iyi olan değerler. */
  inverse?: boolean;
};

/** Yumuşak (bezier) çizgi yolu. viewBox 220x48. */
function sparkPath(values: number[], w = 220, h = 48) {
  if (values.length < 2) return `M0,${h / 2} L${w},${h / 2}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [
    (i * w) / (values.length - 1),
    max === min ? h / 2 : h - 4 - ((v - min) / range) * (h - 10),
  ]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

/** Bu ay ile geçen ay arasındaki değişim (%). Önceki ay 0 ise hesaplanmaz. */
function change(series: number[]) {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return null;
  return ((last - prev) / Math.abs(prev)) * 100;
}

export default function KpiCards({
  summary,
  loading,
}: {
  summary: PanelSummary | null;
  loading: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const animated = useRef(false);

  useEffect(() => {
    if (summary && !loading && !animated.current) {
      animated.current = true;
      setStarted(true);
    }
  }, [summary, loading]);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1100);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  const series = summary?.series ?? [];
  const kpis: Kpi[] = [
    {
      label: "Bu Ay Satış",
      href: "/invoices",
      icon: CircleDollarSign,
      value: summary?.monthlySales ?? 0,
      series: series.map((p) => p.sales),
    },
    {
      label: "Toplam Alacak",
      href: "/current-accounts",
      icon: Tag,
      value: summary?.totalReceivable ?? 0,
      series: series.map((p) => p.receivable),
    },
    {
      label: "Toplam Borç",
      href: "/current-accounts",
      icon: Wallet,
      value: summary?.totalDebt ?? 0,
      series: series.map((p) => p.debt),
      inverse: true,
    },
    {
      label: "Net Bakiye",
      href: "/finance",
      icon: Activity,
      value: summary?.netBalance ?? 0,
      series: series.map((p) => p.receivable - p.debt),
    },
  ];

  const ready = started && !!summary;

  return (
    <div className={s.kpis}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const pct = change(kpi.series);
        const up = pct !== null && pct > 0;
        const down = pct !== null && pct < 0;
        const good = kpi.inverse ? down : up;
        const bad = kpi.inverse ? up : down;
        const tone = good ? s.up : bad ? s.down : s.flat;
        const stroke = good ? "var(--app-accent)" : bad ? "var(--app-red)" : "var(--app-ink-3)";
        const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus;

        return (
          <Link key={kpi.label} href={kpi.href} className={`${s.card} ${s.kpi}`}>
            <div className={s.kpiTop}>
              <Icon aria-hidden="true" />
              {kpi.label}
              <ArrowUpRight aria-hidden="true" className={s.kpiArrow} />
            </div>
            <div className={s.kpiMid}>
              <span className={`${s.kpiVal} ${ready ? "" : s.kpiLoading}`} aria-hidden="true">
                {ready ? tl(kpi.value * progress) : "₺—"}
              </span>
              {ready && pct !== null ? (
                <span className={`${s.trend} ${tone}`}>
                  <TrendIcon aria-hidden="true" />
                  {pct > 0 ? "+" : ""}
                  {pct.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%
                </span>
              ) : null}
              <span className={s.srOnly}>
                {ready ? tl(kpi.value) : "Yükleniyor"}
                {ready && pct !== null
                  ? `, geçen aya göre yüzde ${pct.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`
                  : ""}
              </span>
            </div>
            <svg
              className={s.spark}
              viewBox="0 0 220 48"
              preserveAspectRatio="none"
              aria-hidden="true"
              data-on={ready && kpi.series.length > 1}
            >
              <path d={sparkPath(kpi.series)} stroke={stroke} pathLength={1} />
            </svg>
            <p className={s.kpiFoot}>Son 12 ay · geçen aya göre</p>
          </Link>
        );
      })}
    </div>
  );
}
