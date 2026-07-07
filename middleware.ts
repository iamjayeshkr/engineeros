import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];
// Reachable only via a valid password-recovery link, which establishes a
// real (recovery) session — so unlike the routes above, a signed-in user
// must still be allowed to land here. It's public, but exempt from the
// "already logged in -> bounce to /dashboard" redirect that applies to the
// other public routes.
const AUTH_EXEMPT_NO_BOUNCE_ROUTES = ["/reset-password"];
// Routes that must never be gated behind an auth check. In particular the
// OAuth callback is hit while the user is still unauthenticated (the code
// exchange is what creates their session) — without this exclusion, every
// Google/GitHub login redirect gets bounced to /login before the exchange
// can happen, breaking OAuth login entirely.
const BYPASS_PREFIXES = ["/api/auth"];

export async function middleware(request: NextRequest) {
  if (BYPASS_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser().catch((err) => {
    // If Supabase's auth server is unreachable (DNS failure, network blip,
    // timeout), the previous code let this throw uncaught out of middleware —
    // which means EVERY route 500s for EVERY user site-wide during any
    // transient auth-provider hiccup. Fail closed instead: treat as
    // unauthenticated so protected routes redirect to /login, and let public
    // routes still render. A real outage should degrade to "please log in
    // again", not a blank 500 page across the whole app.
    console.error("[middleware] supabase.auth.getUser() failed:", err);
    return { data: { user: null }, error: err };
  });

  const isExemptNoBounce = AUTH_EXEMPT_NO_BOUNCE_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route)) ||
    isExemptNoBounce;

  if (!user && !isPublicRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isPublicRoute && !isExemptNoBounce) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};
