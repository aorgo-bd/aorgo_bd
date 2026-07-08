"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import BottomNav from "@/components/storefront/BottomNav";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import { cn } from "@/lib/utils";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isDashboardRoute =
    pathname.startsWith("/seller") ||
    pathname.startsWith("/admin");

  return (
    <>
      <Toaster />
      {!isDashboardRoute && <AnnouncementBar />}
      {!isDashboardRoute && <Header />}
      <div
        className={cn(
          "min-h-screen",
          !isDashboardRoute && "bg-ink-100 text-ink-700 pb-16 md:pb-0"
        )}
      >
        {children}
      </div>
      <BottomNav />
      {!isDashboardRoute && <Footer />}
    </>
  );
}