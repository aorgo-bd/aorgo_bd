import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Bangladesh phone number regex
export const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

export const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(bdPhoneRegex, "Invalid Bangladesh phone number"),
  area: z.string().min(5, "Area/Address details must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  district: z.string().min(1, "District is required"),
  postalCode: z.string().min(4, "Postal code must be at least 4 digits"),
  isDefault: z.boolean(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

// Profile self-service settings. Fields are optional, but when provided they
// must be valid (so an invalid phone can't flow into delivery downstream).
export const profileSettingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(60, "Name is too long")
    .refine((v) => v === "" || v.length >= 2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || bdPhoneRegex.test(v), "Invalid Bangladesh phone number"),
  photoURL: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Must be a valid URL"),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;

export const checkoutItemSchema = z.object({
  productId: z.string(),
  variantSku: z.string(),
  qty: z.number().int().positive("Quantity must be at least 1"),
});

export const checkoutPayloadSchema = z.object({
  items: z.array(checkoutItemSchema).nonempty("Your cart is empty"),
  shippingAddress: addressSchema,
});

export const sellerRegisterSchema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().regex(bdPhoneRegex, "Invalid Bangladesh phone number"),
  tradeLicenseUrl: z.string().min(3, "Please upload your Trade License document"),
  nidUrl: z.string().min(3, "Please upload your NID document"),
  bankDetails: z.object({
    accountName: z.string().min(3, "Account name is required"),
    accountNumber: z.string().min(5, "Account number is required"),
    bankName: z.string().min(3, "Bank name is required"),
    branchName: z.string().min(3, "Branch name is required"),
    routingNumber: z.string().optional(),
  }),
});

export type SellerRegisterFormData = z.infer<typeof sellerRegisterSchema>;

export const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  stock: z.number().int().nonnegative("Stock must be 0 or more"),
  imagePublicId: z.string().optional(),
});

export const productFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  brand: z.string().min(2, "Brand must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  gender: z.enum(["women", "men", "unisex"]),
  price: z.number().int().positive("Price must be a positive integer in BDT (৳)"),
  comparePrice: z.number().int().positive("Compare price must be a positive integer in BDT (৳)").optional().or(z.literal("").transform(() => undefined)),
  images: z.array(z.string()).min(1, "At least one product image is required"),
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
  attributes: z.object({
    fit: z.enum(["regular", "slim", "relaxed", "oversized"]).optional(),
    fabric: z.string().optional(),
    occasion: z.array(z.string()).optional(),
  }),
});

export type ProductVariantData = z.infer<typeof productVariantSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;

export const bannerFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  subtitle: z.string().optional(),
  imagePublicId: z.string().min(1, "Banner image is required"),
  ctaUrl: z.string().min(1, "CTA URL is required"),
  position: z.enum(["hero", "mid", "footer"]),
  active: z.boolean().default(true),
  order: z.coerce.number().int().nonnegative("Order must be 0 or more"),
});

export type BannerFormData = z.infer<typeof bannerFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers and single hyphens (e.g. women-tops)"
    ),
  nameBn: z.string().optional().or(z.literal("")),
  // Parent slug; "" or null means a top-level category.
  parent: z.string().nullable().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().nonnegative("Order must be 0 or more"),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const settingsSchema = z.object({
  siteName: z.string().min(2, "Site name must be at least 2 characters"),
  supportEmail: z.string().email("Invalid support email address"),
  supportPhone: z.string().regex(bdPhoneRegex, "Invalid Bangladesh phone number"),
  announcement: z.string().max(160, "Announcement cannot exceed 160 characters").optional().or(z.literal("")),
  announcementActive: z.boolean().default(false),
  freeShippingThreshold: z.coerce.number().int().nonnegative("Threshold must be 0 or more"),
  defaultShippingFee: z.coerce.number().int().nonnegative("Shipping fee must be 0 or more"),
  defaultCommissionRate: z.coerce.number().min(0, "Commission must be 0 or more").max(100, "Commission cannot exceed 100%"),
  codEnabled: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
  socialFacebook: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  socialInstagram: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

// Admin-managed homepage content (settings/homepage). Kept in a separate doc /
// schema from the general marketplace settings so saving one never clobbers the
// other.
export const homepageSchema = z.object({
  discountBanner: z.object({
    eyebrow: z.string().max(60, "Keep the eyebrow under 60 characters").optional().or(z.literal("")),
    headline: z.string().min(1, "Headline is required").max(60, "Keep the headline under 60 characters"),
    trustLine: z.string().max(60, "Keep the trust line under 60 characters").optional().or(z.literal("")),
    ctaLabel: z.string().max(40, "Keep the button label under 40 characters").optional().or(z.literal("")),
    link: z.string().min(1, "Banner link is required"),
  }),
  priceTiers: z
    .array(
      z.object({
        label: z.string().min(1, "Label is required").max(40, "Label too long"),
        maxPrice: z.coerce.number().int().positive("Max price must be a positive integer (৳)"),
      })
    )
    .max(6, "Up to 6 price tiers"),
  featuredBrandSlugs: z.array(z.string()).max(10, "Up to 10 featured brands").default([]),
  sections: z.object({
    discountBanner: z.boolean().default(true),
    shopByPrice: z.boolean().default(true),
    featuredBrands: z.boolean().default(true),
    dealOfTheDay: z.boolean().default(true),
    newArrivals: z.boolean().default(true),
    topSelling: z.boolean().default(true),
    allProducts: z.boolean().default(true),
  }),
});

export type HomepageFormData = z.infer<typeof homepageSchema>;

export const reviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  text: z.string().min(5, "Comment must be at least 5 characters").max(500, "Comment cannot exceed 500 characters"),
  photos: z.array(z.string()).max(5, "You can upload up to 5 photos"),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
