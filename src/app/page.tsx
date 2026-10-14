import { BentoGrid } from "@/components/landing/bento-grid";
import { CanvasPreview } from "@/components/landing/canvas-preview";
import { CodePreview } from "@/components/landing/code-preview";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { HealthScoreSection } from "@/components/landing/health-score-section";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/landing-nav";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-10%,theme(colors.indigo.100/0.7),transparent),radial-gradient(40rem_30rem_at_90%_10%,theme(colors.sky.100/0.6),transparent),radial-gradient(40rem_30rem_at_10%_30%,theme(colors.fuchsia.100/0.5),transparent)]" />
      <LandingNav />
      <main>
        <Hero />
        <CanvasPreview />
        <BentoGrid />
        <HealthScoreSection />
        <CodePreview />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
