import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Observatory | Personal Command Center",
  description: "Mission Control for Jakob's life — tasks, fitness, finance, and research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 overflow-auto pt-16 lg:pt-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
