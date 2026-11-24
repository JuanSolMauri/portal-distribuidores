import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal de distribuidores",
  description: "Portal privado para distribuidores internacionales",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen font-sans text-sm antialiased">{children}</body>
    </html>
  );
}
