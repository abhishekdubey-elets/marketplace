import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE, safeNext, verifySession } from "@/lib/auth/session";
import { OPS_LOGIN_INTERNAL, opsLoginPath } from "@/lib/auth/ops";
import type { Role } from "@/lib/types";

// Role-based route protection. Each portal prefix requires the matching role.
const PORTALS: { prefix: string; role: Role }[] = [
  { prefix: "/buyer", role: "buyer" },
  { prefix: "/provider", role: "provider" },
  { prefix: "/admin", role: "admin" },
];

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

/** Render the regular 404 page without revealing that the route exists. */
const notFound = (request: NextRequest) => NextResponse.rewrite(new URL("/__not-found", request.url), { status: 404 });

export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const opsPath = opsLoginPath();

  // --- Elets operations sign-in: served only at its unlisted path (OPS_LOGIN_PATH)
  if (opsPath !== OPS_LOGIN_INTERNAL && under(pathname, OPS_LOGIN_INTERNAL)) return notFound(request);
  if (pathname === opsPath) {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (session?.role === "admin" && !searchParams.has("expired")) return NextResponse.redirect(new URL("/admin", request.url));
    const res = opsPath === OPS_LOGIN_INTERNAL ? NextResponse.next() : NextResponse.rewrite(new URL(OPS_LOGIN_INTERNAL + search, request.url));
    if (searchParams.has("expired")) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const portal = PORTALS.find((p) => under(pathname, p.prefix));
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (!portal && !isAuthPage) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login" && searchParams.has("expired")) {
    const res = NextResponse.next();
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  if (isAuthPage) {
    if (!session) return NextResponse.next();
    // Signed in under a different role (e.g. a provider following a buyer-only
    // "Sign in to connect" link): show the page so they can switch.
    const wanted = searchParams.get("role");
    if (wanted && wanted !== session.role) return NextResponse.next();
    return NextResponse.redirect(new URL(safeNext(session.role, searchParams.get("next")), request.url));
  }
  if (!portal) return NextResponse.next();

  // The operations portal is invisible to everyone else: no login redirect, just a 404.
  if (portal.role === "admin" && session?.role !== "admin") return notFound(request);

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
  // everything except Next internals and static files (the ops sign-in path is configurable, so it can't be listed here)
  matcher: ["/((?!_next/|api/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$).*)"],
};
