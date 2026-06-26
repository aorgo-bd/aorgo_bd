"use client";

import React, { useState, useMemo } from "react";
import { useAdminProducts, useAdminSellers } from "@/lib/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, ProductStatus, Store } from "@/lib/types";
import { toast } from "sonner";
import { Search, ShieldAlert, CheckCircle2, AlertOctagon, Ban, Archive, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/ProductImage";
import { getFreshIdToken } from "@/lib/firebase/client-token";

export default function AdminProductsPage() {
  const { data: products = [], isLoading: loadingProducts, refetch } = useAdminProducts();
  const { data: sellers = [], isLoading: loadingSellers } = useAdminSellers();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection Dialog State
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const isLoading = loadingProducts || loadingSellers;

  // Create store lookup map
  const storeMap = useMemo(() => {
    const map: { [id: string]: string } = {};
    sellers.forEach((store: Store) => {
      map[store.id] = store.name;
    });
    return map;
  }, [sellers]);

  // Filter products based on search term
  const searchedProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const titleMatch = p.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const brandMatch = p.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = p.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const storeMatch = storeMap[p.storeId]?.toLowerCase().includes(searchTerm.toLowerCase());
      return titleMatch || brandMatch || descMatch || categoryMatch || storeMatch;
    });
  }, [products, searchTerm, storeMap]);

  // Group products by status
  const pendingProducts = useMemo(() => searchedProducts.filter((p: Product) => p.status === "pending"), [searchedProducts]);
  const approvedProducts = useMemo(() => searchedProducts.filter((p: Product) => p.status === "approved"), [searchedProducts]);
  const rejectedProducts = useMemo(() => searchedProducts.filter((p: Product) => p.status === "rejected"), [searchedProducts]);
  const archivedProducts = useMemo(() => searchedProducts.filter((p: Product) => p.status === "archived"), [searchedProducts]);

  const handleUpdateStatus = async (productId: string, newStatus: ProductStatus, reason?: string) => {
    setActionLoading(productId);
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          productId,
          status: newStatus,
          ...(reason ? { rejectionReason: reason } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Product status updated to ${newStatus} successfully!`);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectingProduct) return;
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    handleUpdateStatus(rejectingProduct.id, "rejected", rejectionReason);
    setRejectingProduct(null);
    setRejectionReason("");
  };

  const renderProductsTable = (productsList: Product[], targetStatus: ProductStatus) => {
    if (productsList.length === 0) {
      return (
        <div className="text-center py-16 text-slate-400">
          <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-350 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No products found</p>
          <p className="text-xs text-slate-400">No items currently in this status queue.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead className="font-bold text-xs py-4">Image</TableHead>
              <TableHead className="font-bold text-xs">Product details</TableHead>
              <TableHead className="font-bold text-xs">Store / Partner</TableHead>
              <TableHead className="font-bold text-xs">Price</TableHead>
              <TableHead className="font-bold text-xs">Stock</TableHead>
              {targetStatus === "rejected" && <TableHead className="font-bold text-xs">Rejection reason</TableHead>}
              <TableHead className="font-bold text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-150 dark:divide-slate-800">
            {productsList.map((product) => {
              const totalStock = product.variants?.reduce((sum: number, v) => sum + (v.stock || 0), 0) || 0;
              const mainImage = product.images?.[0];

              return (
                <TableRow key={product.id} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4">
                    {mainImage ? (
                      <div className="h-12 w-10 overflow-hidden rounded border border-slate-200 dark:border-slate-800 bg-slate-100">
                        <ProductImage
                          src={mainImage}
                          alt={product.title}
                          width={50}
                          height={60}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-10 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-[10px] text-slate-400">
                        No Img
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <div className="max-w-[220px] space-y-0.5">
                      <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{product.title}</p>
                      <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">
                        {product.brand} • {product.gender}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {product.category?.replace(/-/g, " ")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {storeMap[product.storeId] || "Loading Store..."}
                  </TableCell>
                  <TableCell className="align-top py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                    ৳{product.price.toLocaleString()}
                  </TableCell>
                  <TableCell className="align-top py-4 text-xs">
                    <span
                      className={
                        totalStock === 0
                          ? "text-red-500 font-bold"
                          : totalStock < 10
                          ? "text-amber-500 font-bold"
                          : "text-slate-600 dark:text-slate-400 font-medium"
                      }
                    >
                      {totalStock} pcs
                    </span>
                  </TableCell>
                  {targetStatus === "rejected" && (
                    <TableCell className="align-top py-4 text-xs text-red-650 max-w-[200px]">
                      <p className="font-medium italic leading-relaxed">
                        {product.rejectionReason || "No details provided."}
                      </p>
                    </TableCell>
                  )}
                  <TableCell className="align-top py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {targetStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                            disabled={actionLoading === product.id}
                            onClick={() => handleUpdateStatus(product.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs font-semibold"
                            disabled={actionLoading === product.id}
                            onClick={() => setRejectingProduct(product)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {targetStatus === "approved" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold border-slate-200"
                            disabled={actionLoading === product.id}
                            onClick={() => handleUpdateStatus(product.id, "archived")}
                          >
                            Archive
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs font-semibold"
                            disabled={actionLoading === product.id}
                            onClick={() => setRejectingProduct(product)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {(targetStatus === "rejected" || targetStatus === "archived") && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          disabled={actionLoading === product.id}
                          onClick={() => handleUpdateStatus(product.id, "approved")}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
            Product Approvals
          </h1>
          <p className="text-sm text-slate-500">
            Verify product details, brand mappings, prices, and manage approved listings.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md bg-white/60 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name, brand, store..."
          className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-colors"
        />
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading catalog items...</p>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-slate-100 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg font-bold text-xs flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" />
              Pending
              <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700 text-[10px] font-black">
                {pendingProducts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
              <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700 text-[10px] font-black">
                {approvedProducts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg font-bold text-xs flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5" />
              Rejected
              <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700 text-[10px] font-black">
                {rejectedProducts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-lg font-bold text-xs flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              Archived
              <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700 text-[10px] font-black">
                {archivedProducts.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {renderProductsTable(pendingProducts, "pending")}
          </TabsContent>
          
          <TabsContent value="approved">
            {renderProductsTable(approvedProducts, "approved")}
          </TabsContent>

          <TabsContent value="rejected">
            {renderProductsTable(rejectedProducts, "rejected")}
          </TabsContent>

          <TabsContent value="archived">
            {renderProductsTable(archivedProducts, "archived")}
          </TabsContent>
        </Tabs>
      )}

      {/* Rejection Modal Dialog */}
      <Dialog open={!!rejectingProduct} onOpenChange={(open) => !open && setRejectingProduct(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Reject Product Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Please provide a detailed reason explaining why &ldquo;{rejectingProduct?.title}&rdquo; is being rejected. This reason will be shared with the seller.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Inappropriate images, trade license mismatches, or pricing anomalies."
              className="w-full h-24 p-3 border border-slate-200 dark:border-slate-850 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs font-semibold border-slate-200"
              onClick={() => setRejectingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectSubmit}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
