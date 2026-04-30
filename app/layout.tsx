import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FlightDesk · CS 425 Airline Booking",
    template: "%s · FlightDesk",
  },
  description:
    "CS 425 database course project — airline flight booking demo (mock data).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <SiteHeader />
        <main className="flex-1">
          <ContentContainer>{children}</ContentContainer>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
