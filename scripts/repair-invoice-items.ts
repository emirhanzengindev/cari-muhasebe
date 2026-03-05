import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

type Row = Record<string, any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

const args = process.argv.slice(2);
const isApply = args.includes("--apply");
const tenantArgIndex = args.findIndex((x) => x === "--tenant");
const limitArgIndex = args.findIndex((x) => x === "--limit");
const tenantFilter =
  tenantArgIndex >= 0 && args[tenantArgIndex + 1] ? args[tenantArgIndex + 1] : null;
const invoiceLimit =
  limitArgIndex >= 0 && args[limitArgIndex + 1]
    ? Number(args[limitArgIndex + 1])
    : Number.POSITIVE_INFINITY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const getMissingColumnName = (message?: string | null) => {
  if (!message) return null;
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /Could not find the "([^"]+)" column/i,
    /column '([^']+)'/i,
    /column "([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const isMissingTableError = (error: any) => {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (message.includes("could not find the table") && message.includes("schema cache")) ||
    (message.includes("relation") && message.includes("does not exist"))
  );
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNumber = (...values: any[]) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const getInvoiceNo = (invoice: Row) =>
  String(invoice.invoice_number || invoice.invoice_no || invoice.number || "").trim();

const fetchAll = async (table: string, selectExpr = "*", allowMissingTable = false) => {
  const allRows: Row[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(selectExpr)
      .range(from, from + pageSize - 1);

    if (tenantFilter) query = query.eq("tenant_id", tenantFilter);

    const { data, error } = await query;
    if (error) {
      if (allowMissingTable && isMissingTableError(error)) {
        return { rows: [], missingTable: true };
      }
      throw new Error(`${table} fetch failed: ${error.message}`);
    }
    const rows = Array.isArray(data) ? data : [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return { rows: allRows, missingTable: false };
};

const fetchProductsForUnitMap = async () => {
  try {
    return await fetchAll("products", "id, unit");
  } catch (err: any) {
    if (
      String(err?.message || "")
        .toLowerCase()
        .includes("column products.unit does not exist")
    ) {
      return await fetchAll("products", "id");
    }
    throw err;
  }
};

const insertInvoiceItemWithPruning = async (basePayload: Row) => {
  const payload = { ...basePayload };
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data, error } = await supabase
      .from("invoice_items")
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error) return { ok: true, data };

    const missing =
      getMissingColumnName(error.message) ||
      getMissingColumnName(error.details) ||
      getMissingColumnName(error.hint);

    if (missing && missing in payload) {
      delete payload[missing];
      continue;
    }

    return { ok: false, error };
  }

  return { ok: false, error: { message: "Column pruning retries exceeded" } };
};

const run = async () => {
  console.log("== Invoice Item Repair ==");
  console.log(`Mode: ${isApply ? "APPLY" : "DRY-RUN"}`);
  if (tenantFilter) console.log(`Tenant filter: ${tenantFilter}`);

  const [invoicesRes, invoiceItemsRes, stockMovementsRes, productsRes] = await Promise.all([
    fetchAll("invoices", "*"),
    fetchAll("invoice_items", "*", true),
    fetchAll("stock_movements", "*"),
    fetchProductsForUnitMap(),
  ]);
  const invoices = invoicesRes.rows;
  const invoiceItems = invoiceItemsRes.rows;
  const stockMovements = stockMovementsRes.rows;
  const products = productsRes.rows;

  if (invoiceItemsRes.missingTable) {
    console.log("WARNING: invoice_items table is missing in schema cache.");
    if (isApply) {
      console.log("Apply mode stopped: cannot insert repair rows without invoice_items table.");
      process.exit(1);
    }
  }

  const itemInvoiceIds = new Set<string>();
  for (const item of invoiceItems) {
    const id = String(item.invoice_id || item.invoiceId || "").trim();
    if (id) itemInvoiceIds.add(id);
  }

  const unitByProductId = new Map<string, string>();
  for (const p of products) {
    unitByProductId.set(String(p.id), String(p.unit || "metre"));
  }

  const missingInvoices = invoices
    .filter((inv) => !itemInvoiceIds.has(String(inv.id)))
    .slice(0, Number.isFinite(invoiceLimit) ? invoiceLimit : undefined);

  console.log(`Invoices total: ${invoices.length}`);
  console.log(`Invoices with items: ${itemInvoiceIds.size}`);
  console.log(`Missing invoices to process: ${missingInvoices.length}`);

  let repairedInvoiceCount = 0;
  let insertedItemCount = 0;
  let skippedCount = 0;
  const failures: string[] = [];

  for (const invoice of missingInvoices) {
    const invoiceId = String(invoice.id);
    const tenantId = String(invoice.tenant_id || "");
    const invoiceNo = getInvoiceNo(invoice);
    const invoiceType = String(invoice.invoice_type || invoice.type || "SALES").toUpperCase();
    const expectedMovementType = invoiceType === "PURCHASE" ? "in" : "out";

    if (!invoiceNo) {
      skippedCount += 1;
      failures.push(`${invoiceId}: no invoice number`);
      continue;
    }

    const invoiceNoPattern = new RegExp(`(^|[^A-Z0-9-])#?${escapeRegex(invoiceNo)}([^A-Z0-9-]|$)`, "i");
    const matchedMovements = stockMovements.filter((mv) => {
      if (tenantId && String(mv.tenant_id || "") !== tenantId) return false;
      const description = String(mv.description || "");
      if (!description || !invoiceNoPattern.test(description)) return false;
      const movementType = String(mv.movement_type || "").toLowerCase();
      return movementType === expectedMovementType;
    });

    if (matchedMovements.length === 0) {
      skippedCount += 1;
      failures.push(`${invoiceId}: no stock movement match for ${invoiceNo}`);
      continue;
    }

    const grouped = new Map<string, { productId: string; unitPrice: number; quantity: number }>();
    for (const mv of matchedMovements) {
      const productId = String(mv.product_id || "").trim();
      if (!productId) continue;
      const unitPrice = toNumber(mv.price, 0);
      const qty = Math.abs(toNumber(mv.quantity, 0));
      if (qty <= 0) continue;
      const key = `${productId}::${unitPrice}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity += qty;
      } else {
        grouped.set(key, { productId, unitPrice, quantity: qty });
      }
    }

    if (grouped.size === 0) {
      skippedCount += 1;
      failures.push(`${invoiceId}: matched movements have no usable product/qty`);
      continue;
    }

    let invoiceInsertedCount = 0;
    for (const row of grouped.values()) {
      const payload: Row = {
        invoice_id: invoiceId,
        product_id: row.productId,
        unit: unitByProductId.get(row.productId) || "metre",
        quantity: row.quantity,
        unit_price: row.unitPrice,
        vat_rate: 0,
        total: Number((row.quantity * row.unitPrice).toFixed(2)),
        currency: String(invoice.currency || "TRY"),
        tenant_id: tenantId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!isApply) {
        invoiceInsertedCount += 1;
        insertedItemCount += 1;
        continue;
      }

      const result = await insertInvoiceItemWithPruning(payload);
      if (!result.ok) {
        failures.push(
          `${invoiceId}: insert failed for product ${row.productId} -> ${result.error?.message || "unknown"}`
        );
        continue;
      }
      invoiceInsertedCount += 1;
      insertedItemCount += 1;
    }

    if (invoiceInsertedCount > 0) repairedInvoiceCount += 1;
    else skippedCount += 1;
  }

  console.log("== Summary ==");
  console.log(`Repaired invoices: ${repairedInvoiceCount}`);
  console.log(`Inserted invoice_items: ${insertedItemCount}`);
  console.log(`Skipped invoices: ${skippedCount}`);
  if (failures.length > 0) {
    console.log("Sample issues:");
    for (const msg of failures.slice(0, 20)) console.log(`- ${msg}`);
    if (failures.length > 20) {
      console.log(`... and ${failures.length - 20} more`);
    }
  }
};

run().catch((err) => {
  console.error("Repair failed:", err);
  process.exit(1);
});
