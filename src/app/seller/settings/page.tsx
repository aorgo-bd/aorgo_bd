"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Store, Landmark, ShieldCheck } from "lucide-react";

export default function SellerSettingsPage() {
  const { user } = useUser();
  const qc = useQueryClient();
  const storeId = user?.storeId;

  // Form states
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [logoPublicId, setLogoPublicId] = useState("");
  const [bannerPublicId, setBannerPublicId] = useState("");

  const [bankAccName, setBankAccName] = useState("");
  const [bankAccNumber, setBankAccNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankRouting, setBankRouting] = useState("");

  const { data: store, isLoading } = useQuery({
    queryKey: ["store-settings", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const snap = await getDoc(doc(db, "stores", storeId!));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
  });

  // Populate state when store query returns
  useEffect(() => {
    if (store) {
      setStoreName(store.name || "");
      setStoreDesc(store.description || "");
      setLogoPublicId(store.logoPublicId || "");
      setBannerPublicId(store.bannerPublicId || "");
      
      if (store.bankDetails) {
        setBankAccName(store.bankDetails.accountName || "");
        setBankAccNumber(store.bankDetails.accountNumber || "");
        setBankName(store.bankDetails.bankName || "");
        setBankBranch(store.bankDetails.branchName || "");
        setBankRouting(store.bankDetails.routingNumber || "");
      }
    }
  }, [store]);

  const saveMutation = useMutation({
    mutationFn: async (patch: any) => {
      if (!storeId) throw new Error("Store ID not found");
      await updateDoc(doc(db, "stores", storeId), {
        ...patch,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Store settings updated successfully!");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to save settings");
    },
  });

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name: storeName,
      description: storeDesc,
      logoPublicId,
      bannerPublicId,
    });
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      bankDetails: {
        accountName: bankAccName,
        accountNumber: bankAccNumber,
        bankName,
        branchName: bankBranch,
        routingNumber: bankRouting,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Loading settings...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-16">
        <p className="font-semibold text-red-600">Store configuration could not be resolved.</p>
        <p className="text-xs text-gray-400 mt-1">Make sure you are a fully registered and approved seller.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Store Settings</h1>
        <p className="text-sm text-slate-500">Configure your public store details, logo, banners, and billing payouts.</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-100 rounded-xl p-1 mb-6">
          <TabsTrigger value="details" className="rounded-lg text-xs font-bold uppercase tracking-wider">
            Details
          </TabsTrigger>
          <TabsTrigger value="bank" className="rounded-lg text-xs font-bold uppercase tracking-wider">
            Landmark Payouts
          </TabsTrigger>
          <TabsTrigger value="verification" className="rounded-lg text-xs font-bold uppercase tracking-wider">
            Verification
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Details */}
        <TabsContent value="details">
          <form onSubmit={handleSaveDetails}>
            <Card className="border border-slate-150 rounded-2xl shadow-3xs">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Store className="h-5 w-5 text-indigo-500" />
                  <span>Public Store Profile</span>
                </CardTitle>
                <CardDescription>Update name, description, and visual identifiers shown to customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Store Name</label>
                    <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Store Slug (Read-only)</label>
                    <Input value={store.slug} disabled className="bg-slate-50 border-slate-100 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Store Description</label>
                  <Textarea
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    placeholder="Tell customers about your brand, materials, and fashion values..."
                    className="min-h-[120px] rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Cloudinary Logo Public ID</label>
                    <Input value={logoPublicId} onChange={(e) => setLogoPublicId(e.target.value)} placeholder="e.g. aorgo/stores/logos/my-store-logo" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Cloudinary Banner Public ID</label>
                    <Input value={bannerPublicId} onChange={(e) => setBannerPublicId(e.target.value)} placeholder="e.g. aorgo/stores/banners/my-store-banner" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={saveMutation.isPending} className="bg-black hover:bg-black/90 font-bold uppercase tracking-wider text-xs rounded-xl px-5 h-10">
                    {saveMutation.isPending ? "Saving..." : "Save Store Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 2: Bank details */}
        <TabsContent value="bank">
          <form onSubmit={handleSaveBank}>
            <Card className="border border-slate-150 rounded-2xl shadow-3xs">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-indigo-500" />
                  <span>Payout Bank Account Details</span>
                </CardTitle>
                <CardDescription>Add bank routing to collect weekly payouts for orders fulfilled.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Account Name</label>
                    <Input value={bankAccName} onChange={(e) => setBankAccName(e.target.value)} required placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Account Number</label>
                    <Input value={bankAccNumber} onChange={(e) => setBankAccNumber(e.target.value)} required placeholder="e.g. 12210034455" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bank Name</label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} required placeholder="e.g. Dutch Bangla Bank" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Branch Name</label>
                    <Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} required placeholder="e.g. Mirpur Branch" />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Routing Number (Optional)</label>
                    <Input value={bankRouting} onChange={(e) => setBankRouting(e.target.value)} placeholder="e.g. 090273155" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={saveMutation.isPending} className="bg-black hover:bg-black/90 font-bold uppercase tracking-wider text-xs rounded-xl px-5 h-10">
                    {saveMutation.isPending ? "Saving..." : "Save Bank Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 3: Verification */}
        <TabsContent value="verification">
          <Card className="border border-slate-150 rounded-2xl shadow-3xs">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                <span>Verification Credentials</span>
              </CardTitle>
              <CardDescription>Submitted documents for store authorization. Admin-only editable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trade License document</p>
                  {store.tradeLicenseUrl ? (
                    <a href={store.tradeLicenseUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 underline hover:text-indigo-700 block truncate">
                      View submitted document
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold">No license document attached.</span>
                  )}
                </div>

                <div className="space-y-2 border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">National ID Card (NID)</p>
                  {store.nidUrl ? (
                    <a href={store.nidUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 underline hover:text-indigo-700 block truncate">
                      View submitted NID document
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold">No NID attached.</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3 mt-6">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Verification Status</p>
                  <p className="text-xs text-indigo-800 mt-0.5 capitalize">
                    Store is currently: <strong>{store.status}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
