import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ArchStudio — Visual Database Modeler",
  description:
    "Model your database visually and generate Prisma schemas and SQL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className="h-dvh overflow-hidden bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

