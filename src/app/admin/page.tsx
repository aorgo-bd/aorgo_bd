import { redirect } from "next/navigation";

// The admin panel has no standalone landing view — `/admin` is an alias for the
// dashboard. Redirecting here fixes the 404 users hit when typing/bookmarking
// the bare `/admin` URL (login only ever sends them to `/admin/dashboard`).
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
