"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useInvoiceItemStore } from "@/stores/invoiceItemStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useParams } from "next/navigation";

export default function EditInvoice() {
  const router = useRouter();
  const params = useParams();
  const { getInvoiceById, updateInvoice, fetchInvoices } = useInvoiceStore();
  const { invoiceItems, fetchInvoiceItems } = useInvoiceItemStore();
  const { accounts, fetchAccounts } = useCurrentAccountsStore();
  const { products, fetchProducts } = useInventoryStore();
  
  const invoiceId = params.id as string;
  
  const [invoiceType, setInvoiceType] = useState<"SALES" | "PURCHASE">("SALES");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(0);
  const [currency, setCurrency] = useState<"TRY" | "USD">("USD");
  const [items, setItems] = useState<Array<{productId: string, quantity: number, unitPrice: number}>>([
    { productId: "", quantity: 1, unitPrice: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        // Tüm verileri yükle
        await Promise.all([
          fetchInvoices(),
          fetchAccounts(),
          fetchProducts(),
          fetchInvoiceItems()
        ]);

        // Belirli faturayı bul
        const invoice = getInvoiceById(invoiceId);
        if (!invoice) {
          setError("Invoice not found");
          setLoading(false);
          return;
        }

        // Fatura verilerini formda göster
        setInvoiceType(invoice.invoiceType);
        setSelectedAccount(invoice.accountId);
        setInvoiceDate(invoice.date.toISOString().split('T')[0]);
        setDescription(invoice.description || "");
        setDiscount(invoice.discount);
        setCurrency(invoice.currency as "TRY" | "USD");

        // Fatura kalemlerini bul ve formda göster
        const invoiceItemsForInvoice = invoiceItems.filter(item => item.invoiceId === invoiceId);
        if (invoiceItemsForInvoice.length > 0) {
          setItems(invoiceItemsForInvoice.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })));
        } else {
          setItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load invoice data");
        setLoading(false);
        console.error(err);
      }
    };

    loadInvoiceData();
  }, [invoiceId, getInvoiceById, fetchInvoices, fetchAccounts, fetchProducts, fetchInvoiceItems]);

  const customerAccounts = accounts.filter(account => account.accountType === "CUSTOMER" && account.isActive);
  const supplierAccounts = accounts.filter(account => account.accountType === "SUPPLIER" && account.isActive);

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    if (field === "productId") {
      newItems[index].productId = value as string;
      // Auto-fill unit price when product is selected
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unitPrice = invoiceType === "SALES" ? (product.sellPrice ?? 0) : (product.buyPrice ?? 0);
      }
    } else if (field === "quantity") {
      newItems[index][field] = Number(value);
    } else if (field === "unitPrice") {
      newItems[index][field] = Number(value);
    }
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      setError("Please select a customer/supplier");
      return;
    }
    
    if (items.some(item => !item.productId)) {
      setError("Please select a product for each item");
      return;
    }

    try {
      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();
      
      // Update the invoice
      await updateInvoice(invoiceId, {
        invoiceType,
        date: new Date(invoiceDate),
        accountId: selectedAccount,
        subtotal,
        discount,
        vatAmount: 0, // KDV kaldırıldı
        totalAmount,
        currency,
        description: description || undefined,
        isDraft: false,
        updatedAt: new Date()
      });
      
      router.push("/invoices");
    } catch (err) {
      setError("Failed to update invoice");
      console.error(err);
    }
  };

  // Para birimi sembolünü döndüren yardımcı fonksiyon
  const getCurrencySymbol = () => {
    return currency === "TRY" ? "₺" : "$";
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="mt-1 text-sm text-gray-500">Update an existing sales or purchase invoice</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="invoiceType" className="block text-sm font-medium text-gray-700">
                  Invoice Type
                </label>
                <select
                  id="invoiceType"
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as "SALES" | "PURCHASE")}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-black"
                >
                  <option value="SALES">Sales Invoice</option>
                  <option value="PURCHASE">Purchase Invoice</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "TRY" | "USD")}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-black"
                >
                  <option value="TRY">Turkish Lira (₺)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">
                  Invoice Date
                </label>
                <input
                  type="date"
                  id="invoiceDate"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black"
                />
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
                  {invoiceType === "SALES" ? "Customer" : "Supplier"}
                </label>
                <select
                  id="accountId"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-black"
                >
                  <option value="" className="text-gray-500">Select {invoiceType === "SALES" ? "Customer" : "Supplier"}</option>
                  {(invoiceType === "SALES" ? customerAccounts : supplierAccounts).map((account) => (
                    <option key={account.id} value={account.id} className="text-black">
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black"
                  placeholder="Enter description here..."
                />
              </div>

              <div className="sm:col-span-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Item
                  </button>
                </div>

                <div className="border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-black"
                            >
                              <option value="">Select Product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id} className="text-black">
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-black"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-black"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getCurrencySymbol()}{(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              disabled={items.length <= 1}
                              className={`text-red-600 hover:text-red-900 ${items.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex justify-end">
                  <div className="w-1/3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm font-medium text-gray-900">{getCurrencySymbol()}{calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Discount:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="block w-24 pl-2 pr-2 py-1 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white text-black"
                        />
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-base font-medium text-gray-900">Total:</span>
                        <span className="text-base font-medium text-gray-900">{getCurrencySymbol()}{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => router.push("/invoices")}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}