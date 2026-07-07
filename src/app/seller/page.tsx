import { redirect } from "next/navigation";

// The seller portal has no standalone landing view — `/seller` is an alias for
// the dashboard. Redirecting here fixes the 404 users hit when typing or
// bookmarking the bare `/seller` URL.
export default function SellerIndexPage() {
  redirect("/seller/dashboard");
}
