import { Assistant, Bebas_Neue, Hind_Siliguri } from "next/font/google";
import { cn } from "@/lib/utils";
import Providers from "./_components/providers";
import ClientShell from "./_components/ClientShell";
import "./globals.css";

const assistant = Assistant({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const bangla = Hind_Siliguri({
  subsets: ["latin", "bengali"],
  weight: ["400", "600", "700"],
  variable: "--font-bangla",
  display: "swap",
});

export const metadata = {
  title: "AORGO — Bangladesh Fashion Marketplace",
  description: "Shop curated fashion from verified Bangladeshi sellers. Cash on Delivery across Bangladesh.",
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(assistant.variable, bebas.variable, bangla.variable)}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-sans">
        <Providers>
          <ClientShell>{children}</ClientShell>
        </Providers>
      </body>
    </html>
  );
}
