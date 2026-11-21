"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useCartStore } from "@/stores/cartStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useInvoiceItemStore } from "@/stores/invoiceItemStore";
import { useTenantStore } from "@/lib/tenantStore";
import { Minus, Package, Plus, ScanBarcode, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardHead, EmptyState, IconButton, PageHeader, SearchInput, ui } from "@/components/app-ui/ui";

export default function QuickSales() {
  const router = useRouter();
  const { products, fetchProducts, addStockMovement } = useInventoryStore();
  const { 
    items: cartItems, 
    subtotal, 
    totalAmount, 
    addItem, 
    removeItem, 
    updateItemQuantity,
    clearCart
  } = useCartStore();
  const { accounts, fetchAccounts, updateAccountBalance } = useCurrentAccountsStore();
  const { addInvoice } = useInvoiceStore();
  const { addInvoiceItem } = useInvoiceItemStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [currency, setCurrency] = useState<"TRY" | "USD">("USD"); // Varsayılan olarak USD
  const [description, setDescription] = useState(""); // Açıklama alanı eklendi
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchAccounts();
  }, [fetchProducts, fetchAccounts]);

  useEffect(() => {
    // Focus barcode input on mount
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const customerAccounts = accounts?.filter(account => account.accountType === "CUSTOMER" && account.isActive) || [];

  const filteredProducts = products?.filter(product => {
    const q = String(searchTerm ?? "").toLocaleLowerCase("tr-TR");
    const name = String(product?.name ?? "").toLocaleLowerCase("tr-TR");
    const sku = String(product?.sku ?? "").toLocaleLowerCase("tr-TR");
    const barcode = String(product?.barcode ?? "").toLocaleLowerCase("tr-TR");

    return name.includes(q) || sku.includes(q) || barcode.includes(q);
  }) || [];

  const handleAddByBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const targetBarcode = String(barcodeInput ?? "").toLowerCase();
    
    const product = products?.find(p => 
      String(p?.barcode ?? "").toLowerCase() === targetBarcode
    );
    
    if (product) {
      addItem(product);
      setBarcodeInput("");
    } else {
      alert("Ürün bulunamadı!");
    }
  };

  const handleCompleteSale = async () => {
    if (cartItems?.length || 0 === 0) {
      alert("Sepet boş!");
      return;
    }
    
    if (!selectedCustomer) {
      alert("Lütfen bir müşteri seçin!");
      return;
    }
    
    try {
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalAmount = subtotal;
      
      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      
      // Create invoice
      const tenantId = useTenantStore.getState().tenantId;
      if (!tenantId) {
        alert('Tenant ID not available. Please log in again.');
        return;
      }
      
      const newInvoice = await addInvoice({
        invoiceNumber,
        invoiceType: 'SALES',
        date: new Date(),
        accountId: selectedCustomer,
        subtotal,
        discount: 0,
        vatAmount: 0, // KDV kaldırıldı
        totalAmount,
        currency, // Para birimi eklendi
        description: description || undefined, // Açıklama yalnızca girilmişse eklensin
        isDraft: false,
        tenantId,
      });
      
      // Update account balance
      const customer = customerAccounts.find(c => c.id === selectedCustomer);
      if (customer) {
        await updateAccountBalance(customer.id, totalAmount);

      }
      //s
      // Create invoice items and deduct stock for each item
      for (const item of cartItems) {
        // Create invoice item
        await addInvoiceItem({
          invoiceId: newInvoice.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellPrice ?? 0,
          vatRate: 0, // KDV kaldırıldı
          total: item.totalPrice,
          currency, // Para birimi eklendi
          tenantId,
        });
        
        // Create stock movement record
        // Açıklama girilmişse stok hareketine ekle, değilse varsayılan açıklamayı kullan
        const stockMovementDescription = description 
          ? `${description} - Hızlı satış faturası #${invoiceNumber}`
          : `Hızlı satış faturası #${invoiceNumber}`;
          
        await addStockMovement({
          productId: item.product.id,
          movementType: "OUT",
          quantity: item.quantity,
          price: item.product.sellPrice ?? 0,
          description: stockMovementDescription,
          tenantId,
        });
      }
      
      alert(`${customerAccounts.find(c => c.id === selectedCustomer)?.name || 'Bilinmeyen Müşteri'} için satış tamamlandı! Toplam: ${getCurrencySymbol()}${totalAmount.toFixed(2)}. Fatura ${invoiceNumber} oluşturuldu.`);
      
      // Clear cart and reset selection
      clearCart();
      setSelectedCustomer("");
      setDescription(""); // Açıklama alanını da temizle
      
      // Redirect to invoice details page
      router.push(`/invoices/${newInvoice.id}`);
    } catch (error: any) {
      alert(error?.message || "Satış tamamlanamadı ve fatura oluşturulamadı. Lütfen tekrar deneyin.");
      console.error("Error creating invoice:", error);
    }
  };

  // Para birimi sembolünü döndüren yardımcı fonksiyon
  const getCurrencySymbol = () => {
    return currency === "TRY" ? "₺" : "$";
  };

  const hasProducts = filteredProducts.length > 0;
  const hasCartItems = (cartItems?.length ?? 0) > 0;
  const money = (value: number) => `${getCurrencySymbol()}${Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className={ui.page}>
      <PageHeader title="Hızlı Satış" description="Perakende satışlar için hızlı POS ekranı" />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid content-start gap-3">
          <Card>
            <CardHead title="Satış Bilgileri">
              <div role="radiogroup" aria-label="Para birimi" className="inline-flex rounded-[9px] bg-[var(--app-bg)] p-[3px]">
                {(["TRY", "USD"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={currency === code}
                    onClick={() => setCurrency(code)}
                    className={`h-7 rounded-[7px] px-3 text-[13px] font-medium transition-colors ${
                      currency === code
                        ? "bg-white text-[var(--app-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-[var(--app-ink-2)]"
                    }`}
                  >
                    {code === "TRY" ? "₺ TL" : "$ USD"}
                  </button>
                ))}
              </div>
            </CardHead>
            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <form onSubmit={handleAddByBarcode}>
                <label htmlFor="barcode" className={ui.label}>
                  Barkod
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="barcode"
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Barkodu okutun veya yazın"
                    className={ui.input}
                  />
                  <button type="submit" className={ui.btnDark}>
                    <ScanBarcode aria-hidden="true" />
                    Ekle
                  </button>
                </div>
              </form>
              <div>
                <label htmlFor="customer" className={ui.label}>
                  Müşteri
                </label>
                <select
                  id="customer"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className={ui.input}
                >
                  <option value="">Müşteri seçin</option>
                  {customerAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className={ui.label}>
                  Açıklama (isteğe bağlı)
                </label>
                <input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={ui.input}
                  placeholder="Açıklama girin..."
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="Ürünler">
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Ürün ara..." />
            </CardHead>
            {!hasProducts ? (
              <EmptyState
                icon={<Package aria-hidden="true" />}
                title={searchTerm ? "Aramaya uyan ürün yok" : "Henüz ürün yok"}
              />
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 px-4 pb-4">
                {filteredProducts.map((product) => {
                  const stock = Number(product.stockQuantity ?? (product as any).stock_quantity ?? 0);
                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => addItem(product)}
                        className="w-full rounded-[10px] border border-[var(--app-line)] p-2.5 text-left transition-[border-color,box-shadow] hover:border-[#d4d4d8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                      >
                        <b className="block truncate font-medium">{product.name}</b>
                        <small className={`block truncate ${ui.muted}`}>
                          {money(product.sellPrice ?? 0)} · {stock.toLocaleString("tr-TR")} adet
                        </small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <Card className="self-start lg:sticky lg:top-0">
          <CardHead icon={<ShoppingCart aria-hidden="true" />} title="Alışveriş Sepeti">
            {hasCartItems ? (
              <IconButton label="Sepeti temizle" danger onClick={clearCart}>
                <Trash2 aria-hidden="true" />
              </IconButton>
            ) : null}
          </CardHead>

          {!hasCartItems ? (
            <EmptyState icon={<ShoppingCart aria-hidden="true" />} title="Sepetiniz boş" description="Ürüne tıklayın veya barkod okutun." />
          ) : (
            <ul>
              {cartItems.map((item) => (
                <li key={item.product.id} className="border-t border-[#f2f2f3] px-4 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <b className="block truncate font-medium">{item.product.name}</b>
                      <small className={ui.muted}>
                        {money(item.product.sellPrice ?? 0)} × {item.quantity}
                      </small>
                    </div>
                    <span className={ui.num}>{money(item.totalPrice)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <IconButton
                      label={`${item.product.name} adedini azalt`}
                      onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                      className="h-7 w-7"
                    >
                      <Minus aria-hidden="true" />
                    </IconButton>
                    <span className="min-w-6 text-center tabular-nums">{item.quantity}</span>
                    <IconButton
                      label={`${item.product.name} adedini artır`}
                      onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                      className="h-7 w-7"
                    >
                      <Plus aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`${item.product.name} sepetten çıkar`}
                      danger
                      onClick={() => removeItem(item.product.id)}
                      className="ml-auto h-7 w-7"
                    >
                      <Trash2 aria-hidden="true" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <dl className="border-t border-[var(--app-line)] px-4 py-3">
            <div className={`flex justify-between ${ui.soft}`}>
              <dt>Ara toplam</dt>
              <dd className="tabular-nums">{money(subtotal)}</dd>
            </div>
            <div className="mt-1.5 flex justify-between text-[15px] font-semibold">
              <dt>Toplam</dt>
              <dd className="tabular-nums">{money(totalAmount)}</dd>
            </div>
          </dl>
          <div className="px-4 pb-4">
            <button type="button" onClick={handleCompleteSale} disabled={!hasCartItems} className={`${ui.btnDark} h-10 w-full`}>
              Satışı Tamamla
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
