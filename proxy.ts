import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const marketingHosts = new Set(["tableflash.fr", "www.tableflash.fr"]);
const marketingHost = "tableflash.fr";
const appHost = "app.tableflash.fr";

const marketingRewrites = new Map<string, string>([
  ["/", "/site"],
  ["/tarifs", "/site/tarifs"],
]);

const marketingCanonicalRedirects = new Map<string, string>([
  ["/site", "/"],
  ["/site/tarifs", "/tarifs"],
]);

function redirectToApp(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = appHost;
  return NextResponse.redirect(url);
}

function redirectToMarketing(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = marketingHost;
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  if (marketingHosts.has(host)) {
    const canonicalPathname = marketingCanonicalRedirects.get(pathname);

    if (canonicalPathname) {
      return redirectToMarketing(request, canonicalPathname);
    }

    const rewritePathname = marketingRewrites.get(pathname);

    if (rewritePathname) {
      const url = request.nextUrl.clone();
      url.pathname = rewritePathname;
      return NextResponse.rewrite(url);
    }

    if (
      pathname === "/login" ||
      pathname === "/logout" ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/r/")
    ) {
      return redirectToApp(request);
    }

    return NextResponse.next({ request });
  }

  if (host === appHost && (pathname === "/site" || pathname.startsWith("/site/"))) {
    const marketingPathname = pathname === "/site" ? "/" : pathname.replace(/^\/site/, "");
    return redirectToMarketing(request, marketingPathname);
  }

  if (!hasSupabaseEnv) return NextResponse.next({ request });
  if (pathname.startsWith("/r/")) return NextResponse.next({ request });

  const { supabase, response } = createProxyClient(request);
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};