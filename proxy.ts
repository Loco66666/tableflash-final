import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const marketingHosts = new Set(["tableflash.fr", "www.tableflash.fr"]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  if (marketingHosts.has(host) && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/site";
    return NextResponse.rewrite(url);
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