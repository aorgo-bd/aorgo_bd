import { useQuery } from "@tanstack/react-query";
import { getFreshIdToken } from "@/lib/firebase/client-token";
import { Order, Product, Store, User, Banner, AuditLog } from "@/lib/types";

const ADMIN_STALE_TIME = 60_000;

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
      // Server read (Admin SDK). A direct client query fails whenever the
      // ambient SDK token lacks a fresh `role: admin` claim. See useAdminBanners.
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load orders");
      }
      const data = await res.json();
      return (data.orders || []) as Order[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Server read (Admin SDK) so the entire user directory is returned. A
      // direct client Firestore query is gated by the isAdmin() rule and returns
      // an empty list when the ambient token's `role: admin` claim is stale —
      // this was the root cause of "admin dashboard shows no users". See
      // useAdminBanners for the shared rationale.
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load users");
      }
      const data = await res.json();
      return (data.users || []) as User[];
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
      // Server read (Admin SDK) — audit_logs is admin-read-only, so a direct
      // client query depends on a fresh `role: admin` claim. See useAdminBanners.
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load audit logs");
      }
      const data = await res.json();
      return (data.auditLogs || []) as AuditLog[];
    },
    staleTime: ADMIN_STALE_TIME,
  });
}