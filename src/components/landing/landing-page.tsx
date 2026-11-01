import "./landing.css";
import { CodeGeneration } from "./code-generation";
import { Collaboration } from "./collaboration";
import { FeaturesBento } from "./features";
import { FinalCta } from "./final-cta";
import { landingFontClass } from "./fonts";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Marquee } from "./marquee";
import { Navbar } from "./navbar";
import { TechProof } from "./tech-proof";

/**
 * Landing Modelizia — design system isolé (préfixe `mdz-`, scope `.mdz`).
 * Composant serveur : seules les parties interactives sont des composants client.
 */
export function LandingPage() {
  return (
    <div className={`mdz ${landingFontClass}`}>
      <a href="#contenu" className="mdz-skip">Aller au contenu</a>
      <Navbar />
      <main id="contenu">
        <Hero />
        <Marquee />
        <HowItWorks />
        <FeaturesBento />
        <CodeGeneration />
        <Collaboration />
        <TechProof />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
