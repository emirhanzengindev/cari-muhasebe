import { create } from 'zustand';
import { Product } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
  totalPrice: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  totalAmount: number;
  
  // Cart actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  discount: 0,
  vatAmount: 0,
  totalAmount: 0,

  addItem: (product, quantity = 1) => {
    const existingItem = get().items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      const updatedItems = get().items.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              totalPrice: (item.quantity + quantity) * (product.sellPrice ?? 0) 
            } 
          : item
      );
      
      set({ items: updatedItems });
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        totalPrice: quantity * (product.sellPrice ?? 0)
      };
      
      set(state => ({ items: [...state.items, newItem] }));
    }
    
    get().calculateTotals();
  },

  removeItem: (productId) => {
    set(state => ({ 
      items: state.items.filter(item => item.product.id !== productId) 
    }));
    
    get().calculateTotals();
  },

  updateItemQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    const updatedItems = get().items.map(item => 
      item.product.id === productId 
        ? { 
            ...item, 
            quantity,
            totalPrice: quantity * (item.product.sellPrice ?? 0) 
          } 
        : item
    );
    
    set({ items: updatedItems });
    get().calculateTotals();
  },

  clearCart: () => {
    set({ 
      items: [],
      subtotal: 0,
      discount: 0,
      vatAmount: 0,
      totalAmount: 0
    });
  },

  calculateTotals: () => {
    const items = get().items;
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = 0; // For simplicity, no discount in quick sales
    const vatAmount = items.reduce((sum, item) => {
      return sum + (item.totalPrice * (item.product.vatRate ?? 0) / 100);
    }, 0);
    const totalAmount = subtotal - discount + vatAmount;
    
    set({ subtotal, discount, vatAmount, totalAmount });
  }
}));