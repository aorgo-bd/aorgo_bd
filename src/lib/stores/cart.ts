import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db, auth } from "@/lib/firebase/client";
import { doc, setDoc } from "firebase/firestore";

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
  setItems: (items: CartItem[]) => void;
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
          variantSku: item.variantSku,
          title: item.title,
          imagePublicId: item.imagePublicId,
          size: item.size,
          color: item.color,
          qty: item.qty,
          price: item.price,
          brand: item.brand,
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
            updatedItems = state.items.map((item) =>
              item.variantSku === newItem.variantSku
                ? { ...item, qty: item.qty + newItem.qty }
                : item
            );
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
          const updatedItems = state.items.map((item) =>
            item.variantSku === variantSku
              ? { ...item, qty: Math.max(1, qty) }
              : item
          );
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
