import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db, auth } from "@/lib/firebase/client";
import { doc, setDoc } from "firebase/firestore";
import { calculateShippingFee } from "@/lib/shipping";

export interface CartItem {
  productId: string;
  storeId?: string;    // used to estimate shipping per store (matches server)
  variantSku: string;
  title: string;
  imagePublicId: string;
  size: string;
  color: string;
  qty: number;
  price: number; // integer taka BDT
  brand: string;
  stock?: number;      // available stock for this variant (client-side qty cap)
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
  setItems: (items: CartItem[]) => void;
}

const calculateTotals = (items: CartItem[]): CartTotals => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  // Client-side estimate. Shipping is charged per store, so we group by storeId
  // and sum each store's fee — mirroring the server's per-store computation in
  // /api/orders. The exact fee can still differ (first-order rule + admin
  // settings are server-authoritative), so this remains an estimate.
  const subtotalByStore: Record<string, number> = {};
  for (const item of items) {
    const key = item.storeId || "__unknown__";
    subtotalByStore[key] = (subtotalByStore[key] || 0) + item.price * item.qty;
  }
  const shipping = Object.values(subtotalByStore).reduce(
    (acc, storeSubtotal) => acc + calculateShippingFee(storeSubtotal),
    0
  );
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
};

async function syncCartToFirestore(items: CartItem[]) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  try {
    const cartRef = doc(db, "carts", currentUser.uid);
    await setDoc(
      cartRef,
      {
        items: items.map((item) => ({
          productId: item.productId,
          storeId: item.storeId ?? null,
          variantSku: item.variantSku,
          title: item.title,
          imagePublicId: item.imagePublicId,
          size: item.size,
          color: item.color,
          qty: item.qty,
          price: item.price,
          brand: item.brand,
          stock: item.stock ?? null,
        })),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error syncing cart to Firestore:", error);
  }
}

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
            updatedItems = state.items.map((item) => {
              if (item.variantSku !== newItem.variantSku) return item;
              // Merge stock knowledge and never exceed available stock.
              const stock = newItem.stock ?? item.stock;
              const merged = item.qty + newItem.qty;
              const qty = typeof stock === "number" ? Math.min(merged, stock) : merged;
              return { ...item, ...newItem, qty };
            });
          } else {
            updatedItems = [...state.items, newItem];
          }
          syncCartToFirestore(updatedItems);
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
          syncCartToFirestore(updatedItems);
          return {
            items: updatedItems,
            totals: calculateTotals(updatedItems),
          };
        }),
      updateQty: (variantSku, qty) =>
        set((state) => {
          const updatedItems = state.items.map((item) => {
            if (item.variantSku !== variantSku) return item;
            let next = Math.max(1, qty);
            if (typeof item.stock === "number") next = Math.min(next, Math.max(1, item.stock));
            return { ...item, qty: next };
          });
          syncCartToFirestore(updatedItems);
          return {
            items: updatedItems,
            totals: calculateTotals(updatedItems),
          };
        }),
      clear: () => {
        syncCartToFirestore([]);
        set({
          items: [],
          totals: { subtotal: 0, shipping: 0, total: 0 },
        });
      },
      setItems: (items) => set({ items, totals: calculateTotals(items) }),
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
