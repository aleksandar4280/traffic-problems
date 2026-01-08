// FILE: middleware.js
/**
 * Edge-safe middleware (bez next-auth/middleware i bez Prisma u Edge bundle-u).
 * Proverava da li postoji session cookie.
 * Auth.js v5 cookie prefix je "authjs". :contentReference[oaicite:4]{index=4}
 */
import { NextResponse } from "next/server";

function hasSessionCookie(req) {
  const candidates = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    // fallback (legacy setups / older cookies)
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];

  return candidates.some((name) => {
    const v = req.cookies.get(name)?.value;
    return typeof v === "string" && v.length > 0;
  });
}

export function middleware(req) {
  if (!hasSessionCookie(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
