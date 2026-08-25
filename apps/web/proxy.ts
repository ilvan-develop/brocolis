import type { Portal } from "@brocolis/contracts";
import jwt from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";
import { allowedRoutePrefixes, canAccessRoute } from "@/lib/routes";

const PUBLIC_ROUTES = [
  "/sign-in",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function extractSession(request: NextRequest) {
  const cookie = request.cookies.get("brocolis.session");
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return { token: authHeader.slice(7), source: "header" as const };
  }

  if (cookie?.value) {
    return { token: cookie.value, source: "cookie" as const };
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");

  if (isPublic(pathname)) {
    return response;
  }

  const session = extractSession(request);

  if (!session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const jwtSecret =
    process.env.NEXT_PUBLIC_JWT_SECRET ?? process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET não configurado para validação no proxy");
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const decoded = jwt.verify(session.token, jwtSecret) as {
      sub?: string;
    };

    if (!decoded.sub) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const sessionPayload = {
      sub: decoded.sub,
    };

    const allowedPrefixes = allowedRoutePrefixes(
      sessionPayload.sub as Portal,
      [],
    );
    const hasAccess = allowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    response.headers.set("x-brocolis-user-id", sessionPayload.sub);
    return response;
  } catch {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
