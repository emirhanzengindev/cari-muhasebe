"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

  if (loading) {
    return <div className="py-6">Yukleniyor...</div>;
  }

  return (
    <div className="py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Cari Hesap Duzenle</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-3 bg-white p-4 rounded shadow">
        <input
          className="w-full border rounded p-2"
          placeholder="Ad"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Telefon"
          value={form.phone}
          onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
        />
        <textarea
          className="w-full border rounded p-2"
          placeholder="Adres"
          value={form.address}
          onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="w-full border rounded p-2"
            placeholder="Vergi No"
            value={form.tax_number}
            onChange={(e) => setForm((s) => ({ ...s, tax_number: e.target.value }))}
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Vergi Dairesi"
            value={form.tax_office}
            onChange={(e) => setForm((s) => ({ ...s, tax_office: e.target.value }))}
          />
        </div>
        <input
          className="w-full border rounded p-2"
          placeholder="Sirket"
          value={form.company}
          onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))}
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
            />
            Aktif
          </label>
          <select
            className="border rounded p-2"
            value={form.account_type}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                account_type: e.target.value === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER",
              }))
            }
          >
            <option value="CUSTOMER">Musteri</option>
            <option value="SUPPLIER">Tedarikci</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded border"
            onClick={() => router.push(`/current-accounts/${params.id}`)}
          >
            Iptal
          </button>
        </div>
      </form>
    </div>
  );
}
