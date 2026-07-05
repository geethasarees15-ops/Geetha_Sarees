import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getCanonicalSiteOrigin } from "@/lib/auth/site-urls";
import {
  checkAuthRateLimit,
  getRequestIp,
  isAuthRateLimitPath,
} from "@/lib/auth/rate-limit";

/** Supabase sometimes returns OAuth to Site URL root (?code=) — forward to /auth/callback. */
function redirectStrayOAuthToCallback(
  request: NextRequest,
): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith("/auth/callback")) {
    return null;
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!code && !(tokenHash && type)) {
    return null;
  }

  const callback = new URL("/auth/callback", request.url);
  searchParams.forEach((value, key) => {
    callback.searchParams.set(key, value);
  });

  return NextResponse.redirect(callback);
}

/** Keep storefront on the canonical custom domain (www) for Cashfree whitelisting. */
function redirectToCanonicalHost(request: NextRequest): NextResponse | null {
  const hostHeader = request.headers.get("host") ?? "";
  const host = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  if (
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app")
  ) {
    return null;
  }

  let canonical: URL;
  try {
    canonical = new URL(getCanonicalSiteOrigin());
  } catch {
    return null;
  }

  const canonicalHost = canonical.host.toLowerCase();
  if (host === canonicalHost) {
    return null;
  }

  const redirect = new URL(request.url);
  redirect.protocol = canonical.protocol;
  redirect.host = canonicalHost;
  return NextResponse.redirect(redirect, 308);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const canonicalRedirect = redirectToCanonicalHost(request);
  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  if (isAuthRateLimitPath(pathname)) {
    const ip = getRequestIp(request.headers);
    const { limited } = await checkAuthRateLimit(ip);
    if (limited) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set(
        "error",
        "Too many sign-in attempts. Please wait a minute and try again.",
      );
      return NextResponse.redirect(signIn);
    }
  }

  const strayOAuth = redirectStrayOAuthToCallback(request);
  if (strayOAuth) {
    return strayOAuth;
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/admin") && !user) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("from", pathname);
    signIn.searchParams.set("error", "Please sign in to access admin.");
    return NextResponse.redirect(signIn);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
