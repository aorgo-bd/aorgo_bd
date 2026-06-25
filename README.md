# AORGO — Multi-Vendor Fashion & Lifestyle Marketplace (Bangladesh)

AORGO is a premium, mobile-first multi-vendor fashion and lifestyle marketplace built for **Bangladesh**, drawing inspiration from platforms like Myntra, Nykaa Fashion, and Ajio. 

---

## 🚀 Key Features

*   **Premium Storefront:** Dynamic collections Mega-Menu, responsive grid layouts, and advanced search with prefix matching.
*   **Zustand Shopping Cart & Wishlist:** Client-side persisted shopping states in LocalStorage with header badge counters.
*   **Product Detail Page (PDP):** Fully featured PDP with a Cloudinary image gallery, color/size variant selectors, sticky mobile CTA actions, trust badges, and similar product rails.
*   **Cash on Delivery (COD) Checkout:** Secure checkout flow featuring client-side Zod validators, BD district selections, and transactional stock deductions in Firestore.
*   **Fulfillment & Tracking:** Interactive order history logging, courier selector (`manual`, `steadfast`, `pathao`, `redx`, `paperfly`), packing slip printouts, and status progression panels.
*   **Verified Reviews System:** Secure client-side review locks, next-cloudinary customer upload widgets, and transactional calculations to compute product rating averages.

---

## 🛠️ Hard Constraints (Bangladesh MVP)
1.  **Payment Mode:** Cash on Delivery (COD) only.
2.  **Currency:** BDT (`৳`), stored as integer Taka (never float/string).
3.  **Roles:** `customer`, `seller`, and `admin` only.
4.  **Top Categories:** Women's Fashion, Men's Fashion, and Footwear (divided into 12 subcategories).
5.  **Images:** Stored as Cloudinary public IDs only.

---

## 📦 Getting Started

### 1. Installation
Install project dependencies:
```bash
pnpm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root `aorgo` folder and supply the Firebase and Cloudinary credentials:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Server Admin Config (Encoded Service Account JSON)
FIREBASE_ADMIN_CREDENTIALS_BASE64=your_base64_service_account_json
```

### 3. Firestore Seeding
Seed top-level categories and subcategories first:
```bash
npx tsx scripts/seed-categories.ts
```

Seed mock stores, test accounts, and 36 demo products across all 12 categories:
```bash
npx tsx scripts/seed-demo-products.ts
```

### 4. Run Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront.

---

## 📁 Folder Structure
```text
src/
├── app/
│   ├── (auth)/                # Customer login/registration flows
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
```

---

## 🔒 Test Accounts (Demo Seeding)

### Admin Account
*   **Email:** `aorgobd@gmail.com`
*   **Password:** *(Use your registered auth credentials)*
*   **Path:** `/admin`

### Demo Customers
*   **Email:** `customer1@aorgo.com.bd` or `customer2@aorgo.com.bd`

### Demo Sellers
*   **Owner UID:** `demo-seller-1` (Aarong), `demo-seller-2` (Yellow), `demo-seller-5` (Apex)
*   **Path:** `/seller`
