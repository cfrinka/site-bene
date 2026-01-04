"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  cover?: string;
  quantity: number;
  size?: string;
  color?: string;
  variantKey?: string; // Unique key for size+color combination
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: { id: string; title?: string; price?: number; cover?: string; size?: string; color?: string }) => void;
  removeItem: (variantKey: string) => void;
  updateQuantity: (variantKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bene-cart");
        if (saved) {
          const parsedItems = JSON.parse(saved);
          // Ensure all items have variantKey
          const itemsWithKeys = parsedItems.map((item: CartItem) => ({
            ...item,
            variantKey: item.variantKey || `${item.id}-${item.size || 'default'}-${item.color || 'default'}`
          }));
          setItems(itemsWithKeys);
        }
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("bene-cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product: { id: string; title?: string; price?: number; cover?: string; size?: string; color?: string }) => {
    setItems((prev) => {
      // Create unique key for this variant
      const variantKey = `${product.id}-${product.size || 'default'}-${product.color || 'default'}`;

      const existing = prev.find((item) => item.variantKey === variantKey);
      if (existing) {
        return prev.map((item) =>
          item.variantKey === variantKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title || "Produto",
          price: product.price || 0,
          cover: product.cover,
          quantity: 1,
          size: product.size,
          color: product.color,
          variantKey,
        },
      ];
    });
  };

  const removeItem = (variantKey: string) => {
    setItems((prev) => prev.filter((item) => {
      // Handle both variantKey and legacy id-based removal
      const itemKey = item.variantKey || `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;
      return itemKey !== variantKey;
    }));
  };

  const updateQuantity = (variantKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantKey);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        // Handle both variantKey and legacy id-based update
        const itemKey = item.variantKey || `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;
        return itemKey === variantKey ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("bene-cart");
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
