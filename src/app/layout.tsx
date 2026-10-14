import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { GlobalCelebration } from "@/components/canvas/global-celebration";
import { CommandPalette } from "@/components/toolbar/command-palette";
import { Tooltip } from "@base-ui/react/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ArchStudio — Modeler visuel de bases de données",
  description:
    "Modélisez votre base de données visuellement et générez des schémas Prisma et SQL.",
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
          </ToastProvider>
          <GlobalCelebration />
        </Tooltip.Provider>
      </body>
    </html>
  );
}

