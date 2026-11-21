"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import s from "./panel.module.css";
import { monthLabel, tl, tlShort, type MonthPoint } from "./format";

/** Eksen adımı: 1-2-2,5-5 x 10^n; en fazla 5 aralık. */
function niceStep(max: number) {
  if (max <= 0) return 250;
  const base = Math.pow(10, Math.floor(Math.log10(max)) - 1);
  for (const mult of [1, 2, 2.5, 5, 10, 20, 25, 50, 100]) {
    const step = base * mult;
    if (Math.ceil(max / step) <= 5) return step;
  }
  return base * 100;
}

/** Son 12 ayın satış faturası toplamları. En yüksek ay vurgulanır. */
export default function MonthlySales({ series }: { series: MonthPoint[] | null }) {
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    if (!series) return;
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [series]);

  const values = (series ?? []).map((p) => p.sales);
  const max = Math.max(0, ...values);
  const step = niceStep(max);
  const yTop = Math.max(1, Math.ceil(max / step)) * step;
  const ticks = Array.from({ length: Math.round(yTop / step) + 1 }, (_, i) => yTop - i * step);
  const hl = max > 0 ? values.indexOf(max) : -1;

  const first = series?.[0]?.month;
  const last = series?.[series.length - 1]?.month;
  const range = first && last ? `${monthLabel(first)} ${first.slice(0, 4)} – ${monthLabel(last)} ${last.slice(0, 4)}` : "";

  return (
    <section className={`${s.card} ${s.chartCard}`} aria-labelledby="monthly-sales-title">
      <div className={s.cardHead}>
        <BarChart3 aria-hidden="true" />
        <h2 id="monthly-sales-title">Aylık Satış</h2>
        <span className={s.cardHeadNote}>{range}</span>
      </div>

      {!series ? (
        <div className={s.chartEmpty}>Yükleniyor…</div>
      ) : max === 0 ? (
        <div className={s.chartEmpty}>Son 12 ayda satış faturası yok.</div>
      ) : (
        <div className={s.chart}>
          <div className={s.yAxis} aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick}>{tlShort(tick)}</span>
            ))}
          </div>
          <ol className={s.bars}>
            {series.map((point, i) => {
              const h = Math.max((point.sales / yTop) * 100, point.sales > 0 ? 2 : 1);
              return (
                <li key={point.month} className={s.barCol}>
                  <div
                    className={s.bar}
                    data-hl={i === hl}
                    style={{ height: grown ? `${h}%` : 0, transitionDelay: `${60 + i * 40}ms` }}
                  >
                    <span className={s.tip} aria-hidden="true">
                      {tl(point.sales)}
                    </span>
                  </div>
                  <span className={s.barMonth} aria-hidden="true">
                    {monthLabel(point.month)}
                  </span>
                  <span className={s.srOnly}>
                    {monthLabel(point.month)} {point.month.slice(0, 4)}: {tl(point.sales)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
