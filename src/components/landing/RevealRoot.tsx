"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Sayfayı saran kök. `data-reveal` işaretli öğelerden yalnızca ilk açılışta
 * ekranın altında kalanları gizler ve kaydırıldıkça görünür yapar.
 * JS yoksa veya kullanıcı hareketi azaltmayı seçtiyse içerik hep görünür kalır.
 */
export default function RevealRoot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "done";
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.dataset.reveal = "pending";
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
