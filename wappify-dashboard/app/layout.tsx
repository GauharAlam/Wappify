import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Wappify — WhatsApp Growth Platform",
    template: "%s | Wappify",
  },
  description:
    "The all-in-one WhatsApp platform to market, sell products, automate conversations, and build lasting customer relationships.",
  keywords: ["whatsapp", "commerce", "automation", "d2c", "india", "ai"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
