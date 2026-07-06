import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session")?.value;

  const isSellerRoute = pathname.startsWith("/seller");
  const isAdminRoute = pathname.startsWith("/admin");

  if ((isSellerRoute || isAdminRoute) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    const payload = decodeJwt(session);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = payload.role || "customer";

    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isSellerRoute && userRole !== "seller" && userRole !== "admin") {
      if (pathname !== "/seller/register") {
        return NextResponse.redirect(new URL("/seller/register", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*", "/admin/:path*"],
};