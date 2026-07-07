# AORGO — Technical Handover Document

This document details the architectural structure, database schemas, role guards, and startup routines for AORGO — the multi-vendor fashion & lifestyle marketplace for Bangladesh.

---

## 1. Tech Stack Overview
- **Framework:** Next.js 14.2.0 (App Router) + React 18 + TypeScript.
- **Styling:** Tailwind CSS + Shadcn UI primitive blocks.
- **Database:** Firebase Firestore (atomic transactions, custom rules).
- **Authentication:** Firebase Auth (JWT idToken synchronization).
- **Asset Storage:** Cloudinary (asset transformations, `next-cloudinary` uploads).
- **State Management:** Zustand (storefront Cart + Wishlist with LocalStorage persist). TanStack Query owns server state; there is **no Redux** in this project.
- **Query Layer:** TanStack Query v5 (cache-wrapping Firestore reads).

---

## 2. Directory Layout & Key Files
```text
src/
├── app/
│   ├── (auth)/                # Auth pages (login, register)
│   ├── (storefront)/          # Public shop pages (homepage, PDP, cart, orders)
│   ├── admin/                 # Admin panel (sellers approval, banners)
│   ├── api/
│   │   ├── orders/            # Checkout price-recalculation & inventory decrease
│   │   └── reviews/           # Transactional review writing & ratings updating
│   ├── seller/                # Seller portal (products catalog, order fulfillment)
│   ├── layout.tsx             # Global Root Layout with BottomNav & Header/Footer mounts
│   └── middleware.ts          # Global middleware guarding roles and auth cookies
├── components/
│   ├── storefront/            # Storefront components (ReviewForm, BottomNav, Header, ReviewList)
│   ├── seller/                # Merchant components (ProductForm)
│   └── ui/                    # Shadcn component primitives
├── lib/
│   ├── firebase/              # Auth, Firestore, and Admin SDK initialization
│   ├── stores/                # Zustand Cart and Wishlist state stores
│   ├── hooks/                 # TanStack Query custom data fetchers
│   ├── schemas.ts             # Global Zod schemas (product, address, checkout, reviews)
│   └── types.ts               # Strict TypeScript model interfaces
```

---

## 3. Database Schema Definitions

### `users` Collection
Stores metadata for all customers, merchants, and administrators.
*   `uid` (string): Firebase Auth unique ID.
*   `email` (string): Primary contact email.
*   `role` (enum): `'customer' | 'seller' | 'admin'`.
*   `addresses` (array): Addresses matching shipping schemas.
*   `storeId` (string, optional): Merchant store reference.

### `stores` Collection
Stores shop configs for active sellers.
*   `id` (string): Store unique ID.
*   `ownerUid` (string): Merchant user ID.
*   `name` (string): Shop name.
*   `slug` (string): SEO slug.
*   `status` (enum): `'pending' | 'approved' | 'suspended'`.
*   `rating` (number): Store average rating score.
*   `reviewCount` (number): Sum of received reviews.
*   `commissionRate` (number): Service cut percentage.

### `products` Collection
Stores product inventory, variations, and ratings.
*   `id` (string): Unique document ID.
*   `storeId` (string): Associated store.
*   `title` (string): Product title.
*   `slug` (string): URL slug.
*   `category` (string): Subcategory slug (e.g. `'women-ethnic'`).
*   `price` (number): Price in Taka (integer only).
*   `variants` (array): Stock breakdown (`{ sku, size, color, stock }`).
*   `images` (array): Cloudinary public IDs only.
*   `rating` (number): Average rating score.
*   `reviewCount` (number): Review entries counter.

### `orders` Collection
Tracks order checkouts and status logs.
*   `id` (string): Transactional order ID.
*   `customerUid` (string): Buyer ID.
*   `storeId` (string): Store ID.
*   `items` (array): Purchases summary.
*   `payment` (object): COD payment status details.
*   `shipping` (object): Courier selector (`steadfast`, `pathao`, `redx`, `paperfly`, `manual`) and tracking ID.
*   `status` (enum): `'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled'`.
*   `statusHistory` (array): Logs (`{ status, at, by, note }`).

### `reviews` Collection
Tracks customer feedback.
*   `id` (string): Unique key (`${orderId}_${productId}`).
*   `productId` (string): Target product.
*   `customerUid` (string): Reviewer.
*   `orderId` (string): Verified order source.
*   `rating` (number): 1-5 score.
*   `text` (string): Review comment.
*   `photos` (array): Cloudinary public IDs.
*   `verified` (boolean): `true` (linked to delivered purchase).

---

## 4. Role Guards & Cookies Flow
Authentication uses a server-set Firebase **session cookie**:
1.  On login / auth state change, the client posts the `idToken` to
    `POST /api/auth/session`, which verifies it with the Admin SDK and sets a
    signed, `HttpOnly; Secure; SameSite=Strict` `session` cookie. Role is derived
    from the verified token claims. `DELETE /api/auth/session` clears it on logout.
2.  `src/middleware.ts` guards `/admin` and `/seller` (matcher: `/admin/:path*`,
    `/seller/:path*`) using the `session` cookie:
    *   `/admin` access requires role `"admin"`.
    *   `/seller` access requires role `"seller"` or `"admin"` (else redirected to
        `/seller/register`).
    *   Missing/invalid session redirects to `/login`.
3.  API routes and Firestore rules independently re-verify the session and reject
    suspended users, so page-shell access alone never exposes protected data.

---

## 5. Execution & Seeding
To initialize the workspace and run the test environments:

### Install Dependencies
```bash
pnpm install
```

### Seeding Categories
```bash
npx tsx scripts/seed-categories.ts
```

### Seeding Demo Stores, Users, and Products
```bash
npx tsx scripts/seed-demo-products.ts
```

### Run Local Development Server
```bash
pnpm run dev
```

### Compile Production Build
```bash
pnpm run build
```
