"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useTenantStore } from "@/lib/tenantStore";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Barcode,
  CircleDollarSign,
  Download,
  Layers,
  Package,
  Plus,
  Tag,
  Upload,
  Warehouse,
  X,
} from "lucide-react";
import {
  Alert,
  Avatar,
  Card,
  EmptyState,
  IconButton,
  PageHeader,
  RowActions,
  SearchInput,
  Spinner,
  Status,
  TableFoot,
  Tabs,
  tl,
  ui,
} from "@/components/app-ui/ui";

type ImportFailure = {
  row: number;
  reason: string;
  value?: string;
};

type ImportResult = {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  failures: ImportFailure[];
};

const thInner = "inline-flex items-center gap-1.5";

const isLow = (product: any) =>
  Number(product.stockQuantity || product.stock_quantity || 0) <=
  Number(product.criticalLevel || product.critical_level || 0);

export default function Inventory() {
  const router = useRouter();
  const { products, categories, warehouses, loading, error, fetchProducts, fetchCategories, fetchWarehouses, addProduct, addCategory, addWarehouse } = useInventoryStore();
  const [filter, setFilter] = useState<"ALL" | "LOW_STOCK">("ALL");
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
  const [isImportingProducts, setIsImportingProducts] = useState(false);
  const [productImportError, setProductImportError] = useState<string | null>(null);
  const [productImportResult, setProductImportResult] = useState<ImportResult | null>(null);
  const [productImportMode, setProductImportMode] = useState<"insert" | "upsert">("insert");
  const productImportInputRef = useRef<HTMLInputElement | null>(null);
  const didInitialLoadRef = useRef(false);

  const tenantId = useTenantStore(state => state.tenantId);
  
  useEffect(() => {
    if (tenantId && !didInitialLoadRef.current) {
      didInitialLoadRef.current = true;
      fetchProducts();
      fetchCategories();
      fetchWarehouses();
    }
  }, [tenantId, fetchProducts, fetchCategories, fetchWarehouses]);

  const filteredProducts = products?.filter(product => {
    const q = String(searchTerm ?? "").toLocaleLowerCase("tr-TR");
    const name = String(product?.name ?? "").toLocaleLowerCase("tr-TR");
    const sku = String(product?.sku ?? "").toLocaleLowerCase("tr-TR");
    const barcode = String(product?.barcode ?? "").toLocaleLowerCase("tr-TR");
    const matchesSearch = name.includes(q) || sku.includes(q) || barcode.includes(q);

    if (filter === "LOW_STOCK") return matchesSearch && isLow(product);
    return matchesSearch;
  }) || [];

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return "Kategorisiz";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Bilinmeyen kategori";
  };

  const getWarehouseName = (warehouseId: string | undefined) => {
    if (!warehouseId) return "Atanmamış";
    const warehouse = warehouses.find(wh => wh.id === warehouseId);
    return warehouse ? warehouse.name : "Bilinmeyen depo";
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
        throw new Error('Tenant ID not available');
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
      alert('Tenant ID not available');
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
      alert('Tenant ID not available');
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

  const downloadProductTemplate = () => {
    const csv = [
      "name,sku,barcode,category_name,warehouse_name,buy_price,sell_price,vat_rate,stock_quantity,critical_level,min_stock_level,unit,width,weight,color,size,description,is_active",
      "Ornek Urun,SKU-001,8680000000001,Kumaslar,Ana Depo,95.5,129.9,20,50,5,3,metre,150,240,Lacivert,Standart,Ornek urun satiri,true",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "urun-import-sablon.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const triggerProductImport = () => {
    productImportInputRef.current?.click();
  };

  const handleProductImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setProductImportError("Yalnizca .xlsx veya .xls dosyalari yukleyin.");
      return;
    }

    setIsImportingProducts(true);
    setProductImportError(null);
    setProductImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", productImportMode);

      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Urun import sirasinda hata olustu.");
      }

      setProductImportResult(payload as ImportResult);
      await fetchProducts();
    } catch (err) {
      setProductImportError(
        err instanceof Error ? err.message : "Urun import sirasinda hata olustu."
      );
    } finally {
      setIsImportingProducts(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className={ui.page}>
        <PageHeader title="Stok Yönetimi" />
        <Alert>{error}</Alert>
      </div>
    );
  }

  const allProducts = products || [];
  const lowCount = allProducts.filter(isLow).length;

  return (
    <div className={ui.page}>
      <PageHeader
        title="Stok Yönetimi"
        description="Ürünlerinizi, kategorilerinizi ve depolarınızı yönetin"
        actions={
          <>
            <input
              ref={productImportInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleProductImportFileChange}
            />
            <button type="button" onClick={() => setShowManageCategoriesModal(true)} className={ui.btn}>
              <Tag aria-hidden="true" />
              Kategoriler
            </button>
            <button type="button" onClick={() => setShowManageWarehousesModal(true)} className={ui.btn}>
              <Warehouse aria-hidden="true" />
              Depolar
            </button>
            <button type="button" onClick={downloadProductTemplate} className={ui.btn}>
              <Download aria-hidden="true" />
              Şablon İndir
            </button>
            <label className="sr-only" htmlFor="product-import-mode">
              İçe aktarma modu
            </label>
            <select
              id="product-import-mode"
              value={productImportMode}
              onChange={(e) => setProductImportMode(e.target.value as "insert" | "upsert")}
              className={ui.btn}
            >
              <option value="insert">Yalnız ekle</option>
              <option value="upsert">Varsa güncelle</option>
            </select>
            <button type="button" onClick={triggerProductImport} disabled={isImportingProducts} className={ui.btn}>
              <Upload aria-hidden="true" />
              {isImportingProducts ? "İçe aktarılıyor..." : "Excel Yükle"}
            </button>
            <button type="button" onClick={() => setShowAddProductModal(true)} className={ui.btnDark}>
              <Plus aria-hidden="true" />
              Ürün Ekle
            </button>
          </>
        }
      />

      {productImportError && <Alert>{productImportError}</Alert>}

      {productImportResult && (
        <Alert tone={productImportResult.failedCount > 0 ? "amber" : "green"}>
          <p>
            Toplam satır: <strong>{productImportResult.totalRows}</strong> · Başarılı:{" "}
            <strong>{productImportResult.importedCount}</strong> · Hatalı:{" "}
            <strong>{productImportResult.failedCount}</strong>
          </p>

          {productImportResult.failures.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 font-medium">Satır</th>
                    <th className="px-2 py-1 font-medium">Değer</th>
                    <th className="px-2 py-1 font-medium">Hata</th>
                  </tr>
                </thead>
                <tbody>
                  {productImportResult.failures.slice(0, 25).map((failure, idx) => (
                    <tr key={`${failure.row}-${idx}`} className="border-t border-black/5">
                      <td className="px-2 py-1">{failure.row}</td>
                      <td className="px-2 py-1">{failure.value || "-"}</td>
                      <td className="px-2 py-1">{failure.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Alert>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 pt-3.5">
          <Tabs
            items={[
              { value: "ALL", label: "Tüm Ürünler", count: allProducts.length },
              { value: "LOW_STOCK", label: "Düşük Stok", count: lowCount },
            ]}
            value={filter as "ALL" | "LOW_STOCK"}
            onChange={setFilter}
            label="Ürün filtresi"
          />
          <div className="w-full sm:ml-auto sm:w-auto">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Ürün, SKU veya barkod ara..." />
          </div>
        </div>

        {filteredProducts.length > 0 && (
          <div className="overflow-x-auto">
            <table className={ui.table}>
              <thead>
                <tr>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Package size={13} className={ui.muted} aria-hidden="true" />Ürün</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Barcode size={13} className={ui.muted} aria-hidden="true" />SKU / Barkod</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Tag size={13} className={ui.muted} aria-hidden="true" />Kategori</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Warehouse size={13} className={ui.muted} aria-hidden="true" />Depo</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><CircleDollarSign size={13} className={ui.muted} aria-hidden="true" />Fiyat</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><BarChart3 size={13} className={ui.muted} aria-hidden="true" />Stok</span>
                  </th>
                  <th scope="col" className={ui.th}>
                    <span className={thInner}><Layers size={13} className={ui.muted} aria-hidden="true" />Kumaş Detayları</span>
                  </th>
                  <th scope="col" className={`${ui.th} text-right`}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const name = String(product.name || "Adsız ürün");
                  const stock = Number(product.stockQuantity || product.stock_quantity || 0);
                  const critical = Number(product.criticalLevel || product.critical_level || 0);
                  const buy = Number(product.buyPrice || product.buy_price || 0);
                  const sell = Number(product.sellPrice || product.sell_price || 0);
                  const vat = Number(product.vatRate || product.vat_rate || 0);
                  const details = [
                    product.unit ? `Birim: ${product.unit}` : "",
                    product.pattern ? `Desen: ${product.pattern}` : "",
                    product.composition ? String(product.composition) : "",
                    product.width ? `${product.width} cm` : "",
                    product.weight ? `${product.weight} GSM` : "",
                  ].filter(Boolean);
                  return (
                    <tr key={product.id} className={ui.tr}>
                      <td className={ui.td}>
                        <Link href={`/inventory/${product.id}`} className="flex items-center gap-2.5">
                          <Avatar name={name} square />
                          <span className="font-medium">{name}</span>
                        </Link>
                      </td>
                      <td className={ui.td}>
                        <span className="block">{product.sku || <span className={ui.muted}>—</span>}</span>
                        {product.barcode ? <small className={ui.muted}>{product.barcode}</small> : null}
                      </td>
                      <td className={ui.td}>
                        <Status tone="gray">{getCategoryName(product.categoryId || product.category_id)}</Status>
                      </td>
                      <td className={`${ui.td} ${ui.soft}`}>
                        {getWarehouseName(product.warehouseId || product.warehouse_id)}
                      </td>
                      <td className={ui.td}>
                        <span className={ui.num}>{tl(sell)}</span>
                        <small className={`block ${ui.muted}`}>
                          alış {tl(buy)} · KDV %{vat}
                        </small>
                      </td>
                      <td className={ui.td}>
                        {stock <= 0 ? (
                          <Status tone="red">Tükendi</Status>
                        ) : stock <= critical ? (
                          <Status tone="amber">{stock.toLocaleString("tr-TR")} adet</Status>
                        ) : (
                          <span className={ui.num}>
                            {stock.toLocaleString("tr-TR")} <small className={ui.muted}>adet</small>
                          </span>
                        )}
                        <small className={`block ${ui.muted}`}>Kritik: {critical}</small>
                      </td>
                      <td className={ui.td}>
                        {product.color ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-black/10"
                              style={{ backgroundColor: String(product.color).toLowerCase() }}
                              aria-hidden="true"
                            />
                            {product.color}
                          </span>
                        ) : null}
                        {details.length ? (
                          <small className={`block ${ui.muted}`}>{details.join(" · ")}</small>
                        ) : !product.color ? (
                          <span className={ui.muted}>—</span>
                        ) : null}
                      </td>
                      <td className={ui.td}>
                        <RowActions name={name} viewHref={`/inventory/${product.id}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {allProducts.length === 0 ? (
          <EmptyState
            icon={<Package aria-hidden="true" />}
            title="Henüz ürün yok"
            description="Yeni bir ürün ekleyerek veya Excel dosyasından içe aktararak başlayın."
            action={
              <button type="button" onClick={() => setShowAddProductModal(true)} className={ui.btnDark}>
                <Plus aria-hidden="true" />
                Yeni Ürün Ekle
              </button>
            }
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState title="Bu filtreye uyan ürün yok" />
        ) : (
          <TableFoot>
            <span>
              {filteredProducts.length} ürün gösteriliyor
              {filteredProducts.length !== allProducts.length ? ` · toplam ${allProducts.length}` : ""}
            </span>
            {lowCount > 0 ? <span className="text-[#b45309]">{lowCount} ürün kritik seviyede</span> : null}
          </TableFoot>
        )}
      </Card>

      {/* Ürün ekleme */}
      {showAddProductModal && (
        <div className={ui.modalBackdrop}>
          <div role="dialog" aria-modal="true" aria-labelledby="add-product-title" className={`${ui.modal} max-w-2xl`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 id="add-product-title" className="text-[16px] font-semibold">
                Yeni Ürün Ekle
              </h2>
              <IconButton label="Kapat" onClick={handleCancelAddProduct}>
                <X aria-hidden="true" />
              </IconButton>
            </div>
            <form onSubmit={handleAddProduct}>
              {productFormError && <Alert>{productFormError}</Alert>}
              {productFormSuccess && <Alert tone="green">{productFormSuccess}</Alert>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="productName" label="Ürün Adı *" wide>
                  <input
                    type="text"
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className={ui.input}
                    placeholder="Ürün adı"
                    required
                  />
                </Field>
                <Field id="productSku" label="SKU">
                  <input
                    type="text"
                    id="productSku"
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value)}
                    className={ui.input}
                    placeholder="Stok kodu"
                  />
                </Field>
                <Field id="productBarcode" label="Barkod">
                  <input
                    type="text"
                    id="productBarcode"
                    value={productBarcode}
                    onChange={(e) => setProductBarcode(e.target.value)}
                    className={ui.input}
                    placeholder="Barkod"
                  />
                </Field>
                <Field id="productCategory" label="Kategori">
                  <select
                    id="productCategory"
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value)}
                    className={ui.input}
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="productWarehouse" label="Depo">
                  <select
                    id="productWarehouse"
                    value={productWarehouseId}
                    onChange={(e) => setProductWarehouseId(e.target.value)}
                    className={ui.input}
                  >
                    <option value="">Depo seçin</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="productBuyPrice" label="Alış Fiyatı (₺)">
                  <input
                    type="number"
                    id="productBuyPrice"
                    value={productBuyPrice}
                    onChange={(e) => setProductBuyPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className={ui.input}
                    placeholder="0,00"
                  />
                </Field>
                <Field id="productSellPrice" label="Satış Fiyatı (₺)">
                  <input
                    type="number"
                    id="productSellPrice"
                    value={productSellPrice}
                    onChange={(e) => setProductSellPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className={ui.input}
                    placeholder="0,00"
                  />
                </Field>
                <Field id="productVatRate" label="KDV Oranı (%)">
                  <input
                    type="number"
                    id="productVatRate"
                    value={productVatRate}
                    onChange={(e) => setProductVatRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className={ui.input}
                    placeholder="18"
                  />
                </Field>
                <Field id="productStockQuantity" label="Stok Miktarı">
                  <input
                    type="number"
                    id="productStockQuantity"
                    value={productStockQuantity}
                    onChange={(e) => setProductStockQuantity(e.target.value)}
                    min="0"
                    step="1"
                    className={ui.input}
                    placeholder="0"
                    required
                  />
                </Field>
                <Field id="productCriticalLevel" label="Kritik Seviye">
                  <input
                    type="number"
                    id="productCriticalLevel"
                    value={productCriticalLevel}
                    onChange={(e) => setProductCriticalLevel(e.target.value)}
                    min="0"
                    step="1"
                    className={ui.input}
                    placeholder="5"
                  />
                </Field>
                <Field id="productColor" label="Renk">
                  <input
                    type="text"
                    id="productColor"
                    value={productColor}
                    onChange={(e) => setProductColor(e.target.value)}
                    className={ui.input}
                    placeholder="Kumaş rengi"
                  />
                </Field>
                <Field id="productUnit" label="Birim">
                  <input
                    type="text"
                    id="productUnit"
                    value={productUnit}
                    onChange={(e) => setProductUnit(e.target.value)}
                    className={ui.input}
                    placeholder="metre, kg..."
                  />
                </Field>
                <Field id="productPattern" label="Desen">
                  <input
                    type="text"
                    id="productPattern"
                    value={productPattern}
                    onChange={(e) => setProductPattern(e.target.value)}
                    className={ui.input}
                    placeholder="Kumaş deseni"
                  />
                </Field>
                <Field id="productComposition" label="Kompozisyon">
                  <input
                    type="text"
                    id="productComposition"
                    value={productComposition}
                    onChange={(e) => setProductComposition(e.target.value)}
                    className={ui.input}
                    placeholder="%100 Pamuk"
                  />
                </Field>
                <Field id="productWidth" label="Genişlik (cm)">
                  <input
                    type="number"
                    id="productWidth"
                    value={productWidth}
                    onChange={(e) => setProductWidth(e.target.value)}
                    min="0"
                    step="0.1"
                    className={ui.input}
                  />
                </Field>
                <Field id="productWeight" label="Ağırlık (GSM)">
                  <input
                    type="number"
                    id="productWeight"
                    value={productWeight}
                    onChange={(e) => setProductWeight(e.target.value)}
                    min="0"
                    step="0.1"
                    className={ui.input}
                  />
                </Field>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={handleCancelAddProduct} disabled={isSubmitting} className={ui.btn}>
                  İptal
                </button>
                <button type="submit" disabled={isSubmitting} className={ui.btnDark}>
                  {isSubmitting ? "Ekleniyor..." : "Ürün Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kategoriler */}
      {showManageCategoriesModal && (
        <div className={ui.modalBackdrop}>
          <div role="dialog" aria-modal="true" aria-labelledby="categories-title" className={`${ui.modal} max-w-md`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 id="categories-title" className="text-[16px] font-semibold">
                Kategoriler
              </h2>
              <IconButton label="Kapat" onClick={() => setShowManageCategoriesModal(false)}>
                <X aria-hidden="true" />
              </IconButton>
            </div>
            <label htmlFor="newCategoryName" className={ui.label}>
              Yeni kategori
            </label>
            <div className="flex gap-2">
              <input
                id="newCategoryName"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={ui.input}
                placeholder="Kategori adı"
              />
              <button type="button" onClick={handleAddCategory} className={ui.btnDark}>
                Ekle
              </button>
            </div>
            <h3 className="mb-1 mt-6 text-[12px] font-medium text-[var(--app-ink-2)]">
              Mevcut kategoriler ({categories.length})
            </h3>
            {categories.length === 0 ? (
              <p className={`py-3 ${ui.muted}`}>Henüz kategori yok.</p>
            ) : (
              <ul className="divide-y divide-[#f2f2f3]">
                {categories.map((category) => (
                  <li key={category.id} className="flex items-center gap-2.5 py-2.5">
                    <Avatar name={category.name} square size={26} />
                    {category.name}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setShowManageCategoriesModal(false)} className={ui.btn}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Depolar */}
      {showManageWarehousesModal && (
        <div className={ui.modalBackdrop}>
          <div role="dialog" aria-modal="true" aria-labelledby="warehouses-title" className={`${ui.modal} max-w-md`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 id="warehouses-title" className="text-[16px] font-semibold">
                Depolar
              </h2>
              <IconButton label="Kapat" onClick={() => setShowManageWarehousesModal(false)}>
                <X aria-hidden="true" />
              </IconButton>
            </div>
            <div className="grid gap-3">
              <div>
                <label htmlFor="newWarehouseName" className={ui.label}>
                  Depo adı
                </label>
                <input
                  id="newWarehouseName"
                  type="text"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  className={ui.input}
                  placeholder="Ana depo"
                />
              </div>
              <div>
                <label htmlFor="newWarehouseLocation" className={ui.label}>
                  Konum (isteğe bağlı)
                </label>
                <input
                  id="newWarehouseLocation"
                  type="text"
                  value={newWarehouseLocation}
                  onChange={(e) => setNewWarehouseLocation(e.target.value)}
                  className={ui.input}
                  placeholder="Şehir / adres"
                />
              </div>
              <div>
                <button type="button" onClick={handleAddWarehouse} className={ui.btnDark}>
                  <Plus aria-hidden="true" />
                  Depo Ekle
                </button>
              </div>
            </div>
            <h3 className="mb-1 mt-6 text-[12px] font-medium text-[var(--app-ink-2)]">
              Mevcut depolar ({warehouses.length})
            </h3>
            {warehouses.length === 0 ? (
              <p className={`py-3 ${ui.muted}`}>Henüz depo yok.</p>
            ) : (
              <ul className="divide-y divide-[#f2f2f3]">
                {warehouses.map((warehouse) => (
                  <li key={warehouse.id} className="flex items-center gap-2.5 py-2.5">
                    <Avatar name={warehouse.name} square size={26} />
                    <span>
                      {warehouse.name}
                      {warehouse.location && <small className={`block ${ui.muted}`}>{warehouse.location}</small>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setShowManageWarehousesModal(false)} className={ui.btn}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  wide,
  children,
}: {
  id: string;
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      {children}
    </div>
  );
}
