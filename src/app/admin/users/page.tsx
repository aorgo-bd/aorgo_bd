"use client";

import React, { useState, useMemo } from "react";
import { useAdminUsers } from "@/lib/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, ShieldAlert, Award, Power, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";

export default function AdminUsersPage() {
  const { data: users = [], isLoading, refetch } = useAdminUsers();
  const { user: currentUser } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u: User) => {
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesSearch =
          u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone?.includes(searchTerm);
        return matchesRole && matchesSearch;
      })
      .sort((a: User, b: User) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [users, searchTerm, roleFilter]);

  const handleUserAction = async (targetUid: string, action: "promote_admin" | "toggle_suspend") => {
    if (targetUid === currentUser?.uid) {
      toast.error("You cannot perform operations on your own profile.");
      return;
    }

    if (action === "promote_admin" && !confirm("Are you sure you want to promote this user to Admin? This grants full control over the marketplace.")) {
      return;
    }

    setActionLoading(targetUid);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUid, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      toast.success(data.message || "Action executed successfully!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            User Directory
          </h1>
          <p className="text-sm text-slate-500">
            Manage system security, authenticate access roles, and trace accounts registered across AORGO.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex h-9 items-center justify-center gap-1.5 border border-gray-200 hover:border-black rounded-lg px-4 text-xs font-bold transition-all bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 rounded-2xl backdrop-blur-md">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name, email, phone number..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-48 h-10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="seller">Sellers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading directory profiles...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-bold text-xs py-4">Name</TableHead>
                <TableHead className="font-bold text-xs">Email</TableHead>
                <TableHead className="font-bold text-xs">Phone</TableHead>
                <TableHead className="font-bold text-xs">Role</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="font-bold text-xs">Joined Date</TableHead>
                <TableHead className="font-bold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-150 dark:divide-slate-800">
              {filteredUsers.map((u: User) => {
                const isMe = u.uid === currentUser?.uid;
                const isSuspended = (u as any).suspended;
                return (
                  <TableRow key={u.uid} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="py-4 font-bold text-slate-800 dark:text-slate-100">
                      {u.displayName || "Marketplace User"} {isMe && <span className="text-xs text-gray-400 font-normal">(You)</span>}
                    </TableCell>
                    <TableCell className="py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {u.email}
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">
                      {u.phone || "Not provided"}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                          u.role === "admin"
                            ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 dark:bg-fuchsia-950/20"
                            : u.role === "seller"
                            ? "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20"
                            : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20"
                        }`}
                        variant="secondary"
                      >
                        {u.role || "customer"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                          isSuspended
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}
                        variant="secondary"
                      >
                        {isSuspended ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-450">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Unknown"}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleUserAction(u.uid, "promote_admin")}
                            disabled={actionLoading !== null}
                            className="inline-flex h-8 items-center gap-1 border border-gray-250 hover:bg-slate-50 rounded-lg px-2.5 text-[10px] font-bold text-gray-700 transition-colors disabled:opacity-50"
                            title="Promote to Administrator"
                          >
                            <Award className="h-3.5 w-3.5 text-gray-500" />
                            <span>Make Admin</span>
                          </button>
                        )}
                        {!isMe && (
                          <button
                            onClick={() => handleUserAction(u.uid, "toggle_suspend")}
                            disabled={actionLoading !== null}
                            className={`inline-flex h-8 items-center gap-1 border rounded-lg px-2.5 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                              isSuspended
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                : "border-red-200 text-red-750 hover:bg-red-50"
                            }`}
                            title={isSuspended ? "Restore access" : "Suspend access"}
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span>{isSuspended ? "Activate" : "Suspend"}</span>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-2 text-slate-350 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-350">No users found</p>
          <p className="text-xs text-slate-400">Try modifying search tags or selecting standard roles.</p>
        </div>
      )}
    </div>
  );
}
