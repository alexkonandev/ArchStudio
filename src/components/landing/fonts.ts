import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

/** Polices propres à la landing (indépendantes du studio). */
const sans = Geist({ subsets: ["latin"], variable: "--mdz-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--mdz-mono", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--mdz-serif",
  display: "swap",
});

export const landingFontClass = `${sans.variable} ${mono.variable} ${serif.variable}`;
