import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerSupabaseClientForRLS } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

const MAX_IMPORT_ROWS = 2000;

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "ad", "isim", "hesapadi", "hesapad", "hesap"],
  phone: ["phone", "telefon", "tel", "gsm"],
  address: ["address", "adres"],
  tax_number: ["taxnumber", "taxno", "vergino", "verginumarasi"],
  tax_office: ["taxoffice", "vergidairesi", "dairesi"],
  company: ["company", "firma", "sirket", "unvan"],
  balance: ["balance", "bakiye", "acilisbakiyesi", "acilisbakiye"],
  account_type: ["accounttype", "hesaptipi", "tip", "tur"],
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
  const entries = Object.entries(row);
  for (const [key, value] of entries) {
    const normalizedKey = normalizeHeader(key);
    if (aliases.includes(normalizedKey)) {
      return value;
    }
  }
  return undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return 0;

  const text = String(value).trim().replace(/\s/g, "");
  if (!text) return 0;

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
  return Number.isFinite(parsed) ? parsed : 0;
}

function toAccountType(value: unknown): "CUSTOMER" | "SUPPLIER" {
  const text = toOptionalString(value)?.toLowerCase() ?? "";
  if (!text) return "CUSTOMER";
  if (["supplier", "tedarikci", "satici"].some((x) => text.includes(x))) {
    return "SUPPLIER";
  }
  return "CUSTOMER";
}

function toIsActive(value: unknown): boolean {
  const text = toOptionalString(value)?.toLowerCase() ?? "";
  if (!text) return true;
  if (["0", "false", "pasif", "hayir", "no"].includes(text)) return false;
  return true;
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

    const formData = await request.formData();
    const modeValue = String(formData.get("mode") || "insert").toLowerCase();
    const importMode: "insert" | "upsert" = modeValue === "upsert" ? "upsert" : "insert";
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Excel dosyasi bulunamadi. 'file' alani zorunludur." },
        { status: 400 }
      );
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
        {
          error: `Tek seferde en fazla ${MAX_IMPORT_ROWS} satir import edilebilir.`,
        },
        { status: 400 }
      );
    }

    const failures: Array<{ row: number; reason: string; value?: string }> = [];
    let importedCount = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2; // header row = 1

      const name = toOptionalString(getValue(row, HEADER_ALIASES.name));
      if (!name) {
        failures.push({ row: rowNumber, reason: "name zorunlu", value: "" });
        continue;
      }

      const payload = {
        name,
        phone: toOptionalString(getValue(row, HEADER_ALIASES.phone)),
        address: toOptionalString(getValue(row, HEADER_ALIASES.address)),
        tax_number: toOptionalString(getValue(row, HEADER_ALIASES.tax_number)),
        tax_office: toOptionalString(getValue(row, HEADER_ALIASES.tax_office)),
        company: toOptionalString(getValue(row, HEADER_ALIASES.company)),
        balance: toNumber(getValue(row, HEADER_ALIASES.balance)),
        account_type: toAccountType(getValue(row, HEADER_ALIASES.account_type)),
        is_active: toIsActive(getValue(row, HEADER_ALIASES.is_active)),
        tenant_id: user.id,
        user_id: user.id,
      };

      let writeError: { message: string } | null = null;
      let existingId: string | null = null;

      if (importMode === "upsert") {
        let existingQuery = supabase
          .from("current_accounts")
          .select("id")
          .eq("tenant_id", user.id)
          .eq("name", name)
          .limit(1);

        if (payload.tax_number) {
          existingQuery = existingQuery.eq("tax_number", payload.tax_number);
        } else if (payload.phone) {
          existingQuery = existingQuery.eq("phone", payload.phone);
        }

        const { data: existing, error: existingError } = await existingQuery.maybeSingle();
        if (existingError) {
          failures.push({
            row: rowNumber,
            reason: existingError.message,
            value: name,
          });
          continue;
        }
        existingId = existing?.id ?? null;
      }

      const { error } = existingId
        ? await supabase.from("current_accounts").update(payload).eq("id", existingId)
        : await supabase.from("current_accounts").insert(payload);
      writeError = error ? { message: error.message } : null;

      if (writeError) {
        failures.push({
          row: rowNumber,
          reason: writeError.message,
          value: name,
        });
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
    console.error("current-account import error", error);
    return NextResponse.json({ error: "Import islemi basarisiz." }, { status: 500 });
  }
}
