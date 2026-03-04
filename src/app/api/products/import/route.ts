import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerSupabaseClientForRLS } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

const MAX_IMPORT_ROWS = 3000;

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "ad", "urun", "urunadi", "urunad"],
  sku: ["sku", "stokkodu", "stok_kodu", "kod"],
  barcode: ["barcode", "barkod", "barkodno"],
  category_id: ["categoryid", "kategoriid", "category_id"],
  category_name: ["category", "kategori", "kategoriadi", "categoryname", "category_name"],
  warehouse_id: ["warehouseid", "depoid", "warehouse_id"],
  warehouse_name: ["warehouse", "depo", "depoadi", "warehousename", "warehouse_name"],
  buy_price: ["buyprice", "alisfiyati", "alis", "maliyet"],
  sell_price: ["sellprice", "satisfiyati", "satis", "fiyat"],
  vat_rate: ["vatrate", "kdv", "kdvorani", "vat"],
  stock_quantity: ["stockquantity", "stok", "stokmiktari", "miktar", "adet"],
  critical_level: ["criticallevel", "kritikseviye", "kritikstok"],
  min_stock_level: ["minstocklevel", "minstok", "minimumstok"],
  unit: ["unit", "birim"],
  width: ["width", "genislik", "en"],
  weight: ["weight", "agirlik", "gramaj", "gsm"],
  color: ["color", "renk"],
  size: ["size", "beden", "olcu"],
  description: ["description", "aciklama", "not"],
  is_active: ["isactive", "aktif", "durum"],
};

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]/g, "");
}

function getValue(row: RawRow, aliases: string[]): unknown {
  for (const [key, value] of Object.entries(row)) {
    if (aliases.includes(normalizeHeader(key))) return value;
  }
  return undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim().replace(/\s/g, "");
  if (!text) return fallback;

  const hasComma = text.includes(",");
  const hasDot = text.includes(".");

  let normalized = text;
  if (hasComma && hasDot) {
    const lastComma = text.lastIndexOf(",");
    const lastDot = text.lastIndexOf(".");
    normalized =
      lastComma > lastDot
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  } else if (hasComma) {
    normalized = text.replace(",", ".");
  }

  normalized = normalized.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = true): boolean {
  const text = toOptionalString(value)?.toLowerCase();
  if (!text) return fallback;
  if (["0", "false", "pasif", "hayir", "no"].includes(text)) return false;
  if (["1", "true", "aktif", "evet", "yes"].includes(text)) return true;
  return fallback;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClientForRLS();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
    }

    const userMetadataTenantId =
      typeof user.user_metadata?.tenant_id === "string" ? user.user_metadata.tenant_id : null;
    const resolvedTenantId = userMetadataTenantId || user.id;
    const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

    const formData = await request.formData();
    const modeValue = String(formData.get("mode") || "insert").toLowerCase();
    const importMode: "insert" | "upsert" = modeValue === "upsert" ? "upsert" : "insert";
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel dosyasi bulunamadi." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) {
      return NextResponse.json({ error: "Excel dosyasinda sayfa bulunamadi." }, { status: 400 });
    }

    const rows = XLSX.utils.sheet_to_json<RawRow>(workbook.Sheets[firstSheet], {
      defval: "",
      raw: false,
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "Excel dosyasi bos." }, { status: 400 });
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `Tek seferde en fazla ${MAX_IMPORT_ROWS} satir import edilebilir.` },
        { status: 400 }
      );
    }

    const [categoryRes, warehouseRes] = await Promise.all([
      supabase.from("categories").select("id,name").in("tenant_id", tenantCandidates),
      supabase.from("warehouses").select("id,name").in("tenant_id", tenantCandidates),
    ]);

    const categoryByName = new Map<string, string>();
    const warehouseByName = new Map<string, string>();

    for (const category of categoryRes.data || []) {
      const key = normalizeHeader(String(category.name || ""));
      if (key) categoryByName.set(key, category.id);
    }
    for (const warehouse of warehouseRes.data || []) {
      const key = normalizeHeader(String(warehouse.name || ""));
      if (key) warehouseByName.set(key, warehouse.id);
    }

    const failures: Array<{ row: number; reason: string; value?: string }> = [];
    let importedCount = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;

      const name = toOptionalString(getValue(row, HEADER_ALIASES.name));
      if (!name) {
        failures.push({ row: rowNumber, reason: "name zorunlu" });
        continue;
      }

      const categoryIdFromSheet = toOptionalString(getValue(row, HEADER_ALIASES.category_id));
      const categoryName = toOptionalString(getValue(row, HEADER_ALIASES.category_name));
      const warehouseIdFromSheet = toOptionalString(getValue(row, HEADER_ALIASES.warehouse_id));
      const warehouseName = toOptionalString(getValue(row, HEADER_ALIASES.warehouse_name));

      const categoryId =
        categoryIdFromSheet ||
        (categoryName ? categoryByName.get(normalizeHeader(categoryName)) : undefined);
      const warehouseId =
        warehouseIdFromSheet ||
        (warehouseName ? warehouseByName.get(normalizeHeader(warehouseName)) : undefined);

      const payload: Record<string, unknown> = {
        name,
        tenant_id: resolvedTenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sku: toOptionalString(getValue(row, HEADER_ALIASES.sku)),
        barcode: toOptionalString(getValue(row, HEADER_ALIASES.barcode)),
        category_id: categoryId,
        warehouse_id: warehouseId,
        buy_price: toNumber(getValue(row, HEADER_ALIASES.buy_price), 0),
        sell_price: toNumber(getValue(row, HEADER_ALIASES.sell_price), 0),
        vat_rate: toNumber(getValue(row, HEADER_ALIASES.vat_rate), 0),
        stock_quantity: toNumber(getValue(row, HEADER_ALIASES.stock_quantity), 0),
        critical_level: toNumber(getValue(row, HEADER_ALIASES.critical_level), 0),
        min_stock_level: toNumber(getValue(row, HEADER_ALIASES.min_stock_level), 0),
        unit: toOptionalString(getValue(row, HEADER_ALIASES.unit)),
        width: toNumber(getValue(row, HEADER_ALIASES.width), 0),
        weight: toNumber(getValue(row, HEADER_ALIASES.weight), 0),
        color: toOptionalString(getValue(row, HEADER_ALIASES.color)),
        size: toOptionalString(getValue(row, HEADER_ALIASES.size)),
        description: toOptionalString(getValue(row, HEADER_ALIASES.description)),
        is_active: toBoolean(getValue(row, HEADER_ALIASES.is_active), true),
      };

      for (const key of Object.keys(payload)) {
        if (payload[key] === undefined) delete payload[key];
      }

      let writePayload = { ...payload };
      let writeError: { message: string; code?: string } | null = null;
      let existingId: string | null = null;

      if (importMode === "upsert") {
        const sku = toOptionalString(payload.sku);
        if (sku) {
          const { data: existing, error: existingError } = await supabase
            .from("products")
            .select("id")
            .in("tenant_id", tenantCandidates)
            .eq("name", name)
            .eq("sku", sku)
            .limit(1)
            .maybeSingle();

          if (existingError) {
            failures.push({ row: rowNumber, reason: existingError.message, value: name });
            continue;
          }
          existingId = existing?.id ?? null;
        }
      }

      const maxAttempts = Object.keys(writePayload).length + 1;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const op = existingId
          ? supabase.from("products").update(writePayload).eq("id", existingId)
          : supabase.from("products").insert(writePayload);

        const { error } = await op;
        writeError = error ? { message: error.message, code: error.code } : null;
        if (!writeError) break;

        if (writeError.code !== "PGRST204") break;
        const match = writeError.message.match(/'([^']+)' column of 'products'/i);
        const missingColumn = match?.[1];
        if (!missingColumn || !(missingColumn in writePayload)) break;
        if (missingColumn === "tenant_id" || missingColumn === "name") break;
        const { [missingColumn]: _removed, ...nextPayload } = writePayload;
        writePayload = nextPayload;
      }

      if (writeError) {
        failures.push({ row: rowNumber, reason: writeError.message, value: name });
        continue;
      }

      importedCount++;
    }

    return NextResponse.json({
      totalRows: rows.length,
      importedCount,
      failedCount: failures.length,
      failures,
    });
  } catch (error) {
    console.error("product import error", error);
    return NextResponse.json({ error: "Import islemi basarisiz." }, { status: 500 });
  }
}
