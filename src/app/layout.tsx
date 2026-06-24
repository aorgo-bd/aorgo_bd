"use client";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import Providers from "./_components/providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/seller");

  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>
        <Providers>
          <Toaster />
          {!isDashboardRoute && <Header />}
          <div className="min-h-screen">{children}</div>
          {!isDashboardRoute && <Footer />}
        </Providers>
      </body>
    </html>
  );
}
