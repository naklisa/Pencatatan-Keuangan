import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";

export const metadata: Metadata = {
  title: "Pencatatan Keuangan (Pribadi & Kontrakan)",
  description: "Aplikasi Manajemen Keuangan Pribadi & Kas Kontrakan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
