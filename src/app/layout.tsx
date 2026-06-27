import { cn } from "@/lib/utils";
import Providers from "./_components/providers";
import ClientShell from "./_components/ClientShell";
import "./globals.css";

const assistant = {
  variable: "font-sans",
  className: "font-sans",
};

const bebas = {
  variable: "font-display",
  className: "font-display",
};

const bangla = {
  variable: "font-bangla",
  className: "font-bangla",
};

export const metadata = {
  title: "AORGO — Bangladesh Marketplace",
  description: "Shop curated fashion, electronics and home goods from verified Bangladeshi sellers.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&family=Bebas+Neue&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={assistant.className}>
        <Providers>
          <ClientShell>{children}</ClientShell>
        </Providers>
      </body>
    </html>
  );
}
