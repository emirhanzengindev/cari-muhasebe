import { create } from 'zustand';
import { Product, Category, Warehouse, StockMovement } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

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
        // Get current tenantId from tenant store
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        
        // Load existing products from localStorage
        const existingProducts = get().products;
        
        // Filter products by tenantId (in real app, this would be dynamic)
        const tenantProducts = existingProducts.filter(product => product.tenantId === currentTenantId);
        
        set({ products: tenantProducts, loading: false });
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
        
        // Mock implementation - use dynamic tenantId
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        const newProduct: Product = {
          ...productData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: currentTenantId,
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
        // Get current tenantId from tenant store
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        
        // Load existing categories from localStorage
        const existingCategories = get().categories;
        
        // Filter categories by tenantId (in real app, this would be dynamic)
        const tenantCategories = existingCategories.filter(category => category.tenantId === currentTenantId);
        
        set({ categories: tenantCategories, loading: false });
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
        
        // Mock implementation - use dynamic tenantId
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        const newCategory: Category = {
          ...categoryData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: currentTenantId,
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
        // Get current tenantId from tenant store
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        
        // Load existing warehouses from localStorage
        const existingWarehouses = get().warehouses;
        
        // Filter warehouses by tenantId (in real app, this would be dynamic)
        const tenantWarehouses = existingWarehouses.filter(warehouse => warehouse.tenantId === currentTenantId);
        
        set({ warehouses: tenantWarehouses, loading: false });
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
        
        // Mock implementation - use dynamic tenantId
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        const newWarehouse: Warehouse = {
          ...warehouseData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: currentTenantId,
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
        // Get current tenantId from tenant store
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        
        // Load existing stock movements from localStorage
        const existingStockMovements = get().stockMovements;
        
        // Filter stock movements by tenantId (in real app, this would be dynamic)
        const tenantStockMovements = existingStockMovements.filter(movement => movement.tenantId === currentTenantId);
        
        set({ stockMovements: tenantStockMovements, loading: false });
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
        
        // Mock implementation - use dynamic tenantId
        const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
        const newMovement: StockMovement = {
          ...movementData,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: currentTenantId,
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
      // Filter stock movements by tenantId as well
      const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
      return get().stockMovements.filter(movement => 
        movement.productId === productId && movement.tenantId === currentTenantId
      );
    },
  };
});