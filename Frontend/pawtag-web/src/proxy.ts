import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/pet", "/scan", "/notifications", "/profile", "/passport", "/tags", "/lost-mode"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  // Auth check will be done client-side (localStorage) — middleware just passes through for now
  // When backend is integrated, check JWT cookie here
  if (isProtected) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|t/|n/).*)"],
};
