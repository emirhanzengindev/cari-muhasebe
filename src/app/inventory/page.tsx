"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useTenantStore } from "@/lib/tenantStore";
import { useRouter } from "next/navigation";

export default function Inventory() {
  const router = useRouter();
  const { products, categories, warehouses, loading, error, fetchProducts, fetchCategories, fetchWarehouses, addProduct, addCategory, addWarehouse } = useInventoryStore();
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showManageWarehousesModal, setShowManageWarehousesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [newWarehouseLocation, setNewWarehouseLocation] = useState("");
  
  // Product form state
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productBarcode, setProductBarcode] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productWarehouseId, setProductWarehouseId] = useState("");
  const [productBuyPrice, setProductBuyPrice] = useState("");
  const [productSellPrice, setProductSellPrice] = useState("");
  const [productVatRate, setProductVatRate] = useState("18"); // Default VAT rate
  const [productStockQuantity, setProductStockQuantity] = useState("0");
  const [productCriticalLevel, setProductCriticalLevel] = useState("5");
  const [productColor, setProductColor] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [productPattern, setProductPattern] = useState("");
  const [productComposition, setProductComposition] = useState("");
  const [productWidth, setProductWidth] = useState("0");
  const [productWeight, setProductWeight] = useState("0");
  const [productMinStockLevel, setProductMinStockLevel] = useState("0");
  const [productFormError, setProductFormError] = useState("");
  const [productFormSuccess, setProductFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenantId = useTenantStore(state => state.tenantId);
  
  useEffect(() => {
    if (tenantId) {
      fetchProducts();
      fetchCategories();
      fetchWarehouses();
    }
  }, [tenantId, fetchProducts, fetchCategories, fetchWarehouses]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "ALL") return matchesSearch;
    if (filter === "LOW_STOCK") return matchesSearch && Number(product.stockQuantity || product.stock_quantity || 0) <= Number(product.criticalLevel || product.critical_level || 0);
    return matchesSearch;
  });

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  const getWarehouseName = (warehouseId: string | undefined) => {
    if (!warehouseId) return "Unassigned";
    const warehouse = warehouses.find(wh => wh.id === warehouseId);
    return warehouse ? warehouse.name : "Unknown Warehouse";
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setProductFormError("");
    setProductFormSuccess("");
    
    try {
      // Validate required fields
      if (!productName.trim()) {
        throw new Error("Ürün adı gerekli");
      }
      
      if (productBuyPrice && isNaN(parseFloat(productBuyPrice)) || parseFloat(productBuyPrice) < 0) {
        throw new Error("Geçerli bir alış fiyatı girin");
      }
      
      if (productSellPrice && isNaN(parseFloat(productSellPrice)) || parseFloat(productSellPrice) < 0) {
        throw new Error("Geçerli bir satış fiyatı girin");
      }
      
      if (!productStockQuantity || isNaN(parseFloat(productStockQuantity)) || parseFloat(productStockQuantity) < 0) {
        throw new Error("Geçerli bir stok miktarı girin");
      }
      
      // Prepare product data
      const tenantId = useTenantStore.getState().tenantId;
      
      if (!tenantId) {
        console.warn('WARNING: Tenant ID not available when adding product');
        setProductFormError("Tenant ID not available");
        return;
      }
      
      const productData = {
        name: productName.trim(),
        sku: productSku.trim() || undefined,
        barcode: productBarcode.trim() || undefined,
        categoryId: productCategoryId || undefined,
        warehouseId: productWarehouseId || undefined,
        buyPrice: productBuyPrice ? parseFloat(productBuyPrice) : 0,
        sellPrice: productSellPrice ? parseFloat(productSellPrice) : 0,
        vatRate: parseFloat(productVatRate),
        stockQuantity: parseFloat(productStockQuantity),
        criticalLevel: parseFloat(productCriticalLevel),
        color: productColor.trim() || undefined,
        unit: productUnit.trim() || undefined,
        pattern: productPattern.trim() || undefined,
        composition: productComposition.trim() || undefined,
        width: productWidth ? parseFloat(productWidth) : undefined,
        weight: productWeight ? parseFloat(productWeight) : undefined,
        minStockLevel: productMinStockLevel ? parseFloat(productMinStockLevel) : undefined,
        tenantId: tenantId,
      };
      
      // Add product using the store
      await addProduct(productData);
      
      // Show success message
      setProductFormSuccess("Ürün başarıyla eklendi!");
      
      // Reset form after a short delay
      setTimeout(() => {
        resetProductForm();
        setShowAddProductModal(false);
        setProductFormSuccess("");
        // Refresh products list
        fetchProducts();
      }, 1500);
      
    } catch (error: any) {
      console.error("Error adding product:", error);
      setProductFormError(error.message || "Ürün eklenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetProductForm = () => {
    setProductName("");
    setProductSku("");
    setProductBarcode("");
    setProductCategoryId("");
    setProductWarehouseId("");
    setProductBuyPrice("");
    setProductSellPrice("");
    setProductVatRate("18");
    setProductStockQuantity("0");
    setProductCriticalLevel("5");
    setProductColor("");
    setProductUnit("");
    setProductPattern("");
    setProductComposition("");
    setProductWidth("0");
    setProductWeight("0");
    setProductMinStockLevel("0");
    setProductFormError("");
  };
  
  const handleCancelAddProduct = () => {
    resetProductForm();
    setShowAddProductModal(false);
    setProductFormError("");
    setProductFormSuccess("");
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = useTenantStore.getState().tenantId;
    
    if (!tenantId) {
      console.warn('WARNING: Tenant ID not available when adding item');
      return;
    }
    
    if (newCategoryName.trim()) {
      await addCategory({
        name: newCategoryName,
        tenantId: tenantId
      });
      setNewCategoryName("");
      await fetchCategories(); // Refresh categories
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = useTenantStore.getState().tenantId;
    
    if (!tenantId) {
      console.warn('WARNING: Tenant ID not available when adding item');
      return;
    }
    
    if (newWarehouseName.trim()) {
      await addWarehouse({
        name: newWarehouseName,
        location: newWarehouseLocation,
        tenantId: tenantId
      });
      setNewWarehouseName("");
      setNewWarehouseLocation("");
      await fetchWarehouses(); // Refresh warehouses
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center items-center h-64">
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
              <h3 className="text-sm font-medium text-red-800">Hata</h3>
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">Ürünlerinizi, kategorilerinizi ve depolarınızı yönetin</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={() => setShowManageCategoriesModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Kategorileri Yönet
          </button>
          <button 
            onClick={() => setShowManageWarehousesModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Depoları Yönet
          </button>
          <button 
            onClick={() => setShowAddProductModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ürün Ekle
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === "ALL"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Tüm Ürünler
            </button>
            <button
              onClick={() => setFilter("LOW_STOCK")}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === "LOW_STOCK"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Düşük Stok
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Ürünleri ara..."
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
      </div>

      {/* Products Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürün
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU/Barkod
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Depo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fiyatlar
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kumaş Detayları
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.sku || "-"}</div>
                  <div className="text-sm text-gray-500">{product.barcode || "-"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getCategoryName(product.categoryId || product.category_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getWarehouseName(product.warehouseId || product.warehouse_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Buy: ₺{(Number(product.buyPrice || product.buy_price || 0)).toFixed(2)}</div>
                  <div className="text-sm text-gray-900">Sell: ₺{(Number(product.sellPrice || product.sell_price || 0)).toFixed(2)}</div>
                  <div className="text-sm text-gray-500">VAT: %{Number(product.vatRate || product.vat_rate || 0)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${Number(product.stockQuantity || product.stock_quantity || 0) <= Number(product.criticalLevel || product.critical_level || 0) ? "text-red-600" : "text-green-600"}`}>
                    {Number(product.stockQuantity || product.stock_quantity || 0)}
                  </div>
                  <div className="text-xs text-gray-500">Critical: {Number(product.criticalLevel || product.critical_level || 0)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.color && (
                    <div>
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: product.color.toLowerCase() }}></span>
                      {product.color}
                    </div>
                  )}
                  {product.unit && <div>Unit: {product.unit}</div>}
                  {product.pattern && <div>Pattern: {product.pattern}</div>}
                  {product.composition && <div>Composition: {product.composition}</div>}
                  {product.width && <div>Width: {product.width} cm</div>}
                  {product.weight && <div>Weight: {product.weight} GSM</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/inventory/${product.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                    Görüntüle
                  </Link>
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    Düzenle
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün yok</h3>
            <p className="mt-1 text-sm text-gray-500">Yeni bir ürün oluşturarak başlayın.</p>
            <div className="mt-6">
              <button 
                onClick={() => setShowAddProductModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Yeni Ürün Ekle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-medium">1</span> - <span className="font-medium">{Math.min(10, products.length)}</span> arası gösteriliyor, Toplam: {' '}
            <span className="font-medium">{products.length}</span> ürün
          </div>
          <div className="flex space-x-2">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Önceki
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Sonraki
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Yeni Ürün Ekle</h3>
                <button 
                  onClick={handleCancelAddProduct}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <form onSubmit={handleAddProduct}>
                  {productFormError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Hata</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{productFormError}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {productFormSuccess && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L7 13.586 15.293 5.293a1 1 0 111.414 1.414l-9 9a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Başarılı</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>{productFormSuccess}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Name */}
                    <div className="col-span-2">
                      <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                        Ürün Adı *
                      </label>
                      <input
                        type="text"
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Ürün adı"
                        required
                      />
                    </div>
                    
                    {/* SKU */}
                    <div>
                      <label htmlFor="productSku" className="block text-sm font-medium text-gray-700">
                        SKU
                      </label>
                      <input
                        type="text"
                        id="productSku"
                        value={productSku}
                        onChange={(e) => setProductSku(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Ürün SKU'su"
                      />
                    </div>
                    
                    {/* Barcode */}
                    <div>
                      <label htmlFor="productBarcode" className="block text-sm font-medium text-gray-700">
                        Barkod
                      </label>
                      <input
                        type="text"
                        id="productBarcode"
                        value={productBarcode}
                        onChange={(e) => setProductBarcode(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Barkod"
                      />
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700">
                        Kategori
                      </label>
                      <select
                        id="productCategory"
                        value={productCategoryId}
                        onChange={(e) => setProductCategoryId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                      >
                        <option value="">Kategori Seçin</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Warehouse */}
                    <div>
                      <label htmlFor="productWarehouse" className="block text-sm font-medium text-gray-700">
                        Depo
                      </label>
                      <select
                        id="productWarehouse"
                        value={productWarehouseId}
                        onChange={(e) => setProductWarehouseId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                      >
                        <option value="">Depo Seçin</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Buy Price */}
                    <div>
                      <label htmlFor="productBuyPrice" className="block text-sm font-medium text-gray-700">
                        Alış Fiyatı (₺)
                      </label>
                      <input
                        type="number"
                        id="productBuyPrice"
                        value={productBuyPrice}
                        onChange={(e) => setProductBuyPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* Sell Price */}
                    <div>
                      <label htmlFor="productSellPrice" className="block text-sm font-medium text-gray-700">
                        Satış Fiyatı (₺)
                      </label>
                      <input
                        type="number"
                        id="productSellPrice"
                        value={productSellPrice}
                        onChange={(e) => setProductSellPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* VAT Rate */}
                    <div>
                      <label htmlFor="productVatRate" className="block text-sm font-medium text-gray-700">
                        KDV Oranı (%)
                      </label>
                      <input
                        type="number"
                        id="productVatRate"
                        value={productVatRate}
                        onChange={(e) => setProductVatRate(e.target.value)}
                        min="0"
                        max="100"
                        step="0.1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="18"
                      />
                    </div>
                    
                    {/* Stock Quantity */}
                    <div>
                      <label htmlFor="productStockQuantity" className="block text-sm font-medium text-gray-700">
                        Stok Miktarı
                      </label>
                      <input
                        type="number"
                        id="productStockQuantity"
                        value={productStockQuantity}
                        onChange={(e) => setProductStockQuantity(e.target.value)}
                        min="0"
                        step="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="0"
                        required
                      />
                    </div>
                    
                    {/* Critical Level */}
                    <div>
                      <label htmlFor="productCriticalLevel" className="block text-sm font-medium text-gray-700">
                        Kritik Seviye
                      </label>
                      <input
                        type="number"
                        id="productCriticalLevel"
                        value={productCriticalLevel}
                        onChange={(e) => setProductCriticalLevel(e.target.value)}
                        min="0"
                        step="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="5"
                      />
                    </div>
                    
                    {/* Color */}
                    <div>
                      <label htmlFor="productColor" className="block text-sm font-medium text-gray-700">
                        Renk
                      </label>
                      <input
                        type="text"
                        id="productColor"
                        value={productColor}
                        onChange={(e) => setProductColor(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Kumaş rengi"
                      />
                    </div>
                    
                    {/* Unit */}
                    <div>
                      <label htmlFor="productUnit" className="block text-sm font-medium text-gray-700">
                        Birim
                      </label>
                      <input
                        type="text"
                        id="productUnit"
                        value={productUnit}
                        onChange={(e) => setProductUnit(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Ölçü birimi (örn: metre, kg)"
                      />
                    </div>
                    
                    {/* Pattern */}
                    <div>
                      <label htmlFor="productPattern" className="block text-sm font-medium text-gray-700">
                        Desen
                      </label>
                      <input
                        type="text"
                        id="productPattern"
                        value={productPattern}
                        onChange={(e) => setProductPattern(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Kumaş deseni"
                      />
                    </div>
                    
                    {/* Composition */}
                    <div>
                      <label htmlFor="productComposition" className="block text-sm font-medium text-gray-700">
                        Kompozisyon
                      </label>
                      <input
                        type="text"
                        id="productComposition"
                        value={productComposition}
                        onChange={(e) => setProductComposition(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Kumaş kompozisyonu (örn: %100 Pamuk)"
                      />
                    </div>
                    
                    {/* Width */}
                    <div>
                      <label htmlFor="productWidth" className="block text-sm font-medium text-gray-700">
                        Genişlik (cm)
                      </label>
                      <input
                        type="number"
                        id="productWidth"
                        value={productWidth}
                        onChange={(e) => setProductWidth(e.target.value)}
                        min="0"
                        step="0.1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Genişlik (cm)"
                      />
                    </div>
                    
                    {/* Weight (GSM) */}
                    <div>
                      <label htmlFor="productWeight" className="block text-sm font-medium text-gray-700">
                        Ağırlık (GSM)
                      </label>
                      <input
                        type="number"
                        id="productWeight"
                        value={productWeight}
                        onChange={(e) => setProductWeight(e.target.value)}
                        min="0"
                        step="0.1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        placeholder="Gramaj (GSM)"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancelAddProduct}
                      disabled={isSubmitting}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Ekleniyor...
                        </>
                      ) : (
                        "Ürün Ekle"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Kategorileri Yönet</h3>
                <button 
                  onClick={() => setShowManageCategoriesModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Yeni Kategori Ekle</label>
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Kategori adı"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900">Mevcut Kategoriler</h4>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {categories.map((category) => (
                      <li key={category.id} className="py-2 flex justify-between">
                        <span className="text-sm text-gray-900">{category.name}</span>
                        <button className="text-sm text-red-600 hover:text-red-900">Sil</button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowManageCategoriesModal(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Warehouses Modal */}
      {showManageWarehousesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Depoları Yönet</h3>
                <button 
                  onClick={() => setShowManageWarehousesModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Yeni Depo Ekle</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={newWarehouseName}
                      onChange={(e) => setNewWarehouseName(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-2"
                      placeholder="Depo adı"
                    />
                    <input
                      type="text"
                      value={newWarehouseLocation}
                      onChange={(e) => setNewWarehouseLocation(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Konum (isteğe bağlı)"
                    />
                  </div>
                  <button
                    onClick={handleAddWarehouse}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Depo Ekle
                  </button>
                </div>
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900">Mevcut Depolar</h4>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {warehouses.map((warehouse) => (
                      <li key={warehouse.id} className="py-2 flex justify-between">
                        <div>
                          <span className="text-sm text-gray-900">{warehouse.name}</span>
                          {warehouse.location && (
                            <span className="block text-xs text-gray-500">{warehouse.location}</span>
                          )}
                        </div>
                        <button className="text-sm text-red-600 hover:text-red-900">Sil</button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowManageWarehousesModal(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}