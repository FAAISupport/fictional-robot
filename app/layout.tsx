import "@/styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TopNav } from "@/components/marketing/TopNav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "LifeSignal",
  description: "Reliable wellness check-ins and escalation workflows"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
