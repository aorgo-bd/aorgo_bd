"use client";

import React, { useState, useMemo } from "react";
import { useAdminSellers } from "@/lib/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Store, StoreStatus } from "@/lib/types";
import toast from "react-hot-toast";
import { Search, ShieldAlert, CheckCircle2, AlertOctagon, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cloudinaryDocumentUrl } from "@/lib/cloudinary";
import { getFreshIdToken } from "@/lib/firebase/client-token";

export default function AdminSellersPage() {
  const { data: sellers = [], isLoading, refetch } = useAdminSellers();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter sellers based on search term
  const searchedSellers = useMemo(() => {
    return sellers.filter((s: Store) => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = s.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const contactMatch = s.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.contact?.phone?.includes(searchTerm);
      return nameMatch || descMatch || contactMatch;
    });
  }, [sellers, searchTerm]);

  // Group sellers by status
  const pendingSellers = useMemo(() => searchedSellers.filter((s: Store) => s.status === "pending"), [searchedSellers]);
  const approvedSellers = useMemo(() => searchedSellers.filter((s: Store) => s.status === "approved"), [searchedSellers]);
  const suspendedSellers = useMemo(() => searchedSellers.filter((s: Store) => s.status === "suspended"), [searchedSellers]);

  const handleUpdateStatus = async (storeId: string, newStatus: StoreStatus) => {
    setActionLoading(storeId);
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/sellers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ storeId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Store status updated to ${newStatus} successfully!`);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const renderSellersTable = (storesList: Store[], targetStatus: StoreStatus) => {
    if (storesList.length === 0) {
      return (
        <div className="text-center py-16 text-slate-400">
          <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-350 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No stores found</p>
          <p className="text-xs text-slate-400">No sellers currently in this queue status.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead className="font-bold text-xs py-4">Store details</TableHead>
              <TableHead className="font-bold text-xs">Contact</TableHead>
              <TableHead className="font-bold text-xs">Verification docs</TableHead>
              <TableHead className="font-bold text-xs">Bank details</TableHead>
              <TableHead className="font-bold text-xs">Commission</TableHead>
              <TableHead className="font-bold text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-150 dark:divide-slate-800">
            {storesList.map((store) => (
              <TableRow key={store.id} className="hover:bg-slate-50/30 transition-colors">
                <TableCell className="py-4 align-top">
                  <div className="max-w-[200px] space-y-1">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">{store.name}</p>
                    <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">
                      Slug: {store.slug}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{store.description}</p>
                  </div>
                </TableCell>
                <TableCell className="align-top text-xs space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{store.contact.email}</p>
                  <p className="text-slate-500">{store.contact.phone}</p>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Registered: {new Date(store.createdAt).toLocaleDateString()}
                  </p>
                </TableCell>
                <TableCell className="align-top text-xs space-y-2">
                  {store.tradeLicenseUrl ? (
                    <a
                      href={cloudinaryDocumentUrl(store.tradeLicenseUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-violet-600 hover:text-violet-700 hover:underline"
                    >
                      Trade License <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">No Trade License</span>
                  )}
                  <br />
                  {store.nidUrl ? (
                    <a
                      href={cloudinaryDocumentUrl(store.nidUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-violet-600 hover:text-violet-700 hover:underline"
                    >
                      NID Document <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">No NID doc</span>
                  )}
                </TableCell>
                <TableCell className="align-top text-xs space-y-1 max-w-[180px]">
                  {store.bankDetails ? (
                    <>
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        {store.bankDetails.accountName}
                      </p>
                      <p className="text-slate-500">
                        No: {store.bankDetails.accountNumber}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {store.bankDetails.bankName} ({store.bankDetails.branchName})
                      </p>
                      {store.bankDetails.routingNumber && (
                        <p className="text-[10px] text-slate-400">
                          Routing: {store.bankDetails.routingNumber}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400">No bank details</span>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="outline" className="font-semibold text-xs border-slate-200 text-slate-600">
                    {(store.commissionRate * 100).toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell className="align-top text-right">
                  <div className="flex justify-end gap-2">
                    {targetStatus === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          disabled={actionLoading === store.id}
                          onClick={() => handleUpdateStatus(store.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs font-semibold"
                          disabled={actionLoading === store.id}
                          onClick={() => handleUpdateStatus(store.id, "suspended")}
                        >
                          Suspend
                        </Button>
                      </>
                    )}
                    {targetStatus === "approved" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs font-semibold"
                        disabled={actionLoading === store.id}
                        onClick={() => handleUpdateStatus(store.id, "suspended")}
                      >
                        Suspend
                      </Button>
                    )}
                    {targetStatus === "suspended" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                        disabled={actionLoading === store.id}
                        onClick={() => handleUpdateStatus(store.id, "approved")}
                      >
                        Re-Approve
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Seller Verifications
          </h1>
          <p className="text-sm text-slate-500">
            Review store applications, trade licenses, routing codes, and approve marketplace partners.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md bg-white/60 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search stores, contact emails, phone numbers..."
          className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-colors"
        />
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading seller partners...</p>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-slate-100 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg font-bold text-xs flex items-center gap-1.5">
              <AlertOctagon className="h-3.5 w-3.5" />
              Pending Verification
              <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700 text-[10px] font-black">
                {pendingSellers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved Stores
              <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700 text-[10px] font-black">
                {approvedSellers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="suspended" className="rounded-lg font-bold text-xs flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              Suspended
              <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700 text-[10px] font-black">
                {suspendedSellers.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {renderSellersTable(pendingSellers, "pending")}
          </TabsContent>
          
          <TabsContent value="approved">
            {renderSellersTable(approvedSellers, "approved")}
          </TabsContent>

          <TabsContent value="suspended">
            {renderSellersTable(suspendedSellers, "suspended")}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
