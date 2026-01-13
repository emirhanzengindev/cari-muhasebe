import { create } from 'zustand';
import { Product, Category, Warehouse, StockMovement } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

// Helper function to get tenant ID
const getTenantId = () => {
  return useTenantStore.getState().tenantId;
};

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = getTenantId();
  
  if (!tenantId) {
    throw new Error('Tenant ID not available');
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
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
  return {
    products: [],
    categories: [],
    warehouses: [],
    stockMovements: [],
    loading: false,
    error: null,

    // Product actions
    fetchProducts: async () => {
      set({ loading: true, error: null });
      try {
        const products = await makeApiRequest('/products');
        set({ products, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch products', loading: false });
      }
    },

    addProduct: async (productData) => {
      try {
        const newProduct = await makeApiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(productData),
        });
        
        set((state) => ({
          products: [...state.products, newProduct]
        }));
      } catch (error) {
        set({ error: 'Failed to add product' });
      }
    },

    updateProduct: async (id, productData) => {
      try {
        const updatedProduct = await makeApiRequest(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(productData),
        });
        
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? updatedProduct : product
          ),
        }));
      } catch (error) {
        set({ error: 'Failed to update product' });
      }
    },

    deleteProduct: async (id) => {
      try {
        await makeApiRequest(`/products/${id}`, {
          method: 'DELETE',
        });
        
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }));
      } catch (error) {
        set({ error: 'Failed to delete product' });
      }
    },

    // Category actions
    fetchCategories: async () => {
      set({ loading: true, error: null });
      try {
        const categories = await makeApiRequest('/categories');
        set({ categories, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch categories', loading: false });
      }
    },

    addCategory: async (categoryData) => {
      try {
        const newCategory = await makeApiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify(categoryData),
        });
        
        set((state) => ({
          categories: [...state.categories, newCategory]
        }));
      } catch (error) {
        set({ error: 'Failed to add category' });
      }
    },

    updateCategory: async (id, categoryData) => {
      try {
        const updatedCategory = await makeApiRequest(`/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryData),
        });
        
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? updatedCategory : category
          ),
        }));
      } catch (error) {
        set({ error: 'Failed to update category' });
      }
    },

    deleteCategory: async (id) => {
      try {
        await makeApiRequest(`/categories/${id}`, {
          method: 'DELETE',
        });
        
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
        }));
      } catch (error) {
        set({ error: 'Failed to delete category' });
      }
    },

    // Warehouse actions
    fetchWarehouses: async () => {
      set({ loading: true, error: null });
      try {
        const warehouses = await makeApiRequest('/warehouses');
        set({ warehouses, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch warehouses', loading: false });
      }
    },

    addWarehouse: async (warehouseData) => {
      try {
        const newWarehouse = await makeApiRequest('/warehouses', {
          method: 'POST',
          body: JSON.stringify(warehouseData),
        });
        
        set((state) => ({
          warehouses: [...state.warehouses, newWarehouse]
        }));
      } catch (error) {
        set({ error: 'Failed to add warehouse' });
      }
    },

    updateWarehouse: async (id, warehouseData) => {
      try {
        const updatedWarehouse = await makeApiRequest(`/warehouses/${id}`, {
          method: 'PUT',
          body: JSON.stringify(warehouseData),
        });
        
        set((state) => ({
          warehouses: state.warehouses.map((warehouse) =>
            warehouse.id === id ? updatedWarehouse : warehouse
          ),
        }));
      } catch (error) {
        set({ error: 'Failed to update warehouse' });
      }
    },

    deleteWarehouse: async (id) => {
      try {
        await makeApiRequest(`/warehouses/${id}`, {
          method: 'DELETE',
        });
        
        set((state) => ({
          warehouses: state.warehouses.filter((warehouse) => warehouse.id !== id),
        }));
      } catch (error) {
        set({ error: 'Failed to delete warehouse' });
      }
    },

    // Stock movement actions
    fetchStockMovements: async () => {
      set({ loading: true, error: null });
      try {
        const stockMovements = await makeApiRequest('/stock-movements');
        set({ stockMovements, loading: false });
      } catch (error) {
        set({ error: 'Failed to fetch stock movements', loading: false });
      }
    },

    addStockMovement: async (movementData) => {
      try {
        const newMovement = await makeApiRequest('/stock-movements', {
          method: 'POST',
          body: JSON.stringify(movementData),
        });
        
        set((state) => ({
          stockMovements: [...state.stockMovements, newMovement]
        }));
        
        // Update product stock quantity in the local state as well
        if (movementData.productId) {
          set((state) => {
            const updatedProducts = state.products.map(p => 
              p.id === movementData.productId 
                ? { ...p, stockQuantity: newMovement.new_stock_quantity || p.stockQuantity } 
                : p
            );
            return { products: updatedProducts };
          });
        }
      } catch (error) {
        set({ error: 'Failed to add stock movement' });
      }
    },

    getStockMovementsByProductId: (productId) => {
      return get().stockMovements.filter(movement => 
        movement.productId === productId
      );
    },
  };
});