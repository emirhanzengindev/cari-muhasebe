"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Card, Field, PageHeader, Spinner, ui } from "@/components/app-ui/ui";

type AccountForm = {
  name: string;
  phone: string;
  address: string;
  tax_number: string;
  tax_office: string;
  company: string;
  is_active: boolean;
  account_type: "CUSTOMER" | "SUPPLIER";
};

export default function EditCurrentAccountPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AccountForm>({
    name: "",
    phone: "",
    address: "",
    tax_number: "",
    tax_office: "",
    company: "",
    is_active: true,
    account_type: "CUSTOMER",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/current-accounts/${params.id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          tax_number: data.tax_number || "",
          tax_office: data.tax_office || "",
          company: data.company || "",
          is_active: data.isActive ?? true,
          account_type: data.accountType === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER",
        });
      } catch {
        setError("Hesap bilgisi alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/current-accounts/${params.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      router.push(`/current-accounts/${params.id}`);
    } catch {
      setError("Kaydetme işlemi başarısız.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const set = <K extends keyof AccountForm>(key: K, value: AccountForm[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  return (
    <div className={`${ui.page} max-w-3xl`}>
      <PageHeader
        title="Cari Hesabı Düzenle"
        description={form.name || undefined}
        back={{ href: `/current-accounts/${params.id}`, label: "Cari detayı" }}
      />
      {error && <Alert>{error}</Alert>}

      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field id="name" label="Ad / Unvan *" className="sm:col-span-2">
            <input id="name" className={ui.input} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field id="account_type" label="Hesap tipi">
            <select
              id="account_type"
              className={ui.input}
              value={form.account_type}
              onChange={(e) => set("account_type", e.target.value === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER")}
            >
              <option value="CUSTOMER">Müşteri</option>
              <option value="SUPPLIER">Tedarikçi</option>
            </select>
          </Field>
          <Field id="phone" label="Telefon">
            <input id="phone" type="tel" className={ui.input} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field id="company" label="Şirket" className="sm:col-span-2">
            <input id="company" className={ui.input} value={form.company} onChange={(e) => set("company", e.target.value)} />
          </Field>
          <Field id="tax_number" label="Vergi no">
            <input id="tax_number" className={ui.input} value={form.tax_number} onChange={(e) => set("tax_number", e.target.value)} />
          </Field>
          <Field id="tax_office" label="Vergi dairesi">
            <input id="tax_office" className={ui.input} value={form.tax_office} onChange={(e) => set("tax_office", e.target.value)} />
          </Field>
          <Field id="address" label="Adres" className="sm:col-span-2">
            <textarea id="address" rows={3} className={ui.textarea} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--app-accent)]"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
            />
            Hesap aktif
          </label>
          <div className="flex justify-end gap-2 border-t border-[var(--app-line)] pt-4 sm:col-span-2">
            <button type="button" className={ui.btn} onClick={() => router.push(`/current-accounts/${params.id}`)}>
              İptal
            </button>
            <button type="submit" disabled={saving} className={ui.btnDark}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
