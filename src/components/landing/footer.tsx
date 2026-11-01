import Link from "next/link";
import { Logo } from "./primitives";

export function Footer() {
  return (
    <footer className="mdz-footer">
      <div className="mdz-container">
        <div className="mdz-footer__top">
          <div className="mdz-footer__about">
            <Logo />
            <p className="mdz-muted">Modélisez vos bases de données sur un canvas infini, générez le code, collaborez en temps réel.</p>
          </div>

          <nav aria-label="Pied de page" className="mdz-footer__nav">
            <div>
              <span className="mdz-group__label">Produit</span>
              <Link href="/studio">Studio</Link>
              <Link href="/studio/code">Studio de code</Link>
            </div>
            <div>
              <span className="mdz-group__label">Sur cette page</span>
              <a href="#fonctionnalites">Fonctionnalités</a>
              <a href="#code">Génération de code</a>
              <a href="#collaboration">Collaboration</a>
            </div>
          </nav>
        </div>

        <div className="mdz-footer__bottom">
          <p>© {new Date().getFullYear()} Modelizia. Tous droits réservés.</p>
          <p>Construit avec Next.js, GSAP et PartyKit.</p>
        </div>
      </div>
    </footer>
  );
}
