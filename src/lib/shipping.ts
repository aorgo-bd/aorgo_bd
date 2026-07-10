/**
 * Single source of truth for shipping-fee rules, shared between the client
 * cart store / UI and the server order API so the total the customer sees
 * matches what the server charges.
 *
 * Rules (per store order):
 *  - Free shipping when the (per-store) subtotal exceeds FREE_SHIPPING_THRESHOLD.
 *  - Free shipping on a customer's first order when the subtotal exceeds
 *    FIRST_ORDER_FREE_THRESHOLD.
 *  - Otherwise a flat FLAT_SHIPPING_FEE per store order.
 */
export const FREE_SHIPPING_THRESHOLD = 3000;
export const FIRST_ORDER_FREE_THRESHOLD = 1500;
export const FLAT_SHIPPING_FEE = 60;

export function calculateShippingFee(
  subtotal: number,
  opts: {
    isFirstOrder?: boolean;
    /** Free shipping at/above this subtotal. 0 disables threshold-based free shipping. */
    freeShippingThreshold?: number;
    /** Flat per-store fee when no free-shipping rule applies. */
    flatFee?: number;
  } = {}
): number {
  const {
    isFirstOrder = false,
    freeShippingThreshold = FREE_SHIPPING_THRESHOLD,
    flatFee = FLAT_SHIPPING_FEE,
  } = opts;

  if (subtotal <= 0) return 0;
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) return 0;
  if (isFirstOrder && FIRST_ORDER_FREE_THRESHOLD > 0 && subtotal >= FIRST_ORDER_FREE_THRESHOLD) return 0;
  return flatFee;
}
