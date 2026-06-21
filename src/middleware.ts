import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PATHS = ["/expenses", "/reports", "/users", "/customers", "/settings"];
const STAFF_ONLY_PATHS = ["/my-collection"];

// Some paths are admin-only EXCEPT for specific sub-paths Staff also needs
// (e.g. Staff can create orders but not browse/edit the full Orders list).
const ADMIN_ONLY_WITH_EXCEPTIONS: { prefix: string; exceptions: string[] }[] = [
  { prefix: "/orders", exceptions: ["/orders/new"] },
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const isPlainAdminPath = ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));

    const isGatedAdminPath = ADMIN_ONLY_WITH_EXCEPTIONS.some(({ prefix, exceptions }) => {
      if (!pathname.startsWith(prefix)) return false;
      if (exceptions.some((exception) => pathname.startsWith(exception))) return false;
      // Staff can access individual order detail/print pages e.g. /orders/[id] and /orders/[id]/print
      // These have more than one segment after /orders/
      const afterPrefix = pathname.slice(prefix.length);
      if (afterPrefix.startsWith("/") && afterPrefix.slice(1).includes("/")) return false; // sub-route of an ID
      if (afterPrefix.match(/^\/[^/]+$/)) return false; // /orders/[id] detail page
      return true;
    });

    if ((isPlainAdminPath || isGatedAdminPath) && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const isStaffOnlyPath = STAFF_ONLY_PATHS.some((path) => pathname.startsWith(path));
    if (isStaffOnlyPath && role !== "STAFF") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

// Only routes listed here pass through the middleware at all.
// /login and /forgot-password are intentionally excluded so unauthenticated
// users can reach them. Every server action/route handler still re-checks
// role server-side independently (Rule 7) once those modules are built.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/pending-works/:path*",
    "/customers/:path*",
    "/my-collection/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
