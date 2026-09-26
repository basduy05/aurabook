"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItemType {
  bookId: string;
  title: string;
  slug: string;
  author: string;
  coverUrl?: string;
  price: number;
  format: "PHYSICAL" | "EBOOK" | "BOTH";
  quantity: number;
}

export interface UserProfile {
  id?: string;
  email: string;
  fullName: string;
  role: string;
}

interface CartContextValue {
  items: CartItemType[];
  addToCart: (item: Omit<CartItemType, "quantity">, quantity?: number) => void;
  removeFromCart: (bookId: string, format: string) => void;
  updateQuantity: (bookId: string, format: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  totalItems: number;
  voucherCode: string | null;
  voucherDiscountPercent: number;
  applyVoucher: (code: string) => boolean;
  removeVoucher: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  user: UserProfile | null;
  loginUser: (token: string, profile: UserProfile) => void;
  logoutUser: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [voucherDiscountPercent, setVoucherDiscountPercent] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedCart = localStorage.getItem("aurabook_cart");
        if (storedCart) {
          setItems(JSON.parse(storedCart));
        }
        const storedUser = localStorage.getItem("aurabook_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        const storedVoucher = localStorage.getItem("aurabook_voucher");
        if (storedVoucher) {
          const v = JSON.parse(storedVoucher);
          setVoucherCode(v.code);
          setVoucherDiscountPercent(v.percent);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }, []);

  // Save items to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aurabook_cart", JSON.stringify(items));
    }
  }, [items]);

  const addToCart = (item: Omit<CartItemType, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.bookId === item.bookId && i.format === item.format
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += quantity;
        return updated;
      }
      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (bookId: string, format: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.bookId === bookId && i.format === format))
    );
  };

  const updateQuantity = (bookId: string, format: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId, format);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.bookId === bookId && i.format === format ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setVoucherCode(null);
    setVoucherDiscountPercent(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("aurabook_cart");
      localStorage.removeItem("aurabook_voucher");
    }
  };

  const applyVoucher = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === "AURA2026") {
      setVoucherCode("AURA2026");
      setVoucherDiscountPercent(15);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "aurabook_voucher",
          JSON.stringify({ code: "AURA2026", percent: 15 })
        );
      }
      return true;
    }
    return false;
  };

  const removeVoucher = () => {
    setVoucherCode(null);
    setVoucherDiscountPercent(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("aurabook_voucher");
    }
  };

  const loginUser = (token: string, profile: UserProfile) => {
    setUser(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem("aurabook_access_token", token);
      localStorage.setItem("aurabook_user", JSON.stringify(profile));
    }
  };

  const logoutUser = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("aurabook_access_token");
      localStorage.removeItem("aurabook_user");
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * voucherDiscountPercent) / 100);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        discountAmount,
        totalAmount,
        totalItems,
        voucherCode,
        voucherDiscountPercent,
        applyVoucher,
        removeVoucher,
        isCartOpen,
        setIsCartOpen,
        user,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
