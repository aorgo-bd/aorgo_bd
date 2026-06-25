import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Order, Product, Store, User, Banner, AuditLog } from "@/lib/types";

export function useAdminSellers() {
  return useQuery<Store[]>({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const storesRef = collection(db, "stores");
      const snapshot = await getDocs(storesRef);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Store[];
    },
  });
}

export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
    },
  });
}

export function useAdminOrders() {
  return useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const ordersRef = collection(db, "orders");
      const snapshot = await getDocs(ordersRef);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
    },
  });
}

export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      return snapshot.docs
        .map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as User[];
    },
  });
}

export function useAdminBanners() {
  return useQuery<Banner[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const bannersRef = collection(db, "banners");
      const snapshot = await getDocs(bannersRef);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Banner[];
    },
  });
}

export function useAdminAuditLogs() {
  return useQuery<AuditLog[]>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const logsRef = collection(db, "audit_logs");
      const snapshot = await getDocs(logsRef);
      // Fetch and sort client-side to avoid composite indexing requirements
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AuditLog[];
    },
  });
}
