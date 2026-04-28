import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadence",
  description: "Personal learning coach — Sprint backbone 기반 daily card",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ko">
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
