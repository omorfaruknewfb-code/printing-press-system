import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Al-Ihsan Printing Press",
  description: "Printing Press Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-gray-50 font-sans text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
