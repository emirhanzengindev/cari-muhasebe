"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useTenantStore } from "@/lib/tenantStore";
import { Alert, Card, Field, PageHeader, ui } from "@/components/app-ui/ui";

export default function NewAccount() {
  const router = useRouter();
  const { addAccount } = useCurrentAccountsStore();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    taxOffice: "",
    taxNumber: "",
    accountType: "CUSTOMER" as "CUSTOMER" | "SUPPLIER",
    isActive: true,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name.trim()) {
        setError("Hesap adı zorunludur.");
        setLoading(false);
        return;
      }

      const tenantId = useTenantStore.getState().tenantId;

      if (!tenantId) {
        setError("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      await addAccount({
        name: formData.name,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        tax_office: formData.taxOffice || undefined,
        tax_number: formData.taxNumber || undefined,
        company: undefined,
        balance: 0,
        tenant_id: tenantId,
        isActive: formData.isActive,
        accountType: formData.accountType,
      });

      router.push("/current-accounts");
    } catch (err) {
      setError("Hesap oluşturulurken bir hata oluştu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${ui.page} max-w-3xl`}>
      <PageHeader
        title="Yeni Cari Hesap"
        description="Müşteri veya tedarikçi kaydı oluşturun"
        back={{ href: "/current-accounts", label: "Cari Hesaplar" }}
      />
      {error && <Alert>{error}</Alert>}

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field id="name" label="Hesap adı *" className="sm:col-span-2">
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={ui.input} required />
          </Field>
          <Field id="accountType" label="Hesap tipi">
            <select id="accountType" name="accountType" value={formData.accountType} onChange={handleChange} className={ui.input}>
              <option value="CUSTOMER">Müşteri</option>
              <option value="SUPPLIER">Tedarikçi</option>
            </select>
          </Field>
          <Field id="phone" label="Telefon">
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={ui.input} />
          </Field>
          <Field id="taxOffice" label="Vergi dairesi">
            <input type="text" name="taxOffice" id="taxOffice" value={formData.taxOffice} onChange={handleChange} className={ui.input} />
          </Field>
          <Field id="taxNumber" label="Vergi numarası">
            <input type="text" name="taxNumber" id="taxNumber" value={formData.taxNumber} onChange={handleChange} className={ui.input} />
          </Field>
          <Field id="address" label="Adres" className="sm:col-span-2">
            <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className={ui.textarea} />
          </Field>
          <label htmlFor="isActive" className="flex items-center gap-2 sm:col-span-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 accent-[var(--app-accent)]"
            />
            Hesap aktif
          </label>
          <div className="flex justify-end gap-2 border-t border-[var(--app-line)] pt-4 sm:col-span-2">
            <button type="button" onClick={() => router.push("/current-accounts")} className={ui.btn}>
              İptal
            </button>
            <button type="submit" disabled={loading} className={ui.btnDark}>
              {loading ? "Kaydediliyor..." : "Hesabı Oluştur"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
