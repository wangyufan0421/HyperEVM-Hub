import { buildSiteSeo } from "@/lib/seo";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteSettings = {
  siteName: "HyperEVM Hub",
  siteDescription: "中文 HyperEVM 生态项目目录站",
  seoTitle: "",
  seoDescription: "",
};

const siteSeo = buildSiteSeo(siteSettings);

export const metadata: Metadata = {
  title: siteSeo.title,
  description: siteSeo.description,
  openGraph: {
    title: siteSeo.ogTitle,
    description: siteSeo.ogDescription,
    images: ["/images/seo-default-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
