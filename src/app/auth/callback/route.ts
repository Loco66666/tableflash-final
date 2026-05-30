import { NextResponse } from "next/server";

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    return siteUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  }

  return "http://127.0.0.1:3000";
}

export async function GET() {
  return NextResponse.redirect(new URL("/login", getSiteUrl()));
}