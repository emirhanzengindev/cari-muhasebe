/**
 * Koyu hero alanlarının dağ manzarası (dekoratif). Aynı sayfada birden fazla
 * kullanılırsa gradient id'leri çakışmasın diye `idPrefix` verin.
 */
export function HeroBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#27374a_0%,#3d4b5c_28%,#6b6463_52%,#8a6650_70%,#3a2a22_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_30%_62%,rgba(255,196,140,0.35),transparent_70%)]"
      />
    </>
  );
}

export default function Mountains({
  className = "",
  idPrefix = "mt",
  showTrail = true,
}: {
  className?: string;
  idPrefix?: string;
  showTrail?: boolean;
}) {
  const id = (n: number) => `${idPrefix}-m${n}`;
  return (
    <svg
      className={className}
      viewBox="0 0 1440 560"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id(1)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d6575" />
          <stop offset="1" stopColor="#4a4f5c" />
        </linearGradient>
        <linearGradient id={id(2)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4a48" />
          <stop offset="1" stopColor="#3a302e" />
        </linearGradient>
        <linearGradient id={id(3)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a4f32" />
          <stop offset=".6" stopColor="#5a3322" />
          <stop offset="1" stopColor="#2a1a14" />
        </linearGradient>
        <linearGradient id={id(4)} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2219" />
          <stop offset=".5" stopColor="#6d3a24" />
          <stop offset="1" stopColor="#2e1c15" />
        </linearGradient>
      </defs>
      <path d="M0 230 L120 170 L230 210 L360 140 L470 200 L600 150 L720 215 L860 160 L1000 220 L1140 170 L1290 225 L1440 180 V560 H0Z" fill={`url(#${id(1)})`} opacity=".75" />
      <path d="M0 300 L150 250 L280 290 L420 230 L560 300 L700 260 L820 310 L980 260 L1120 320 L1300 270 L1440 310 V560 H0Z" fill={`url(#${id(2)})`} opacity=".9" />
      <path d="M0 390 L180 320 L330 370 L520 330 L700 390 L840 350 L980 410 L1440 380 V560 H0Z" fill={`url(#${id(3)})`} />
      <path d="M760 560 L1020 330 L1080 280 L1120 300 L1190 360 L1440 470 V560Z" fill={`url(#${id(4)})`} />
      {showTrail ? (
        <path d="M1050 410 C1110 520 1180 470 1250 430 S1380 380 1440 350" fill="none" stroke="#d9f53b" strokeWidth="12" strokeLinecap="round" />
      ) : null}
      <path d="M0 470 L240 420 L460 460 L700 430 L900 480 L1440 500 V560 H0Z" fill="#25150f" opacity=".85" />
    </svg>
  );
}
