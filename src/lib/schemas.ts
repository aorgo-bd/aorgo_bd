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
  tradeLicenseUrl: z.string().url("Please upload your Trade License document"),
  nidUrl: z.string().url("Please upload your NID document"),
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



