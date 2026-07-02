import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aperture — Where photographers come alive",
  description:
    "Aperture is a free photography community platform. Share your photos, discover inspiring work, follow photographers, enter contests, and more. Built by Adriano Boca for everyone.",
  keywords: [
    "photography", "Aperture", "photo community", "photo sharing",
    "fotografia", "community fotografica", "professional photography",
    "discover photos", "photographers", "photo contests", "free photo platform",
  ],
  authors: [{ name: "Adriano Boca" }],
  creator: "Adriano Boca",
  openGraph: {
    title: "Aperture — Where photographers come alive",
    description: "Free photography community. Share, discover, compete. Built by Adriano Boca.",
    type: "website",
    locale: "it_IT",
    siteName: "Aperture",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aperture — Where photographers come alive",
    description: "Free photography community. Share, discover, compete.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://aperture-photo.vercel.app" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  );
}
