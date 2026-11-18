// API smoke test for the old build (main worktree) and the new build, against
// the LOCAL test stack only. Usage (after start_app.ps1 started the app):
//   node 40_api_smoke.mjs --app http://localhost:3001 --label new-T1 [--write] [--out file.json]
// Env: TT_ANON_KEY (local anon key, start_app.ps1 prints how to get it)
//
// Signs in synthetic test users through the local GoTrue, sends the session
// cookie exactly as @supabase/ssr 0.8 writes it, and records status and item
// count per endpoint, plus cross-tenant access attempts. With --write it also
// creates records through the app (they are post-migration rows for T4).
import crypto from "node:crypto";
import fs from "node:fs";

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : dflt;
};
const APP = arg("app");
const LABEL = arg("label", "run");
const WRITE = argv.includes("--write");
const DELETE_PROBE = argv.includes("--delete-probe");
const OUT = arg("out", `api-${LABEL}.json`);
const SUPABASE_URL = process.env.TT_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.TT_ANON_KEY;

const isLocal = (u) => ["127.0.0.1", "localhost"].includes(new URL(u).hostname);
if (!APP || !ANON) throw new Error("--app and TT_ANON_KEY are required");
if (!isLocal(APP) || !isLocal(SUPABASE_URL)) throw new Error("Refusing: app and Supabase URL must be local");

const md5uuid = (s) => {
  const h = crypto.createHash("md5").update(s).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const rid = (kind, n) => md5uuid(`cari-test-${kind}-${n}`); // same as tenant_test.rid()
const pad = (n) => String(n).padStart(2, "0");

const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
const MAX_CHUNK = 3180;

async function signIn(n) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email: `tenant-test-${pad(n)}@example.test`, password: `Test-Password-${pad(n)}!` }),
  });
  if (!res.ok) return null;
  const s = await res.json();
  s.expires_at ??= Math.floor(Date.now() / 1000) + s.expires_in;
  return s;
}

function cookieFor(session) {
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  if (value.length <= MAX_CHUNK) return `${storageKey}=${value}`;
  const parts = [];
  for (let i = 0; i * MAX_CHUNK < value.length; i++) {
    parts.push(`${storageKey}.${i}=${value.slice(i * MAX_CHUNK, (i + 1) * MAX_CHUNK)}`);
  }
  return parts.join("; ");
}

async function call(cookie, method, path, body) {
  const res = await fetch(`${APP}${path}`, {
    method,
    headers: { cookie, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : null;
  return {
    status: res.status,
    count: list ? list.length : null,
    names: list ? list.map((x) => x?.name ?? x?.invoice_number ?? x?.invoiceNumber).filter(Boolean).slice(0, 3) : [],
    error: json?.error ?? (res.ok ? null : text.slice(0, 120)),
  };
}

const LIST = [
  "/api/current-accounts", "/api/invoices", "/api/products", "/api/categories",
  "/api/warehouses", "/api/safes", "/api/banks", "/api/cheques",
  "/api/transactions", "/api/stock-movements", "/api/dashboard/summary",
];
const USERS = [1, 2, 12, 16, 17];
const rows = [];
const record = (user, check, r, expect) =>
  rows.push({ label: LABEL, user, check, status: r.status, count: r.count, expect: expect ?? "", error: r.error ?? "", names: r.names?.join(" | ") ?? "" });

let guardPassed = false;
for (const n of USERS) {
  const session = await signIn(n);
  if (!session) { rows.push({ label: LABEL, user: n, check: "sign-in", status: "skipped (user does not exist)" }); continue; }
  const cookie = cookieFor(session);

  for (const p of LIST) record(n, `GET ${p}`, await call(cookie, "GET", p));

  // Guard: the app must be talking to the local stack (synthetic names visible)
  const own = await call(cookie, "GET", "/api/current-accounts");
  if (!guardPassed) {
    if (own.status !== 200 || !JSON.stringify(own.names).includes("Test Cari")) {
      console.table(rows);
      throw new Error("Guard failed: the app does not return the local synthetic data. Is it pointed at the local stack? No write was sent.");
    }
    guardPassed = true;
  }

  if (n <= 16) record(n, "GET own current account", await call(cookie, "GET", `/api/current-accounts/${rid("ca-user", n)}`), "200");
  const other = n === 1 ? 2 : 1;
  record(n, `GET current account of u${other}`, await call(cookie, "GET", `/api/current-accounts/${rid("ca-user", other)}`), "404/403/empty");
  record(n, `GET invoice of u${other}'s company`, await call(cookie, "GET", `/api/invoices/${rid("inv", other)}`), "404/403/empty");
  // Cross-tenant delete probe, only with --delete-probe: the old build deletes
  // another company's invoice when it has no account link (service-role
  // fallback authorizes it), which changes the row set the stage checks
  // compare against. Use it only where the delete must be refused.
  if (DELETE_PROBE) {
    record(n, `DELETE invoice of u${other}'s company`, await call(cookie, "DELETE", `/api/invoices/${rid("inv", other + 16)}`), "404/403, row stays");
  }

  if (WRITE) {
    record(n, "POST current account", await call(cookie, "POST", "/api/current-accounts", { name: `API ${LABEL} cari u${n}` }), "201");
    record(n, "POST category", await call(cookie, "POST", "/api/categories", { name: `API ${LABEL} kategori u${n}` }), "2xx");
    record(n, "POST warehouse", await call(cookie, "POST", "/api/warehouses", { name: `API ${LABEL} depo u${n}` }), "2xx");
    record(n, "POST bank", await call(cookie, "POST", "/api/banks", { name: `API ${LABEL} banka u${n}` }), "2xx");
    record(n, "POST safe", await call(cookie, "POST", "/api/safes", { name: `API ${LABEL} kasa u${n}` }), "2xx");
    if (n <= 16) {
      record(n, "POST collection on own account", await call(cookie, "POST", `/api/current-accounts/${rid("ca-user", n)}/collections`,
        { amount: 1, movementType: "COLLECTION", paymentMethod: "OTHER" }), "2xx");
    }
  }
}

console.table(rows.map(({ names, ...r }) => r));
fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
console.log(`Saved ${rows.length} rows to ${OUT}`);
