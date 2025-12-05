import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { ConditionalFooter } from "@/components/conditional-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Canvas - No-Code Agent Builder Platform",
  description: "Build and deploy AI agents with our no-code agent builder platform. Create custom agents, deploy to Cloudflare Workers, and manage your agent workflows.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "Agent Canvas - No-Code Agent Builder Platform",
    description: "Build and deploy AI agents with our no-code agent builder platform.",
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary',
    title: "Agent Canvas - No-Code Agent Builder Platform",
    description: "Build and deploy AI agents with our no-code agent builder platform.",
    images: ['/logo.png'],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
