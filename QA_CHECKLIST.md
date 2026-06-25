# AORGO — End-to-End QA Checklist (30 Items)

This checklist details the key functional pathways and verification steps to guarantee the stability and premium feel of the AORGO Bangladesh marketplace.

---

## 1. Authentication & Profile Guards (5 Items)
- [ ] **QA-01: Customer Registration:** Register a new customer via `/register` (validating Bangladesh phone number with regex, matching passwords, and Zod criteria). Ensure the user record is written to Firestore with a `customer` role.
- [ ] **QA-02: Authentication Login:** Log in via `/login` with valid credentials. Verify that the client sets `firebase-token` and `user-role` cookies and redirects the user to the destination path.
- [ ] **QA-03: Protected Route Guards:** Try to access `/seller` or `/admin` as a logged-in customer. Verify that the middleware blocks access and redirects to the storefront homepage `/`.
- [ ] **QA-04: Session Persistence:** Refresh the browser while logged in. Verify that the user session remains active (retaining cart/wishlist Zustand states).
- [ ] **QA-05: Logout Action:** Log out using the navigation profile dropdown. Verify that cookies are deleted, state stores are cleared, and the user is redirected to the home page.

---

## 2. Storefront Browsing & Search (6 Items)
- [ ] **QA-06: Mega Menu Navigation:** Hover over the top-level categories (Women, Men, Footwear) on desktop. Verify that the mega-menu dropdown renders with its subcategories and promotional visuals.
- [ ] **QA-07: Responsive Mobile Drawer:** Open the mobile menu drawer. Verify that subcategories expand accordion-style and redirect to correct routes.
- [ ] **QA-08: Debounced Search Input:** Type a query in the search bar. Verify that results debounce, update matching terms, and route to `/search?q=query` on press.
- [ ] **QA-09: Category Filters:** Filter products on the category view by subcategory. Verify that only matching products are rendered.
- [ ] **QA-10: Sort Options:** Change sorting to "Price: Low to High" and "Price: High to Low". Verify that the items are sorted correctly in Takas (`৳`).
- [ ] **QA-11: PDP Product Details:** Click a product card to open the PDP. Verify that the Cloudinary image gallery loads, variant combinations update stock indicators, and specifications display correctly.

---

## 3. Cart & Wishlist States (5 Items)
- [ ] **QA-12: Wishlist Add/Remove:** Click the Heart icon on a product card or PDP. Verify that the item gets added to the Zustand store, the header wishlist badge count updates, and it persists in LocalStorage.
- [ ] **QA-13: Cart Slide Drawer:** Click the cart icon in the header. Verify that the Slide Drawer opens on the right side and lists all added items, quantities, and prices.
- [ ] **QA-14: Quantity Select Adjustments:** Increment and decrement item quantities in the cart drawer. Verify that subtotal recomputes and respect variant stock boundaries.
- [ ] **QA-15: Variant Selection Guard:** Try to add a product to the cart without selecting a Size or Color. Verify that a warning toast appears asking to select options first.
- [ ] **QA-16: Mobile Sticky CTA:** Scroll down a PDP on mobile. Verify that a sticky bottom action bar appears containing the "Add to Cart" and "Buy Now" options.

---

## 4. Checkout & Price Recomputation (5 Items)
- [ ] **QA-17: COD Payment Method:** Navigate to `/checkout` with items in the cart. Verify that "Cash on Delivery" is pre-selected and that it is the only payment option.
- [ ] **QA-18: Address Validation:** Submit the checkout shipping address form with invalid or missing inputs. Verify that Zod errors appear (specifically validating BD district selections and phone regex).
- [ ] **QA-19: Price Recomputation Transaction:** Place an order. Verify that the server endpoint (`/api/orders`) re-checks product pricing in Firestore to prevent client-side price tampering.
- [ ] **QA-20: Shipping Fee Rules:** Place an order with subtotal ≤ 3000 Taka (shipping = ৳100) and another with subtotal > 3000 Taka (shipping = Free). Verify that correct totals are calculated.
- [ ] **QA-21: Stock Deduction:** Check product stock levels before and after order placement. Verify that stock is deducted transactionally in Firestore.

---

## 5. Seller Fulfillment Portal (5 Items)
- [ ] **QA-22: Seller Orders List:** Open `/seller/orders`. Verify that incoming orders appear in the table showing customer details, items, date, and status badges.
- [ ] **QA-23: Status Selection:** Open a specific seller order details page. Change status from `pending` to `confirmed`. Save and check that the timeline history updates with a new log entry.
- [ ] **QA-24: Courier Dropdown & Tracking:** Update the order to `shipped` status, select a courier partner (`steadfast`, `pathao`, etc.), and input a tracking ID. Verify that the values save.
- [ ] **QA-25: Print Packing Slip:** Click the "Print Packing Slip" button on the order page. Verify that a clean print-preview overlay appears containing the customer invoice.
- [ ] **QA-26: Access Control Guard:** Try to load another seller's order details URL. Verify that a permission error page appears.

---

## 6. Review System & Ratings (4 Items)
- [ ] **QA-27: Review Eligibility Check:** Load a PDP. If the logged-in user has a delivered order for this item, verify that the "Write a review" link and banner appear on the page.
- [ ] **QA-28: Write Review Dialog:** Click "Write Review" from the customer order details page. Rate the item, write a text comment, upload up to 5 photos, and click submit. Verify that photos load to Cloudinary.
- [ ] **QA-29: Ratings Average Transaction:** Submit the review. Verify that `/api/reviews` transactionally recalculates the product's average `rating` and increments `reviewCount`.
- [ ] **QA-35: Review Form Lock:** Load the order details page again. Verify that the product is now marked as "Reviewed" and the form cannot be submitted twice for the same purchase.
