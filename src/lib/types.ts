// =====================================================
// AORGO — Firestore Data Model (Phase 1 MVP)
// =====================================================

export type Role = 'customer' | 'seller' | 'admin';
export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing'
  | 'shipped' | 'delivered' | 'returned' | 'cancelled';
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
export type StoreStatus = 'pending' | 'approved' | 'suspended';

// users/{uid}
export interface User {
  uid: string;
  role: Role;
  email: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  addresses: Address[];
  storeId?: string;          // sellers only
  createdAt: number;         // ms epoch
  updatedAt: number;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  area: string;
  city: string;
  district: string;          // BD district
  postalCode: string;
  isDefault: boolean;
}

// stores/{storeId} — one per seller
export interface Store {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  description?: string;
  logoPublicId?: string;     // Cloudinary
  bannerPublicId?: string;
  status: StoreStatus;
  tradeLicenseUrl?: string;  // Firebase Storage (private)
  nidUrl?: string;
  bankDetails?: BankDetails;
  contact: { email: string; phone: string };
  commissionRate: number;    // e.g. 0.10
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalProducts: number;
  createdAt: number;
  approvedAt?: number;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  routingNumber?: string;
}

// products/{productId}
export interface Product {
  id: string;
  storeId: string;
  sellerUid: string;
  title: string;
  slug: string;
  description: string;
  category: string;          // slug from /categories e.g. 'women-ethnic-saree'
  subcategory?: string;
  brand: string;
  gender: 'women' | 'men' | 'unisex';
  price: number;             // INTEGER in taka (NOT string, NOT float)
  comparePrice?: number;     // strike-through original price
  discountPercent?: number;
  variants: ProductVariant[];
  images: string[];          // Cloudinary public_ids ONLY
  attributes: {
    fit?: 'regular' | 'slim' | 'relaxed' | 'oversized';
    fabric?: string;
    occasion?: string[];
    [key: string]: any;
  };
  status: ProductStatus;
  featured?: boolean;        // featured status for collection rails
  rating: number;
  reviewCount: number;
  totalSold: number;
  // search helpers
  titleLower: string;        // for case-insensitive prefix search
  keywords: string[];        // ['saree', 'cotton', 'red'] for array-contains
  createdAt: number;
  updatedAt: number;
}

export interface ProductVariant {
  sku: string;
  size: string;              // 'XS'|'S'|...|'XXXL' or '36'|'37'|... for footwear
  color: string;
  stock: number;
  imagePublicId?: string;
}

// orders/{orderId}
export interface Order {
  id: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeOwnerUid: string;     // for security rules
  storeName: string;
  items: OrderItem[];
  shippingAddress: Address;
  payment: { method: 'cod' | 'bkash' | 'nagad' | 'card'; status: 'pending' | 'paid' | 'refunded'; transactionId?: string };
  shipping: { courier?: 'steadfast' | 'pathao' | 'redx' | 'paperfly' | 'manual'; trackingId?: string; fee: number };
  totals: { subtotal: number; shipping: number; discount: number; total: number };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: number; by: string; note?: string }[];
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  productId: string;
  variantSku: string;
  title: string;
  imagePublicId: string;
  size: string;
  color: string;
  qty: number;
  priceAtPurchase: number;
}

// reviews/{reviewId}
export interface Review {
  id: string;
  productId: string;
  customerUid: string;
  customerName: string;
  orderId: string;
  rating: number;            // 1-5
  text: string;
  photos: string[];          // Cloudinary public_ids
  verified: boolean;         // true if linked to a delivered order
  createdAt: number;
}

// categories/{slug}
export interface Category {
  slug: string;
  name: string;
  nameBn?: string;           // Bangla label (Phase 1.5)
  parent?: string;
  image?: string;
  order: number;
  productCount: number;
}

// banners/{id}
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imagePublicId: string;
  ctaUrl: string;
  position: 'hero' | 'mid' | 'footer';
  active: boolean;
  order: number;
  startsAt?: number;
  endsAt?: number;
}

// notifications/{id}
export interface Notification {
  id: string;
  recipientUid: string;
  type: 'order' | 'product' | 'seller' | 'system' | 'promo';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: number;
}

// wishlists/{userId}
export interface Wishlist {
  userId: string;
  productIds: string[];
  updatedAt: number;
}

// audit_logs/{id}
export interface AuditLog {
  id: string;
  actorUid: string;
  actorRole: Role;
  action: string;            // 'product.create', 'order.statusChange', ...
  entity: string;            // 'product', 'order', ...
  entityId: string;
  before?: any;
  after?: any;
  at: number;
}
