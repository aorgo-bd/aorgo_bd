import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firebaseToken = request.cookies.get("firebase-token")?.value;
  const userRole = request.cookies.get("user-role")?.value;

  const isSellerRoute = pathname.startsWith("/seller");
  // Protect /admin routes as well as /dashboard (the admin dashboard)
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");

  // If trying to access a protected route and not signed in
  if ((isSellerRoute || isAdminRoute) && !firebaseToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin and dashboard route check: only 'admin' role can access
  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Seller route check: only 'seller' role can access
  if (isSellerRoute && userRole !== "seller") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*", "/admin/:path*", "/dashboard/:path*"],
};
