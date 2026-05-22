declare module "@supabase/ssr" {
  export function createBrowserClient(url: string, key: string): unknown;
  export function createServerClient(
    url: string,
    key: string,
    options?: unknown,
  ): unknown;
}
