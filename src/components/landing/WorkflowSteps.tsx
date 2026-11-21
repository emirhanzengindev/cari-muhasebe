"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

export type WorkflowStep = {
  title: string;
  description: string;
  /** Soldaki görselde dönen kısa etiket. */
  label: string;
  pills: [string, string];
};

const AUTO_ADVANCE_MS = 5000;

export default function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  // Her adım değişiminde sayaç sıfırlanır; üzerine gelince / odaklanınca durur.
  useEffect(() => {
    if (paused || reducedMotion.current) return;
    const id = window.setTimeout(
      () => setCur((c) => (c + 1) % steps.length),
      AUTO_ADVANCE_MS
    );
    return () => window.clearTimeout(id);
  }, [cur, paused, steps.length]);

  const go = (i: number) => setCur((i + steps.length) % steps.length);
  const active = steps[cur];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.flow}>
        <div className={styles.flowVisual} data-reveal aria-hidden="true">
          <div className={styles.flowCard} key={`card-${cur}`}>
            <span>{active.label}</span>
            <span className={styles.bar} />
          </div>
          <div className={styles.flowPills} key={`pills-${cur}`}>
            {active.pills.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>

        <ol className={styles.steps}>
          {steps.map((s, i) => {
            const isActive = i === cur;
            return (
              <li
                key={s.title}
                className={`${styles.step} ${isActive ? styles.stepActive : ""}`}
              >
                <h3>
                  <button
                    type="button"
                    className={styles.stepToggle}
                    aria-expanded={isActive}
                    aria-controls={`adim-${i}`}
                    onClick={() => go(i)}
                  >
                    {s.title}.
                  </button>
                </h3>
                <div className={styles.stepBody} id={`adim-${i}`}>
                  <div>
                    <p>{s.description}</p>
                    {i === 0 ? (
                      <Link
                        href="/auth/signup"
                        className={`${styles.btn} ${styles.btnLime}`}
                        tabIndex={isActive ? undefined : -1}
                      >
                        Hesap Oluştur <Arrow />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((cur + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className={styles.progressNav}>
          <button type="button" aria-label="Önceki adım" onClick={() => go(cur - 1)}>
            ←
          </button>
          <button type="button" aria-label="Sonraki adım" onClick={() => go(cur + 1)}>
            →
          </button>
        </div>
      </div>
      <div className={styles.counter} aria-live="polite">
        {cur + 1}/{steps.length}
      </div>
    </div>
  );
}

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
