import { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { Store } from "@/lib/types";
import StoreDetailClient from "./StoreDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    if (!adminDb) {
      throw new Error("adminDb is not initialized");
    }
    const snapshot = await adminDb
      .collection("stores")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        title: "Store | AORGO",
        description: "Browse this vendor's collection on AORGO.",
      };
    }

    const store = snapshot.docs[0].data() as Store;

    return {
      title: `${store.name} | AORGO Store`,
      description:
        store.description ||
        `Shop the latest collection from ${store.name} on AORGO Bangladesh.`,
      openGraph: {
        title: `${store.name} | AORGO Store`,
        description:
          store.description ||
          `Shop the latest collection from ${store.name} on AORGO Bangladesh.`,
        type: "website",
      },
    };
  } catch (error) {
    console.error("Error generating store metadata:", error);
    return {
      title: "Store | AORGO",
      description: "Browse this vendor's collection on AORGO.",
    };
  }
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  return <StoreDetailClient slug={slug} />;
}
