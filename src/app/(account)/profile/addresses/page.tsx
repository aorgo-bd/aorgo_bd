"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useState } from "react";
import { doc, updateDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import toast from "react-hot-toast";
import { MapPin, Plus, Trash2, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Address } from "@/lib/types";
import { AddressForm } from "@/components/storefront/AddressForm";
import type { AddressFormData } from "@/lib/schemas";

export default function AddressesPage() {
  const { user, refetch } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setIsAdding(false);
    setEditingAddress(null);
  };

  const handleEditInit = (addr: Address) => {
    setEditingAddress(addr);
    setIsAdding(true);
  };

  // Validated (RHF + Zod via <AddressForm>) submit handler for add & edit.
  const handleFormSubmit = async (data: AddressFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const addresses = user.addresses ? [...user.addresses] : [];

      if (editingAddress) {
        const updated = addresses.map((addr) => {
          if (addr.id === editingAddress.id) {
            return { ...addr, ...data, isDefault: data.isDefault || addr.isDefault };
          }
          return data.isDefault ? { ...addr, isDefault: false } : addr;
        });
        if (data.isDefault) {
          const targetIndex = updated.findIndex((a) => a.id === editingAddress.id);
          if (targetIndex !== -1) updated[targetIndex].isDefault = true;
        }
        await updateDoc(doc(db, "users", user.uid), { addresses: updated, updatedAt: Date.now() });
        toast.success("Address updated successfully!");
      } else {
        const newAddressId = doc(collection(db, "temp")).id;
        const newAddress: Address = {
          id: newAddressId,
          ...data,
          isDefault: data.isDefault || addresses.length === 0,
        };
        const updated = data.isDefault
          ? addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddress)
          : addresses.concat(newAddress);
        await updateDoc(doc(db, "users", user.uid), { addresses: updated, updatedAt: Date.now() });
        toast.success("Address added successfully!");
      }

      await refetch();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      let updated = user.addresses.filter((a: Address) => a.id !== id);
      if (updated.length > 0 && !updated.some((a: Address) => a.isDefault)) {
        updated[0].isDefault = true;
      }
      await updateDoc(doc(db, "users", user.uid), { addresses: updated, updatedAt: Date.now() });
      toast.success("Address deleted successfully");
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      const updated = user.addresses.map((a: Address) => ({
        ...a,
        isDefault: a.id === id,
      }));
      await updateDoc(doc(db, "users", user.uid), { addresses: updated, updatedAt: Date.now() });
      toast.success("Default address updated");
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to set default address");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <Link href="/profile" className="text-gray-400 hover:text-black lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-black">Delivery Addresses</h1>
            <p className="text-xs text-gray-500 font-medium">Manage your delivery and billing locations</p>
          </div>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 bg-black hover:bg-black/90 text-white rounded-lg px-4 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Add Address</span>
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="max-w-xl space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            {editingAddress ? "Edit Address Details" : "New Address Details"}
          </h3>
          <AddressForm
            onSubmit={handleFormSubmit}
            isSubmitting={loading}
            onCancel={resetForm}
            submitLabel={editingAddress ? "Update Address" : "Save Address"}
            defaultValues={
              editingAddress
                ? {
                    name: editingAddress.name,
                    phone: editingAddress.phone,
                    area: editingAddress.area,
                    city: editingAddress.city,
                    district: editingAddress.district,
                    postalCode: editingAddress.postalCode,
                    isDefault: editingAddress.isDefault,
                  }
                : undefined
            }
          />
        </div>
      ) : !user?.addresses || user.addresses.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          <MapPin className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">No addresses saved yet</p>
          <p className="text-xs text-gray-450 mt-1">Please add a shipping address for faster checkouts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses.map((addr: Address) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 bg-white transition-all shadow-3xs ${
                addr.isDefault ? "border-black shadow-xs" : "border-gray-150 hover:border-gray-300"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{addr.name}</span>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-0.5 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Home className="h-2.5 w-2.5" />
                      <span>Default</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-450 font-medium">Phone: {addr.phone}</p>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  {addr.area}, {addr.city}, {addr.district} - {addr.postalCode}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="font-bold text-pink-600 hover:text-pink-700 transition-colors uppercase tracking-wider text-[10px]"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEditInit(addr)}
                  className="font-bold text-gray-700 hover:text-black transition-colors uppercase tracking-wider text-[10px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 uppercase tracking-wider ml-auto text-[10px]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
