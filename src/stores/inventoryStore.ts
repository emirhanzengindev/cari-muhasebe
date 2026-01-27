import { create } from 'zustand';
import { Product, Category, Warehouse, StockMovement } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';
import { getBrowserClient } from '@/lib/supabase';

// Helper function to get tenant ID
const getTenantId = () => {
  const tenantId = useTenantStore.getState().tenantId;
  console.log('DEBUG: Raw tenantId from store:', tenantId);
  return tenantId;
};

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = getTenantId();
  
  console.log('DEBUG: makeApiRequest called for endpoint:', endpoint);
  console.log('DEBUG: Retrieved tenantId:', tenantId);
  
  if (!tenantId) {
    console.warn('WARNING: Tenant ID not available, skipping request for endpoint:', endpoint);
    return null;
  }
  
  // Get Supabase session token
  const supabase = getBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
    
  // Conditionally add Content-Type header only for requests that have a body
  const headers: any = {
    ...options.headers,
  };
  
  // Add Authorization header if session exists
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
    
  console.log('DEBUG: Headers being sent:', headers);
  
  // Add Content-Type for methods that typically have a body
  const method = options.method?.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || (method === undefined && options.body !== undefined)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  console.log('DEBUG: API response status:', response.status);
  
  if (!response.ok) {
    console.error('ERROR: API request failed with status:', response.status);
    const errorText = await response.text();
    console.error('ERROR: API response text:', errorText);
    
    // Check if it's an auth session error
    if (response.status === 401 && errorText.includes('Auth session missing')) {
      console.error('AUTH SESSION ERROR: Session expired or missing. Letting middleware handle auth...');
      // Let middleware handle auth redirects
      return;
    }
    
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
        if (products !== null) {
          // Transform snake_case fields to camelCase to match Product interface
          const transformedProducts = products.map((product: any) => ({
            ...product,
            buyPrice: product.buy_price,
            sellPrice: product.sell_price,
            vatRate: product.vat_rate,
            stockQuantity: product.stock_quantity,
            criticalLevel: product.critical_level,
            minStockLevel: product.min_stock_level,
            categoryId: product.category_id,
            warehouseId: product.warehouse_id,
          }));
          set({ products: transformedProducts, loading: false });
        } else {
          // API call failed, keep products as empty array
          set({ products: [], loading: false });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch products', loading: false, products: [] });
      }
    },

    addProduct: async (productData) => {
      try {
        const newProduct = await makeApiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(productData),
        });
        
        if (newProduct !== null) {
          // Transform snake_case fields to camelCase to match Product interface
          const transformedProduct = {
            ...newProduct,
            buyPrice: newProduct.buy_price,
            sellPrice: newProduct.sell_price,
            vatRate: newProduct.vat_rate,
            stockQuantity: newProduct.stock_quantity,
            criticalLevel: newProduct.critical_level,
            minStockLevel: newProduct.min_stock_level,
            categoryId: newProduct.category_id,
            warehouseId: newProduct.warehouse_id,
          };
          
          set((state) => ({
            products: [...state.products, transformedProduct]
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to add product' });
      }
    },

    updateProduct: async (id, productData) => {
      try {
        const updatedProduct = await makeApiRequest(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(productData),
        });
        
        if (updatedProduct !== null) {
          // Transform snake_case fields to camelCase to match Product interface
          const transformedProduct = {
            ...updatedProduct,
            buyPrice: updatedProduct.buy_price,
            sellPrice: updatedProduct.sell_price,
            vatRate: updatedProduct.vat_rate,
            stockQuantity: updatedProduct.stock_quantity,
            criticalLevel: updatedProduct.critical_level,
            minStockLevel: updatedProduct.min_stock_level,
            categoryId: updatedProduct.category_id,
            warehouseId: updatedProduct.warehouse_id,
          };
          
          set((state) => ({
            products: state.products.map((product) =>
              product.id === id ? transformedProduct : product
            ),
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to update product' });
      }
    },

    deleteProduct: async (id) => {
      try {
        const result = await makeApiRequest(`/products/${id}`, {
          method: 'DELETE',
        });
        
        if (result !== null) {
          set((state) => ({
            products: state.products.filter((product) => product.id !== id),
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to delete product' });
      }
    },

    // Category actions
    fetchCategories: async () => {
      set({ loading: true, error: null });
      try {
        const categories = await makeApiRequest('/categories');
        if (categories !== null) {
          set({ categories, loading: false });
        } else {
          set({ loading: false });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch categories', loading: false });
      }
    },

    addCategory: async (categoryData) => {
      try {
        const newCategory = await makeApiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify(categoryData),
        });
        
        if (newCategory !== null) {
          set((state) => ({
            categories: [...state.categories, newCategory]
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to add category' });
      }
    },

    updateCategory: async (id, categoryData) => {
      try {
        const updatedCategory = await makeApiRequest(`/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryData),
        });
        
        if (updatedCategory !== null) {
          set((state) => ({
            categories: state.categories.map((category) =>
              category.id === id ? updatedCategory : category
            ),
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to update category' });
      }
    },

    deleteCategory: async (id) => {
      try {
        const result = await makeApiRequest(`/categories/${id}`, {
          method: 'DELETE',
        });
        
        if (result !== null) {
          set((state) => ({
            categories: state.categories.filter((category) => category.id !== id),
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to delete category' });
      }
    },

    // Warehouse actions
    fetchWarehouses: async () => {
      set({ loading: true, error: null });
      try {
        const warehouses = await makeApiRequest('/warehouses');
        if (warehouses !== null) {
          set({ warehouses, loading: false });
        } else {
          set({ loading: false });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch warehouses', loading: false });
      }
    },

    addWarehouse: async (warehouseData) => {
      try {
        const newWarehouse = await makeApiRequest('/warehouses', {
          method: 'POST',
          body: JSON.stringify(warehouseData),
        });
        
        if (newWarehouse !== null) {
          set((state) => ({
            warehouses: [...state.warehouses, newWarehouse]
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to add warehouse' });
      }
    },

    updateWarehouse: async (id, warehouseData) => {
      try {
        const updatedWarehouse = await makeApiRequest(`/warehouses/${id}`, {
          method: 'PUT',
          body: JSON.stringify(warehouseData),
        });
        
        if (updatedWarehouse !== null) {
          set((state) => ({
            warehouses: state.warehouses.map((warehouse) =>
              warehouse.id === id ? updatedWarehouse : warehouse
            ),
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to update warehouse' });
      }
    },

    deleteWarehouse: async (id) => {
      try {
        const result = await makeApiRequest(`/warehouses/${id}`, {
          method: 'DELETE',
        });
        
        if (result !== null) {
          set((state) => ({
            warehouses: state.warehouses.filter((warehouse) => warehouse.id !== id),
          }));
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to delete warehouse' });
      }
    },

    // Stock movement actions
    fetchStockMovements: async () => {
      set({ loading: true, error: null });
      try {
        const stockMovements = await makeApiRequest('/stock-movements');
        if (stockMovements !== null) {
          set({ stockMovements, loading: false });
        } else {
          set({ loading: false });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch stock movements', loading: false });
      }
    },

    addStockMovement: async (movementData) => {
      try {
        const newMovement = await makeApiRequest('/stock-movements', {
          method: 'POST',
          body: JSON.stringify(movementData),
        });
        
        if (newMovement !== null) {
          set((state) => ({
            stockMovements: [...state.stockMovements, newMovement]
          }));
          
          // Update product stock quantity in the local state as well
          if (movementData.productId) {
            // Fetch updated products to ensure state is current
            get().fetchProducts();
          }
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to add stock movement' });
      }
    },

    getStockMovementsByProductId: (productId) => {
      return get().stockMovements.filter(movement => 
        movement.productId === productId
      );
    },
  };
});
