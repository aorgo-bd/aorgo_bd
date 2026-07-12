import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getFreshIdToken } from "@/lib/firebase/client-token";
import { Order, Product, Store, User, Banner, AuditLog } from "@/lib/types";

const ADMIN_STALE_TIME = 60_000;
const ADMIN_LIST_LIMIT = 50;

export function useAdminSellers() {
  return useQuery<Store[]>({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      // Server read (Admin SDK) so pending/suspended stores are always visible;
      // the client-side rules read is unreliable for admins. See useAdminBanners.
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/sellers", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load stores");
      }
      const data = await res.json();
      return (data.stores || []) as Store[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      // Server read (Admin SDK) so draft/pending/rejected products are always
      // visible in the moderation queue. See useAdminBanners for rationale.
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load products");
      }
      const data = await res.json();
      return (data.products || []) as Product[];
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
      // Read via the admin API (server / Admin SDK) so inactive banners are
      // always visible to admins. A direct client Firestore query is gated by
      // security rules that require a fresh `role: admin` claim on the ambient
      // SDK token, which is unreliable right after promotion — leaving the list
      // silently empty even though the banners exist.
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/banners", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load banners");
      }
      const data = await res.json();
      return (data.banners || []) as Banner[];
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