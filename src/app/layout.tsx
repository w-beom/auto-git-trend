import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Git Trend",
  description: "Bootstrap for the Auto Git Trend Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
