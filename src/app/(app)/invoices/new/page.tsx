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
    } catch (err) {
      console.error(err);
      setError("Fatura oluşturulamadı");
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
//test 
      {/* FORM JSX burada devam ediyor */}
    </div>
  );
}
