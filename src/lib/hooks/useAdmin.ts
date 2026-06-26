import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Order, Product, Store, User, Banner, AuditLog } from "@/lib/types";

const ADMIN_STALE_TIME = 60_000;
const ADMIN_LIST_LIMIT = 50;

export function useAdminSellers() {
  return useQuery<Store[]>({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const storesRef = collection(db, "stores");
      const q = query(storesRef, orderBy("createdAt", "desc"), limit(ADMIN_LIST_LIMIT));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Store[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("createdAt", "desc"), limit(ADMIN_LIST_LIMIT));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminOrders() {
  return useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"), limit(ADMIN_LIST_LIMIT));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"), limit(ADMIN_LIST_LIMIT));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminBanners() {
  return useQuery<Banner[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const bannersRef = collection(db, "banners");
      const q = query(bannersRef, orderBy("order", "asc"), limit(ADMIN_LIST_LIMIT));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Banner[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminAuditLogs() {
  return useQuery<AuditLog[]>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const logsRef = collection(db, "audit_logs");
      const q = query(logsRef, orderBy("at", "desc"), limit(ADMIN_LIST_LIMIT));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}