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

