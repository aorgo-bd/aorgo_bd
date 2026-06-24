import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantSku: string;
  title: string;
  imagePublicId: string;
  size: string;
  color: string;
  qty: number;
  price: number; // integer taka BDT
  brand: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  total: number;
}

interface CartStore {
  items: CartItem[];
  totals: CartTotals;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  add: (item: CartItem) => void;
  remove: (variantSku: string) => void;
  updateQty: (variantSku: string, qty: number) => void;
  clear: () => void;
}

const calculateTotals = (items: CartItem[]): CartTotals => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 0 ? (subtotal > 3000 ? 0 : 100) : 0; // Free shipping over ৳3000
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totals: { subtotal: 0, shipping: 0, total: 0 },
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      add: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.variantSku === newItem.variantSku
          );
          let updatedItems;
          if (existing) {
            updatedItems = state.items.map((item) =>
              item.variantSku === newItem.variantSku
                ? { ...item, qty: item.qty + newItem.qty }
                : item
            );
          } else {
            updatedItems = [...state.items, newItem];
          }
          return {
            items: updatedItems,
            totals: calculateTotals(updatedItems),
          };
        }),
      remove: (variantSku) =>
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => item.variantSku !== variantSku
          );
          return {
            items: updatedItems,
            totals: calculateTotals(updatedItems),
          };
        }),
      updateQty: (variantSku, qty) =>
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.variantSku === variantSku
              ? { ...item, qty: Math.max(1, qty) }
              : item
          );
          return {
            items: updatedItems,
            totals: calculateTotals(updatedItems),
          };
        }),
      clear: () =>
        set({
          items: [],
          totals: { subtotal: 0, shipping: 0, total: 0 },
        }),
    }),
    {
      name: "aorgo-cart-store",
      // Exclude isOpen from local storage persistence
      partialize: (state) => ({
        items: state.items,
        totals: state.totals,
      }),
    }
  )
);
