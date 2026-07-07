"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useState } from "react";
import { doc, updateDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import toast from "react-hot-toast";
import { MapPin, Plus, Trash2, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Address } from "@/lib/types";

const BD_DISTRICTS = [
  "Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh",
  "Gazipur", "Narayanganj", "Cumilla", "Bogura", "Cox's Bazar", "Feni", "Jessore", "Tangail"
];

export default function AddressesPage() {
  const { user, refetch } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState(BD_DISTRICTS[0]);
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setPhone("");
    setArea("");
    setCity("");
    setDistrict(BD_DISTRICTS[0]);
    setPostalCode("");
    setIsDefault(false);
    setIsAdding(false);
    setEditingAddressId(null);
  };

  const handleEditInit = (addr: Address) => {
    setName(addr.name);
    setPhone(addr.phone);
    setArea(addr.area);
    setCity(addr.city);
    setDistrict(addr.district);
    setPostalCode(addr.postalCode);
    setIsDefault(addr.isDefault);
    setEditingAddressId(addr.id);
    setIsAdding(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name || !phone || !area || !city || !postalCode) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const addresses = user.addresses ? [...user.addresses] : [];

      if (editingAddressId) {
        // Edit Mode
        const updated = addresses.map((addr) => {
          if (addr.id === editingAddressId) {
            return {
              ...addr,
              name,
              phone,
              area,
              city,
              district,
              postalCode,
              isDefault: isDefault || addr.isDefault, // Keep default if already default
            };
          }
          // If we are setting this address to default, set others to false
          if (isDefault) {
            return { ...addr, isDefault: false };
          }
          return addr;
        });

        // Ensure at least one default
        if (isDefault) {
          const targetIndex = updated.findIndex((a) => a.id === editingAddressId);
          if (targetIndex !== -1) updated[targetIndex].isDefault = true;
        }

        await updateDoc(doc(db, "users", user.uid), { addresses: updated, updatedAt: Date.now() });
        toast.success("Address updated successfully!");
      } else {
        // Add Mode
        const newAddressId = doc(collection(db, "temp")).id;
        const newAddress: Address = {
          id: newAddressId,
          name,
          phone,
          area,
          city,
          district,
          postalCode,
          isDefault: isDefault || addresses.length === 0, // Automatically default if first address
        };

        const updated = isDefault
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
      // If we deleted the default, set first remaining as default
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
        <form onSubmit={handleFormSubmit} className="space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            {editingAddressId ? "Edit Address Details" : "New Address Details"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Recipient Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shakib Al Hasan"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Contact Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +8801700000000"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Address / Street Name / Area *</label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="House, Road, Apartment, Area details..."
                className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mirpur"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">District *</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-250 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Postal Code *</label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 1216"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="default-check"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded-md border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="default-check" className="text-xs font-semibold text-gray-600 cursor-pointer">
                Set as default delivery address
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center bg-black hover:bg-black/90 text-white rounded-xl px-5 text-xs font-bold transition-all disabled:opacity-50 min-w-[100px] cursor-pointer"
            >
              {loading ? "Saving..." : "Save Address"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-10 items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-5 text-xs font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
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
                    className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider text-[10px]"
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
