import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedConnect Pro",
  description: "MVP scaffold for patient engagement"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
