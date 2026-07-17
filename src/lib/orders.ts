// =====================================================
// AORGO — Order lifecycle state machines (shared)
// =====================================================
// Single source of truth for the order-status and payment-status transition
// rules. Imported by both the client fulfilment UI and the server API route so
// the two never drift apart.

import type { OrderStatus } from "./types";

export type PaymentStatus = "pending" | "paid" | "refunded";

// Order status state-machine. A status may only move to one of its allowed next
// states; `cancelled` and `returned` are terminal. This prevents nonsensical
// transitions (e.g. delivered -> pending) that would corrupt the lifecycle.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  returned: [],
  cancelled: [],
};

// Transitioning into one of these releases the reserved inventory back to stock.
export const RESTOCK_STATUSES: OrderStatus[] = ["cancelled", "returned"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Returned",
  cancelled: "Cancelled",
};

// Payment status state-machine. COD orders open as `pending`; the seller marks
// them `paid` once cash is collected on delivery. A paid order may be
// `refunded` (e.g. on a return). `refunded` is terminal.
export const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "refunded"];

export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid"],
  paid: ["refunded"],
  refunded: [],
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment Pending",
  paid: "Payment Received",
  refunded: "Refunded",
};

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ORDER_STATUS_TRANSITIONS, value)
  );
}

export function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && (PAYMENT_STATUSES as string[]).includes(value);
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return (ORDER_STATUS_TRANSITIONS[from] || []).includes(to);
}

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  return (PAYMENT_STATUS_TRANSITIONS[from] || []).includes(to);
}

// Human-readable timeline note for a payment status change.
export function paymentHistoryNote(to: PaymentStatus, actor: string): string {
  switch (to) {
    case "paid":
      return `Payment received (COD) — marked paid by ${actor}.`;
    case "refunded":
      return `Payment refunded by ${actor}.`;
    case "pending":
    default:
      return `Payment status reset to pending by ${actor}.`;
  }
}
