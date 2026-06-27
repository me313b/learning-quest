import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  applicationName: "Learning Quest",
  title: "Learning Quest",
  description: "Mine knowledge. Build a brilliant brain.",
  // The manifest link is added automatically from app/manifest.ts.
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Learning Quest",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#241c2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-bg min-h-screen">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
