import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "TableFlash",
  description: "Interface mobile pour service restaurant",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full overflow-x-hidden bg-white text-slate-950">{children}</body>
    </html>
  );
}
