import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const uiSans = Inter({
  variable: "--font-ui-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Graduate-RAG · Literary Growth Companion",
  description: "Diary-powered and book-grounded AI growth companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${uiSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
