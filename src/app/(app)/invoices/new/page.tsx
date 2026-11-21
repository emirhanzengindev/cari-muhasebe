"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useInvoiceItemStore } from "@/stores/invoiceItemStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useTenantStore } from "@/lib/tenantStore";
import { FileText, Package, Plus, Trash2 } from "lucide-react";
import { Alert, Card, CardHead, EmptyState, Field, IconButton, PageHeader, tl, ui } from "@/components/app-ui/ui";

export default function NewInvoice() {
  const router = useRouter();

  const { addInvoice } = useInvoiceStore();
  const { addInvoiceItem } = useInvoiceItemStore();
  const { accounts, fetchAccounts } =
    useCurrentAccountsStore();
  const { products, fetchProducts, addStockMovement } =
    useInventoryStore();

  const [invoiceType, setInvoiceType] =
    useState<"SALES" | "PURCHASE">("SALES");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(0);
  const [currency, setCurrency] =
    useState<"TRY" | "USD">("USD");
  const [items, setItems] = useState<
    Array<{ productId: string; unit: string; quantity: number; unitPrice: number }>
  >([{ productId: "", unit: "metre", quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchProducts();
  }, [fetchAccounts, fetchProducts]);

  const calculateSubtotal = () =>
    items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0
    );

  const calculateTotal = () =>
    calculateSubtotal() - discount;

  const updateItem = (
    index: number,
    field: "productId" | "unit" | "quantity" | "unitPrice",
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === "quantity" || field === "unitPrice" ? Number(String(value).replace(",", ".")) : value } : item
      )
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", unit: "metre", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleProductChange = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    const defaultUnit = String(selected?.unit || "metre");
    const defaultUnitPrice =
      invoiceType === "SALES"
        ? Number(selected?.sellPrice ?? selected?.sell_price ?? 0)
        : Number(selected?.buyPrice ?? selected?.buy_price ?? 0);

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId,
              unit: defaultUnit,
              unitPrice: Number.isFinite(defaultUnitPrice) ? defaultUnitPrice : 0,
            }
          : item
      )
    );
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedAccount) {
      setError("Lütfen müşteri / tedarikçi seçin");
      return;
    }

    if (items.some((i) => !i.productId)) {
      setError("Tüm kalemler için ürün seçilmelidir");
      return;
    }

    const tenantId = useTenantStore.getState().tenantId;
    if (!tenantId) {
      setError("Tenant bulunamadı, tekrar giriş yapın");
      return;
    }

    try {
      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();
      const invoice = await addInvoice({
        invoiceNumber: "",
        invoiceType,
        date: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        accountId: selectedAccount,
        subtotal,
        discount,
        vatAmount: 0,
        totalAmount,
        currency,
        description: description || undefined,
        isDraft: false,
        tenantId,
      });

      for (const item of items) {
        const product = products.find(
          (p) => p.id === item.productId
        );
        if (!product) continue;

        await addInvoiceItem({
          invoiceId: invoice.id,
          productId: item.productId,
          unit: item.unit || "metre",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: 0,
          total: item.quantity * item.unitPrice,
          currency,
          tenantId,
        });

        await addStockMovement({
          productId: item.productId,
          movementType:
            invoiceType === "SALES" ? "OUT" : "IN",
          quantity: item.quantity,
          price: item.unitPrice,
          description:
            description ||
            `${invoiceType === "SALES" ? "Satış" : "Alış"} faturası ${invoice.invoiceNumber}`,
          tenantId,
        });
      }

      // ✅ BAKİYE GÜNCELLEME (DOĞRU HALİ)
      router.push("/invoices");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Fatura oluşturulamadı");
    }
  };

  return (
    <div className={`${ui.page} max-w-5xl`}>
      <PageHeader
        title="Yeni Fatura"
        description="Satış veya alış faturası oluşturun"
        back={{ href: "/invoices", label: "Faturalar" }}
      />

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit} className="grid gap-3">
        <Card>
          <CardHead icon={<FileText aria-hidden="true" />} title="Fatura bilgileri" />
          <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field id="invoiceType" label="Fatura tipi">
              <select
                id="invoiceType"
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as "SALES" | "PURCHASE")}
                className={ui.input}
              >
                <option value="SALES">Satış</option>
                <option value="PURCHASE">Alış</option>
              </select>
            </Field>
            <Field id="selectedAccount" label="Cari hesap *">
              <select
                id="selectedAccount"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className={ui.input}
              >
                <option value="">Seçiniz</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="currency" label="Para birimi">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "TRY" | "USD")}
                className={ui.input}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
              </select>
            </Field>
            <Field id="invoiceDate" label="Tarih">
              <input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className={ui.input}
              />
            </Field>
            <Field id="invoice-due-date" label="Vade tarihi (isteğe bağlı)">
              <input
                id="invoice-due-date"
                type="date"
                value={dueDate}
                min={invoiceDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={ui.input}
              />
            </Field>
            <Field id="description" label="Açıklama">
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={ui.input}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHead icon={<Package aria-hidden="true" />} title="Kalemler">
            <button type="button" onClick={addItemRow} className={ui.btn}>
              <Plus aria-hidden="true" />
              Kalem Ekle
            </button>
          </CardHead>

          {items.length === 0 ? (
            <EmptyState title="Henüz kalem yok" description="Faturaya ürün eklemek için “Kalem Ekle”ye basın." />
          ) : (
            <ul>
              {items.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <li
                    key={index}
                    className="grid grid-cols-2 gap-3 border-t border-[#f2f2f3] px-4 py-3 md:grid-cols-[minmax(0,5fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_auto] md:items-end"
                  >
                    <Field id={`item-product-${index}`} label="Ürün" className="col-span-2 md:col-span-1">
                      <select
                        id={`item-product-${index}`}
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className={ui.input}
                      >
                        <option value="">Seçiniz</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                            {product.sku ? ` (${product.sku})` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id={`item-unit-${index}`} label="Birim">
                      <input
                        id={`item-unit-${index}`}
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value || "metre")}
                        className={ui.input}
                      />
                    </Field>
                    <Field id={`item-qty-${index}`} label="Miktar">
                      <input
                        id={`item-qty-${index}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value) || 0)}
                        className={ui.input}
                      />
                    </Field>
                    <Field id={`item-price-${index}`} label="Birim fiyat">
                      <input
                        id={`item-price-${index}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value) || 0)}
                        className={ui.input}
                      />
                    </Field>
                    <div>
                      <span className={ui.label}>Tutar</span>
                      <div className="flex h-9 items-center font-medium tabular-nums">{tl(lineTotal, currency)}</div>
                    </div>
                    <div className="flex items-end justify-end">
                      <IconButton label={`${index + 1}. kalemi sil`} danger onClick={() => removeItemRow(index)} className="h-9 w-9">
                        <Trash2 aria-hidden="true" />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end border-t border-[var(--app-line)] px-4 py-4">
            <dl className="grid w-full max-w-xs gap-2">
              <div className={`flex justify-between ${ui.soft}`}>
                <dt>Ara toplam</dt>
                <dd className="tabular-nums">{tl(calculateSubtotal(), currency)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>
                  <label htmlFor="discount" className={ui.soft}>
                    İndirim
                  </label>
                </dt>
                <dd>
                  <input
                    id="discount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className={`${ui.input} h-8 w-32 text-right`}
                  />
                </dd>
              </div>
              <div className="flex justify-between border-t border-[var(--app-line)] pt-2 text-[15px] font-semibold">
                <dt>Genel toplam</dt>
                <dd className="tabular-nums">{tl(calculateTotal(), currency)}</dd>
              </div>
            </dl>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.push("/invoices")} className={ui.btn}>
            İptal
          </button>
          <button type="submit" className={ui.btnDark}>
            Faturayı Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
