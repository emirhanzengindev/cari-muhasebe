"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

/** Kaydırdıkça kelime kelime koyulaşan slogan. Metin SSR'da tam olarak gelir. */
export default function ScrollStatement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.trim().split(/\s+/);
  const [lit, setLit] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const paint = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(
        1,
        Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35))
      );
      setLit(Math.round(p * words.length));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [words.length]);

  return (
    <p ref={ref} className={lit === null ? undefined : styles.statementLive}>
      {words.map((w, i) => (
        <span key={i}>
          <span
            className={`${styles.w} ${lit !== null && i < lit ? styles.wOn : ""}`}
          >
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </p>
  );
}
