"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useCartStore } from "@/stores/cartStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useInvoiceItemStore } from "@/stores/invoiceItemStore";
import { useTenantStore } from "@/lib/tenantStore";

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

  const customerAccounts = accounts.filter(account => account.accountType === "CUSTOMER" && account.isActive);

  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleAddByBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => 
      p.barcode && p.barcode.toLowerCase() === barcodeInput.toLowerCase()
    );
    
    if (product) {
      addItem(product);
      setBarcodeInput("");
    } else {
      alert("Ürün bulunamadı!");
    }
  };

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
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
        await updateAccountBalance(customer.id, totalAmount, 'SALES');
      }
      
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
    } catch (error) {
      alert("Satış tamamlanamadı ve fatura oluşturulamadı. Lütfen tekrar deneyin.");
      console.error("Error creating invoice:", error);
    }
  };

  // Para birimi sembolünü döndüren yardımcı fonksiyon
  const getCurrencySymbol = () => {
    return currency === "TRY" ? "₺" : "$";
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hızlı Satış</h1>
        <p className="mt-1 text-sm text-gray-500">Perakende satışlar için hızlı POS arayüzü</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          {/* Currency Selection */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Para Birimi</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrency("TRY")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currency === "TRY"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Türk Lirası (₺)
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currency === "USD"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ABD Doları ($)
              </button>
            </div>
          </div>

          {/* Barcode Input */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Barkodla Ekle</h2>
            <form onSubmit={handleAddByBarcode} className="flex">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Barkodu tarayın veya elle girin"
                className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ekle
              </button>
            </form>
          </div>

          {/* Customer Selection */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Müşteri</h2>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-black"
            >
              <option value="" className="text-gray-500">Müşteri Seçin</option>
              {customerAccounts.map((account) => (
                <option key={account.id} value={account.id} className="text-black">
                  {account.name}
                </option>
              ))}
            </select>
            
            {/* Description Field */}
            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Açıklama (İsteğe Bağlı)
              </label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black"
                placeholder="Açıklamayı buraya girin..."
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ürün Arama</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Ürünleri arayın..."
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ürünler</h2>
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500">Ürün bulunamadı.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="mt-1 text-sm text-gray-500">{product.sku}</div>
                    <div className="mt-2 text-sm font-medium text-gray-900">
                      {getCurrencySymbol()}{(product.sellPrice ?? 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 sticky top-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Alışveriş Sepeti</h2>
            
            {cartItems.length === 0 ? (
              <p className="text-gray-500">Sepetiniz boş.</p>
            ) : (
              <>
                <div className="flow-root">
                  <ul className="-my-4 divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <li key={item.product.id} className="py-4">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.product.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-900">
                              <span>{getCurrencySymbol()}{(item.product.sellPrice ?? 0).toFixed(2)} × {item.quantity}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 mr-3">
                              {getCurrencySymbol()}{item.totalPrice.toFixed(2)}
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <span className="mx-2 text-sm text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Ara Toplam</dt>
                      <dd className="text-sm font-medium text-gray-900">{getCurrencySymbol()}{subtotal.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <dt className="text-base font-medium text-gray-900">Toplam</dt>
                      <dd className="text-base font-medium text-gray-900">{getCurrencySymbol()}{totalAmount.toFixed(2)}</dd>
                    </div>
                  </dl>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleCompleteSale}
                      className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Satışı Tamamla
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full mt-3 flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Sepeti Temizle
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}