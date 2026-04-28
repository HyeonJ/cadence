import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Cadence",
  description: "Personal learning coach",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="ko">
      <body className="bg-bg text-ink antialiased font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
