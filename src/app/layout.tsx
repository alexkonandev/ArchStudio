import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { GlobalCelebration } from "@/components/canvas/global-celebration";
import { RejectionProbe } from "@/components/dev/rejection-probe";
import { CommandPalette } from "@/components/toolbar/command-palette";
import { Tooltip } from "@base-ui/react/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Modelizia — L'art de concevoir vos bases de données",
  description:
    "Modélisez votre base de données visuellement et générez des schémas Prisma et SQL.",
  openGraph: {
    title: "Modelizia — L'art de concevoir vos bases de données",
    description:
      "Modélisez votre base de données visuellement et générez des schémas Prisma et SQL.",
    siteName: "Modelizia",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Tooltip.Provider>
          <ToastProvider>
            {children}
            <CommandPalette />
            <RejectionProbe />
          </ToastProvider>
          <GlobalCelebration />
        </Tooltip.Provider>
      </body>
    </html>
  );
}

