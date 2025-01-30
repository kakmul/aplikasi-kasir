import React, { createContext, useContext, useState } from 'react';
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  subtotal: number;
  tax: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const TAX_RATE = 0.08;

  const addItem = (product: Product, quantity: number) => {
    if (product.stock_quantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Check if adding quantity would exceed stock
        if (existingItem.quantity + quantity > product.stock_quantity) {
          toast.error(`Cannot add more. Only ${product.stock_quantity} available in stock`);
          return currentItems;
        }
        
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Check if initial quantity would exceed stock
      if (quantity > product.stock_quantity) {
        toast.error(`Cannot add ${quantity} items. Only ${product.stock_quantity} available in stock`);
        return currentItems;
      }

      return [...currentItems, { product, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    setItems(currentItems => {
      const item = currentItems.find(item => item.product.id === productId);
      if (!item) return currentItems;

      // Check if new quantity would exceed stock
      if (quantity > item.product.stock_quantity) {
        toast.error(`Cannot set quantity to ${quantity}. Only ${item.product.stock_quantity} available in stock`);
        return currentItems;
      }

      return currentItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      subtotal,
      tax
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}