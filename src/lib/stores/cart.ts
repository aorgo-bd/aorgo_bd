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

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantSku: string) => void;
  updateQty: (variantSku: string, qty: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.variantSku === newItem.variantSku
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.variantSku === newItem.variantSku
                  ? { ...item, qty: item.qty + newItem.qty }
                  : item
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),
      removeItem: (variantSku) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantSku !== variantSku),
        })),
      updateQty: (variantSku, qty) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantSku === variantSku
              ? { ...item, qty: Math.max(1, qty) }
              : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      getCartSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.qty, 0);
      },
    }),
    {
      name: "aorgo-cart-store",
    }
  )
);
