import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Modelizia — Dessinez votre base de données, le code suit",
  description:
    "Canvas infini pour modéliser vos tables et relations, puis générer SQL, Prisma, TypeScript et Zod. Collaboration en temps réel.",
};

export default function Page() {
  return <LandingPage />;
}
