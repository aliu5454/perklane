import type { Metadata } from "next";

import "./globals.css";

import { albert,geist } from "@/utils/fonts"
import AuthProvider from "@/components/AuthProvider"
import { ToastProvider } from "@/components/Toast"

export const metadata: Metadata = {
  title: "Perklane",
  description: "",
    icons: {
        shortcut: "/favicon/favicon-16x16.png",
        apple: "/favicon/apple-touch-icon.png",
        icon: [
            { url: "/favicon/favicon.ico", sizes: "any" }, // Fallback
            { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
        ],
    },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body
          className={`${geist.variable} ${albert.variable}`}
      >
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
      </body>
      </html>
  );
}
