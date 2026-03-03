"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useInvoiceItemStore } from "@/stores/invoiceItemStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useTenantStore } from "@/lib/tenantStore";

export default function NewInvoice() {
  const router = useRouter();

  const { addInvoice } = useInvoiceStore();
  const { addInvoiceItem } = useInvoiceItemStore();
  const { accounts, fetchAccounts, updateAccountBalance } =
    useCurrentAccountsStore();
  const { products, fetchProducts, addStockMovement } =
    useInventoryStore();

  const [invoiceType, setInvoiceType] =
    useState<"SALES" | "PURCHASE">("SALES");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(0);
  const [currency, setCurrency] =
    useState<"TRY" | "USD">("USD");
  const [items, setItems] = useState<
    Array<{ productId: string; quantity: number; unitPrice: number }>
  >([{ productId: "", quantity: 1, unitPrice: 0 }]);
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
    field: "productId" | "quantity" | "unitPrice",
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", quantity: 1, unitPrice: 0 },
    ]);
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
      const invoiceNumber = `INV-${Date.now()}`;

      const invoice = await addInvoice({
        invoiceNumber,
        invoiceType,
        date: new Date(invoiceDate),
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
            `${invoiceType === "SALES" ? "Satış" : "Alış"} faturası ${invoiceNumber}`,
          tenantId,
        });
      }

      // ✅ BAKİYE GÜNCELLEME (DOĞRU HALİ)
      const balanceChange =
        invoiceType === "SALES"
          ? totalAmount
          : -totalAmount;

      await updateAccountBalance(
        selectedAccount,
        balanceChange
      );

      router.push("/invoices");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Fatura oluşturulamadı");
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-4">
        Yeni Fatura
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">
              Fatura Tipi
            </label>
            <select
              value={invoiceType}
              onChange={(e) =>
                setInvoiceType(
                  e.target.value as "SALES" | "PURCHASE"
                )
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="SALES">Satis</option>
              <option value="PURCHASE">Alis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Tarih
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) =>
                setInvoiceDate(e.target.value)
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Cari Hesap
            </label>
            <select
              value={selectedAccount}
              onChange={(e) =>
                setSelectedAccount(e.target.value)
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seciniz</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Para Birimi
            </label>
            <select
              value={currency}
              onChange={(e) =>
                setCurrency(
                  e.target.value as "TRY" | "USD"
                )
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">
            Aciklama
          </label>
          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Kalemler
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="px-3 py-2 rounded bg-blue-600 text-white"
            >
              Kalem Ekle
            </button>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 border rounded p-3"
            >
              <div className="md:col-span-6">
                <label className="block text-sm mb-1">
                  Urun
                </label>
                <select
                  value={item.productId}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "productId",
                      e.target.value
                    )
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Seciniz</option>
                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {product.sku
                        ? ` (${product.sku})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">
                  Miktar
                </label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "quantity",
                      Number(e.target.value) || 0
                    )
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm mb-1">
                  Birim Fiyat
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "unitPrice",
                      Number(e.target.value) || 0
                    )
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="w-full px-3 py-2 rounded bg-red-600 text-white"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-start-3 space-y-2 border rounded p-3">
            <div className="flex justify-between">
              <span>Ara Toplam</span>
              <span>{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div>
              <label className="block text-sm mb-1">
                Indirim
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) =>
                  setDiscount(Number(e.target.value) || 0)
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Genel Toplam</span>
              <span>{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/invoices")}
            className="px-4 py-2 border rounded"
          >
            Iptal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Faturayi Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
