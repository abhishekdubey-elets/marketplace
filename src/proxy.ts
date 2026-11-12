import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE, safeNext, verifySession } from "@/lib/auth/session";
import type { Role } from "@/lib/types";

// Role-based route protection. Each portal prefix requires the matching role.
const PORTALS: { prefix: string; role: Role }[] = [
  { prefix: "/buyer", role: "buyer" },
  { prefix: "/provider", role: "provider" },
  { prefix: "/admin", role: "admin" },
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const portal = PORTALS.find((p) => pathname === p.prefix || pathname.startsWith(p.prefix + "/"));
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login" && request.nextUrl.searchParams.has("expired")) {
    const res = NextResponse.next();
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  if ((pathname === "/login" || pathname === "/signup") && session) {
    // Signed in under a different role (e.g. a provider following a buyer-only
    // "Sign in to connect" link): show the login page so they can switch.
    const wanted = request.nextUrl.searchParams.get("role");
    if (wanted && wanted !== session.role) return NextResponse.next();
    return NextResponse.redirect(new URL(safeNext(session.role, request.nextUrl.searchParams.get("next")), request.url));
  }
  if (!portal) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    url.searchParams.set("role", portal.role);
    return NextResponse.redirect(url);
  }
  if (session.role !== portal.role) {
    const url = new URL(ROLE_HOME[session.role], request.url);
    url.searchParams.set("denied", portal.role);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/provider/:path*", "/admin/:path*", "/login", "/signup"],
};
