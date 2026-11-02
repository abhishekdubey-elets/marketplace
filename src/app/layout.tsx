import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { getCurrentUser } from "@/lib/auth/server";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Elets Solution Marketplace", template: "%s · Elets Solution Marketplace" },
  description:
    "An intelligent B2B solution marketplace connecting organisations with verified technology providers, backed by Elets' industry network and managed expertise.",
};

export const viewport: Viewport = { themeColor: "#0c1631" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProviders user={user}>{children}</AppProviders>
      </body>
    </html>
  );
}
