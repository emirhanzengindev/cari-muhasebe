import { create } from 'zustand';
import { Product, Category, Warehouse, StockMovement } from '@/types';

// Load inventory data from localStorage on initial load
const loadInventoryFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const savedProducts = localStorage.getItem('inventoryProducts');
    const savedCategories = localStorage.getItem('inventoryCategories');
    const savedWarehouses = localStorage.getItem('inventoryWarehouses');
    const savedStockMovements = localStorage.getItem('inventoryStockMovements');
    
    return {
      products: savedProducts ? JSON.parse(savedProducts) : [],
      categories: savedCategories ? JSON.parse(savedCategories) : [],
      warehouses: savedWarehouses ? JSON.parse(savedWarehouses) : [],
      stockMovements: savedStockMovements ? JSON.parse(savedStockMovements) : []
    };
  }
  return {
    products: [],
    categories: [],
    warehouses: [],
    stockMovements: []
  };
};

// Save inventory data to localStorage
const saveInventoryToLocalStorage = (data: {
  products?: Product[],
  categories?: Category[],
  warehouses?: Warehouse[],
  stockMovements?: StockMovement[]
}) => {
  if (typeof window !== 'undefined') {
    if (data.products) {
      localStorage.setItem('inventoryProducts', JSON.stringify(data.products));
    }
    if (data.categories) {
      localStorage.setItem('inventoryCategories', JSON.stringify(data.categories));
    }
    if (data.warehouses) {
      localStorage.setItem('inventoryWarehouses', JSON.stringify(data.warehouses));
    }
    if (data.stockMovements) {
      localStorage.setItem('inventoryStockMovements', JSON.stringify(data.stockMovements));
    }
  }
};

interface InventoryState {
  products: Product[];
  categories: Category[];
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;
  
  // Product actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Category actions
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Warehouse actions
  fetchWarehouses: () => Promise<void>;
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWarehouse: (id: string, warehouse: Partial<Warehouse>) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  
  // Stock movement actions
  fetchStockMovements: () => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  getStockMovementsByProductId: (productId: string) => StockMovement[];
}

export const useInventoryStore = create<InventoryState>((set, get) => {
  const initialData = loadInventoryFromLocalStorage();
  
  return {
    products: initialData.products,
    categories: initialData.categories,
    warehouses: initialData.warehouses,
    stockMovements: initialData.stockMovements,
    loading: false,
    error: null,

    // Product actions
    fetchProducts: async () => {
      set({ loading: true, error: null });
      try {
        // Mock data - API route has issues with Next.js Turbopack
        const mockProducts: Product[] = [
          {
            id: 'fabric-1',
            name: 'Babyface',
            sku: 'FAB-BABY-001',
            barcode: 'FAB001BABY',
            buyPrice: 180.0,
            sellPrice: 300.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'White',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Textured',
            composition: 'Cotton/Polyester Blend',
            width: 150,
            weight: 170
          },
          {
            id: 'fabric-2',
            name: 'Soho',
            sku: 'FAB-SOHO-001',
            barcode: 'FAB002SOHO',
            buyPrice: 190.0,
            sellPrice: 320.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Black',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Plain',
            composition: 'Polyester',
            width: 145,
            weight: 160
          },
          {
            id: 'fabric-3',
            name: 'Alaska',
            sku: 'FAB-ALSK-001',
            barcode: 'FAB004ALSK',
            buyPrice: 250.0,
            sellPrice: 380.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Gold/White',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Printed',
            composition: 'Viscose Blend',
            width: 150,
            weight: 180
          },
          {
            id: 'fabric-4',
            name: 'Coco',
            sku: 'FAB-COCO-001',
            barcode: 'FAB008COCO',
            buyPrice: 200.0,
            sellPrice: 350.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Brown',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Woven',
            composition: '100% Linen',
            width: 140,
            weight: 200
          },
          {
            id: 'fabric-5',
            name: 'Luna',
            sku: 'FAB-LUNA-001',
            barcode: 'FAB009LUNA',
            buyPrice: 150.0,
            sellPrice: 250.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Silver',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Jacquard',
            composition: 'Cotton/Polyester Blend',
            width: 155,
            weight: 175
          },
          {
            id: 'fabric-6',
            name: 'Paris',
            sku: 'FAB-PARS-001',
            barcode: 'FAB010PARS',
            buyPrice: 220.0,
            sellPrice: 360.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Cream',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Embroidered',
            composition: 'Silk Blend',
            width: 145,
            weight: 165
          },
          {
            id: 'fabric-7',
            name: 'Venice',
            sku: 'FAB-VENC-001',
            barcode: 'FAB011VENC',
            buyPrice: 180.0,
            sellPrice: 310.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Blue',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Striped',
            composition: 'Cotton',
            width: 150,
            weight: 170
          },
          {
            id: 'fabric-8',
            name: 'Milano',
            sku: 'FAB-MILN-001',
            barcode: 'FAB012MILN',
            buyPrice: 240.0,
            sellPrice: 390.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Red',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Floral',
            composition: 'Viscose',
            width: 140,
            weight: 180
          },
          {
            id: 'fabric-9',
            name: 'Berlin',
            sku: 'FAB-BRLN-001',
            barcode: 'FAB013BRLN',
            buyPrice: 170.0,
            sellPrice: 290.0,
            vatRate: 18,
            stockQuantity: 20,
            criticalLevel: 5,
            tenantId: 'tenant-1',
            categoryId: '1',
            warehouseId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Fabric-specific fields
            color: 'Green',
            unit: 'meter',
            minStockLevel: 20,
            pattern: 'Checked',
            composition: 'Polyester/Cotton Blend',
            width: 155,
            weight: 165
          }
        ];
        
        // Merge existing products with mock data to avoid duplicates
        const existingProducts = get().products;
        const mergedProducts = [...existingProducts];
        mockProducts.forEach(mockProduct => {
          if (!mergedProducts.some(prod => prod.id === mockProduct.id)) {
            mergedProducts.push(mockProduct);
          }
        });
        
        set({ products: mergedProducts, loading: false });
        saveInventoryToLocalStorage({ products: mergedProducts });
      } catch (error) {
        set({ error: 'Failed to fetch products', loading: false });
      }
    },

    addProduct: async (productData) => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/products', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(productData),
        // });
        // const newProduct = await response.json();
        
        // Mock implementation
        const newProduct: Product = {
          ...productData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => {
          const updatedProducts = [...state.products, newProduct];
          saveInventoryToLocalStorage({ products: updatedProducts });
          return { products: updatedProducts };
        });
      } catch (error) {
        set({ error: 'Failed to add product' });
      }
    },

    updateProduct: async (id, productData) => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/products/${id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(productData),
        // });
        // const updatedProduct = await response.json();
        
        // Mock implementation
        set((state) => {
          const updatedProducts = state.products.map((product) =>
            product.id === id ? { ...product, ...productData, updatedAt: new Date() } : product
          );
          saveInventoryToLocalStorage({ products: updatedProducts });
          return { products: updatedProducts };
        });
      } catch (error) {
        set({ error: 'Failed to update product' });
      }
    },

    deleteProduct: async (id) => {
      try {
        // In a real app, this would be an API call
        // await fetch(`/api/products/${id}`, { method: 'DELETE' });
        
        // Mock implementation
        set((state) => {
          const updatedProducts = state.products.filter((product) => product.id !== id);
          saveInventoryToLocalStorage({ products: updatedProducts });
          return { products: updatedProducts };
        });
      } catch (error) {
        set({ error: 'Failed to delete product' });
      }
    },

    // Category actions
    fetchCategories: async () => {
      set({ loading: true, error: null });
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/categories');
        // const categories = await response.json();
        
        // Mock data for now
        const mockCategories: Category[] = [
          {
            id: '1',
            name: 'Kumaş',
            tenantId: 'tenant-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Hazır Giyim',
            tenantId: 'tenant-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        
        // Merge existing categories with mock data to avoid duplicates
        const existingCategories = get().categories;
        const mergedCategories = [...existingCategories];
        mockCategories.forEach(mockCategory => {
          if (!mergedCategories.some(cat => cat.id === mockCategory.id)) {
            mergedCategories.push(mockCategory);
          }
        });
        
        set({ categories: mergedCategories, loading: false });
        saveInventoryToLocalStorage({ categories: mergedCategories });
      } catch (error) {
        set({ error: 'Failed to fetch categories', loading: false });
      }
    },

    addCategory: async (categoryData) => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/categories', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(categoryData),
        // });
        // const newCategory = await response.json();
        
        // Mock implementation
        const newCategory: Category = {
          ...categoryData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => {
          const updatedCategories = [...state.categories, newCategory];
          saveInventoryToLocalStorage({ categories: updatedCategories });
          return { categories: updatedCategories };
        });
      } catch (error) {
        set({ error: 'Failed to add category' });
      }
    },

    updateCategory: async (id, categoryData) => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/categories/${id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(categoryData),
        // });
        // const updatedCategory = await response.json();
        
        // Mock implementation
        set((state) => {
          const updatedCategories = state.categories.map((category) =>
            category.id === id ? { ...category, ...categoryData, updatedAt: new Date() } : category
          );
          saveInventoryToLocalStorage({ categories: updatedCategories });
          return { categories: updatedCategories };
        });
      } catch (error) {
        set({ error: 'Failed to update category' });
      }
    },

    deleteCategory: async (id) => {
      try {
        // In a real app, this would be an API call
        // await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        
        // Mock implementation
        set((state) => {
          const updatedCategories = state.categories.filter((category) => category.id !== id);
          saveInventoryToLocalStorage({ categories: updatedCategories });
          return { categories: updatedCategories };
        });
      } catch (error) {
        set({ error: 'Failed to delete category' });
      }
    },

    // Warehouse actions
    fetchWarehouses: async () => {
      set({ loading: true, error: null });
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/warehouses');
        // const warehouses = await response.json();
        
        // Mock data for now
        const mockWarehouses: Warehouse[] = [
          {
            id: '1',
            name: 'Ana Depo',
            location: 'İstanbul Merkez',
            tenantId: 'tenant-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Fabrika Deposu',
            location: 'Bursa Fabrika',
            tenantId: 'tenant-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        
        // Merge existing warehouses with mock data to avoid duplicates
        const existingWarehouses = get().warehouses;
        const mergedWarehouses = [...existingWarehouses];
        mockWarehouses.forEach(mockWarehouse => {
          if (!mergedWarehouses.some(wh => wh.id === mockWarehouse.id)) {
            mergedWarehouses.push(mockWarehouse);
          }
        });
        
        set({ warehouses: mergedWarehouses, loading: false });
        saveInventoryToLocalStorage({ warehouses: mergedWarehouses });
      } catch (error) {
        set({ error: 'Failed to fetch warehouses', loading: false });
      }
    },

    addWarehouse: async (warehouseData) => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/warehouses', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(warehouseData),
        // });
        // const newWarehouse = await response.json();
        
        // Mock implementation
        const newWarehouse: Warehouse = {
          ...warehouseData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => {
          const updatedWarehouses = [...state.warehouses, newWarehouse];
          saveInventoryToLocalStorage({ warehouses: updatedWarehouses });
          return { warehouses: updatedWarehouses };
        });
      } catch (error) {
        set({ error: 'Failed to add warehouse' });
      }
    },

    updateWarehouse: async (id, warehouseData) => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/warehouses/${id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(warehouseData),
        // });
        // const updatedWarehouse = await response.json();
        
        // Mock implementation
        set((state) => {
          const updatedWarehouses = state.warehouses.map((warehouse) =>
            warehouse.id === id ? { ...warehouse, ...warehouseData, updatedAt: new Date() } : warehouse
          );
          saveInventoryToLocalStorage({ warehouses: updatedWarehouses });
          return { warehouses: updatedWarehouses };
        });
      } catch (error) {
        set({ error: 'Failed to update warehouse' });
      }
    },

    deleteWarehouse: async (id) => {
      try {
        // In a real app, this would be an API call
        // await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
        
        // Mock implementation
        set((state) => {
          const updatedWarehouses = state.warehouses.filter((warehouse) => warehouse.id !== id);
          saveInventoryToLocalStorage({ warehouses: updatedWarehouses });
          return { warehouses: updatedWarehouses };
        });
      } catch (error) {
        set({ error: 'Failed to delete warehouse' });
      }
    },

    // Stock movement actions
    fetchStockMovements: async () => {
      set({ loading: true, error: null });
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/stock-movements');
        // const stockMovements = await response.json();
        
        // Mock data for now
        const mockStockMovements: StockMovement[] = [
          {
            id: '1',
            productId: 'fabric-1',
            movementType: 'IN',
            quantity: 50,
            price: 180.0,
            description: 'Initial stock',
            tenantId: 'tenant-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            productId: 'fabric-2',
            movementType: 'IN',
            quantity: 40,
            price: 190.0,
            description: 'Initial stock',
            tenantId: 'tenant-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        
        // Merge existing stock movements with mock data to avoid duplicates
        const existingStockMovements = get().stockMovements;
        const mergedStockMovements = [...existingStockMovements];
        mockStockMovements.forEach(mockMovement => {
          if (!mergedStockMovements.some(mov => mov.id === mockMovement.id)) {
            mergedStockMovements.push(mockMovement);
          }
        });
        
        set({ stockMovements: mergedStockMovements, loading: false });
        saveInventoryToLocalStorage({ stockMovements: mergedStockMovements });
      } catch (error) {
        set({ error: 'Failed to fetch stock movements', loading: false });
      }
    },

    addStockMovement: async (movementData) => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/stock-movements', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(movementData),
        // });
        // const newMovement = await response.json();
        
        // Mock implementation
        const newMovement: StockMovement = {
          ...movementData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => {
          const updatedStockMovements = [...state.stockMovements, newMovement];
          saveInventoryToLocalStorage({ stockMovements: updatedStockMovements });
          return { stockMovements: updatedStockMovements };
        });
        
        // Update product stock quantity
        if (movementData.productId) {
          const product = get().products.find(p => p.id === movementData.productId);
          if (product) {
            const newQuantity = movementData.movementType === 'IN' 
              ? product.stockQuantity + movementData.quantity 
              : product.stockQuantity - movementData.quantity;
            
            set((state) => {
              const updatedProducts = state.products.map(p => 
                p.id === movementData.productId 
                  ? { ...p, stockQuantity: newQuantity, updatedAt: new Date() } 
                  : p
              );
              saveInventoryToLocalStorage({ products: updatedProducts });
              return { products: updatedProducts };
            });
          }
        }
      } catch (error) {
        set({ error: 'Failed to add stock movement' });
      }
    },

    getStockMovementsByProductId: (productId) => {
      return get().stockMovements.filter(movement => movement.productId === productId);
    },
  };
});