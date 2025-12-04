import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fin-AI",
  description: "Finance management powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
