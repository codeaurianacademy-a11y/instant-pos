import { NextResponse, type NextRequest } from "next/server";
import { JWT_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const ADMIN_ONLY_PREFIXES = ["/dashboard", "/inventory", "/reports", "/barcodes", "/staff"];
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    const target = session.role === "ADMIN" ? "/dashboard" : "/sales";
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isAdminOnlyRoute && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/sales", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (each route enforces its own auth)
     * - Next.js internals and static assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
