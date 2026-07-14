import type { HomepageSettings } from "@/lib/types";

/**
 * Default homepage content used when the `settings/homepage` doc has not been
 * created yet, or to backfill any missing fields. These mirror the values the
 * storefront components originally hardcoded so the site looks identical until
 * an admin customizes it from Admin → Homepage.
 */
export const DEFAULT_HOMEPAGE: HomepageSettings = {
  discountBanner: {
    eyebrow: "Discover New Fashion",
    headline: "UP TO 70% OFF",
    trustLine: "Verified Sellers Only",
    ctaLabel: "Shop the Sale",
    link: "/products?maxPrice=1999",
  },
  priceTiers: [
    { label: "Under ৳499", maxPrice: 499 },
    { label: "Under ৳999", maxPrice: 999 },
    { label: "Under ৳1499", maxPrice: 1499 },
    { label: "Under ৳1999", maxPrice: 1999 },
  ],
  featuredBrandSlugs: [],
  sections: {
    discountBanner: true,
    shopByPrice: true,
    featuredBrands: true,
    dealOfTheDay: true,
    newArrivals: true,
    topSelling: true,
    allProducts: true,
  },
};

/**
 * Merge a partial/stored homepage config over the defaults so consumers always
 * receive a complete, valid object even if the doc is old or partial.
 */
export function mergeHomepage(stored: Partial<HomepageSettings> | null | undefined): HomepageSettings {
  if (!stored) return DEFAULT_HOMEPAGE;
  return {
    discountBanner: { ...DEFAULT_HOMEPAGE.discountBanner, ...(stored.discountBanner ?? {}) },
    priceTiers:
      Array.isArray(stored.priceTiers) && stored.priceTiers.length > 0
        ? stored.priceTiers
        : DEFAULT_HOMEPAGE.priceTiers,
    featuredBrandSlugs: Array.isArray(stored.featuredBrandSlugs)
      ? stored.featuredBrandSlugs
      : DEFAULT_HOMEPAGE.featuredBrandSlugs,
    sections: { ...DEFAULT_HOMEPAGE.sections, ...(stored.sections ?? {}) },
    updatedAt: stored.updatedAt,
    updatedBy: stored.updatedBy,
  };
}
