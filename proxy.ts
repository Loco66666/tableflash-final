import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!hasSupabaseEnv) return NextResponse.next({ request });
  if (pathname.startsWith("/r/")) return NextResponse.next({ request });

  const { supabase, response } = createProxyClient(request);
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
