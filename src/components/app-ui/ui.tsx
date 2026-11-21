// Uygulama sayfalarının ortak görsel dili (Panel ile aynı: beyaz kart, ince çizgi,
// koyu birincil buton, noktalı durum etiketi). Renkler globals.css --app-* tokenlarından.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------------- Sınıf sabitleri ---------------- */

export const ui = {
  page: "text-[13px] text-[var(--app-ink)]",
  card: "rounded-xl border border-[var(--app-line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
  cardHead: "flex flex-wrap items-center gap-2 px-4 py-3.5 font-semibold [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
  btn: "inline-flex h-[34px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] border border-[var(--app-line)] bg-white px-3 text-[13px] font-medium text-[var(--app-ink)] transition-colors hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:h-[15px] [&>svg]:w-[15px]",
  btnDark: "inline-flex h-[34px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] border border-[var(--app-ink)] bg-[var(--app-ink)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#27272a] disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:h-[15px] [&>svg]:w-[15px]",
  btnDanger: "inline-flex h-[34px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] border border-[#fecaca] bg-white px-3 text-[13px] font-medium text-[var(--app-red)] transition-colors hover:bg-[var(--app-red-soft)] disabled:opacity-50 [&>svg]:h-[15px] [&>svg]:w-[15px]",
  input: "h-9 w-full rounded-[9px] border border-[var(--app-line)] bg-white px-3 text-[13px] text-[var(--app-ink)] outline-none transition-shadow placeholder:text-[var(--app-ink-3)] focus:border-[#a1a1aa] focus:shadow-[0_0_0_3px_#f4f4f5] disabled:bg-[#fafafa]",
  textarea: "w-full rounded-[9px] border border-[var(--app-line)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)] outline-none placeholder:text-[var(--app-ink-3)] focus:border-[#a1a1aa] focus:shadow-[0_0_0_3px_#f4f4f5]",
  label: "mb-1.5 block text-[12px] font-medium text-[var(--app-ink-2)]",
  table: "w-full border-collapse",
  th: "whitespace-nowrap border-y border-[var(--app-line)] bg-[#fcfcfc] px-4 py-2.5 text-left text-[12px] font-medium text-[var(--app-ink-2)]",
  td: "whitespace-nowrap border-b border-[#f2f2f3] px-4 py-[11px] align-middle",
  tr: "transition-colors hover:bg-[#fafafa] [&:last-child>td]:border-b-0",
  num: "font-medium tabular-nums",
  muted: "text-[var(--app-ink-3)]",
  soft: "text-[var(--app-ink-2)]",
  pos: "text-[var(--app-accent)]",
  neg: "text-[var(--app-red)]",
  link: "font-medium text-[var(--app-ink)] underline decoration-[var(--app-line)] underline-offset-[3px] hover:decoration-[var(--app-ink-3)]",
  modalBackdrop: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]",
  modal: "max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-[var(--app-line)] bg-white p-6 text-[13px] text-[var(--app-ink)] shadow-2xl",
} as const;

/* ---------------- Sayfa başlığı ---------------- */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-[22px] flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-[var(--app-ink-2)] hover:text-[var(--app-ink)]">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h1>
        {description ? <p className="mt-1 text-[var(--app-ink-2)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ---------------- Kart ---------------- */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx(ui.card, className)} {...props} />;
}

export function CardHead({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={ui.cardHead}>
      {icon}
      <h2>{title}</h2>
      {children ? <div className="ml-auto flex flex-wrap items-center gap-2 font-normal">{children}</div> : null}
    </div>
  );
}

/* ---------------- Sekmeler ---------------- */

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label = "Filtre",
}: {
  items: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1">
      {items.map((item) => {
        const on = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.value)}
            className={cx(
              "h-7 rounded-[7px] border px-[11px] text-[13px] font-medium transition-colors",
              on
                ? "border-[var(--app-line)] bg-white text-[var(--app-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                : "border-transparent text-[var(--app-ink-2)] hover:bg-[#f6f6f7]"
            )}
          >
            {item.label}
            {item.count !== undefined ? <span className="ml-1 text-[var(--app-ink-3)]">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Arama ---------------- */

export function SearchInput({
  value,
  onChange,
  placeholder = "Ara...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={cx(
        "flex h-8 w-full items-center gap-1.5 rounded-lg border border-[var(--app-line)] bg-white px-2.5 text-[var(--app-ink-3)] focus-within:border-[#a1a1aa] sm:w-[220px]",
        className
      )}
    >
      <Search size={15} aria-hidden="true" className="shrink-0" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-[13px] text-[var(--app-ink)] outline-none placeholder:text-[var(--app-ink-3)]"
      />
    </label>
  );
}

/* ---------------- Durum etiketi ---------------- */

const TONES = {
  green: "var(--app-accent)",
  red: "var(--app-red)",
  gray: "var(--app-ink-3)",
  violet: "#7c3aed",
  amber: "#d97706",
  blue: "#2563eb",
} as const;
export type Tone = keyof typeof TONES;

export function Status({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-[7px] border border-[var(--app-line)] px-[9px] text-[12px] font-medium before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']"
      style={{ color: TONES[tone] }}
    >
      <span className="text-[var(--app-ink)]">{children}</span>
    </span>
  );
}

/* ---------------- Avatar ---------------- */

const PALETTE = ["#16a34a", "#2563eb", "#7c3aed", "#d97706", "#db2777", "#0891b2", "#52525b"];
export const colorOf = (name: string) =>
  PALETTE[[...(name || "")].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length];
export const initials = (name: string) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toLocaleUpperCase("tr-TR") || "?";

export function Avatar({ name, square = false, size = 32 }: { name: string; square?: boolean; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={cx("grid shrink-0 place-items-center font-semibold text-white", square ? "rounded-lg" : "rounded-full")}
      style={{ width: size, height: size, fontSize: size <= 26 ? 10 : 11.5, background: colorOf(name) }}
    >
      {initials(name)}
    </span>
  );
}

/* ---------------- İşlem butonları ---------------- */

const opClass =
  "grid h-[30px] w-[30px] place-items-center rounded-lg border border-[var(--app-line)] bg-white text-[var(--app-ink-2)] transition-colors hover:bg-[#f6f6f7] hover:text-[var(--app-ink)] [&>svg]:h-3.5 [&>svg]:w-3.5";

export function RowActions({
  viewHref,
  editHref,
  onDelete,
  name,
}: {
  viewHref?: string;
  editHref?: string;
  onDelete?: () => void;
  name: string;
}) {
  return (
    <div className="flex justify-end gap-1.5">
      {viewHref ? (
        <Link href={viewHref} className={opClass} title="Görüntüle" aria-label={`${name} görüntüle`}>
          <Eye aria-hidden="true" />
        </Link>
      ) : null}
      {editHref ? (
        <Link href={editHref} className={opClass} title="Düzenle" aria-label={`${name} düzenle`}>
          <Pencil aria-hidden="true" />
        </Link>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className={cx(opClass, "hover:border-[#fecaca] hover:bg-[var(--app-red-soft)] hover:text-[var(--app-red)]")}
          title="Sil"
          aria-label={`${name} sil`}
        >
          <Trash2 aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function IconButton({
  label,
  children,
  danger,
  className,
  ...props
}: ComponentProps<"button"> & { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cx(opClass, danger && "hover:border-[#fecaca] hover:bg-[var(--app-red-soft)] hover:text-[var(--app-red)]", className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Uyarı / boş durum / yükleniyor ---------------- */

export function Alert({ tone = "red", children }: { tone?: "red" | "green" | "amber" | "blue"; children: ReactNode }) {
  const cls = {
    red: "border-[#fecaca] bg-[var(--app-red-soft)] text-[#b91c1c]",
    green: "border-[#bbf7d0] bg-[var(--app-accent-soft)] text-[#15803d]",
    amber: "border-[#fde68a] bg-[#fffbeb] text-[#b45309]",
    blue: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  }[tone];
  return (
    <div role={tone === "red" ? "alert" : "status"} className={cx("mb-3.5 rounded-[10px] border px-3.5 py-2.5 text-[13px]", cls)}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-11 text-center text-[var(--app-ink-3)]">
      {icon ? <div className="mx-auto mb-2 grid place-items-center text-[#d4d4d8] [&>svg]:h-7 [&>svg]:w-7">{icon}</div> : null}
      <p className="font-medium text-[var(--app-ink-2)]">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Spinner({ label = "Yükleniyor" }: { label?: string }) {
  return (
    <div className="flex h-64 items-center justify-center" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-line)] border-t-[var(--app-accent)]" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function TableFoot({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-line)] px-4 py-3 text-[var(--app-ink-2)]">
      {children}
    </div>
  );
}

/* ---------------- Form alanı / detay listesi ---------------- */

export function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[12px] text-[var(--app-ink-3)]">{hint}</p> : null}
    </div>
  );
}

export function DetailGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between gap-4 border-t border-[#f2f2f3] px-4 py-2.5 sm:odd:border-r sm:odd:border-r-[#f2f2f3]">
          <dt className="text-[var(--app-ink-2)]">{item.label}</dt>
          <dd className="text-right font-medium">{item.value ?? <span className="text-[var(--app-ink-3)]">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------- Para ---------------- */

const tlFormatter = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const tl = (value: number, currency = "TRY") => {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? "−" : "";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
  return `${sign}${symbol}${tlFormatter.format(Math.abs(safe))}`;
};
