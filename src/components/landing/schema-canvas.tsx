"use client";

import { useState } from "react";
import { HEAD_H, RELATIONS, ROW_H, TABLES, TABLE_W } from "./data";
import { vars } from "./css";

/** Canvas de schéma interactif : survoler une table met ses relations en évidence. */
export function SchemaCanvas({ className }: { className?: string }) {
  const [hover, setHover] = useState<string | null>(null);

  const linked = new Set<string>();
  if (hover) {
    linked.add(hover);
    for (const r of RELATIONS) {
      if (r.from === hover) linked.add(r.to);
      if (r.to === hover) linked.add(r.from);
    }
  }

  return (
    <svg
      viewBox="0 0 820 440"
      className={className}
      role="img"
      aria-label="Aperçu d'un schéma de base de données : users, posts, comments, profiles, post_tags et tags reliés entre eux."
    >
      <g className="mdz-edges" fill="none" strokeLinecap="round">
        {RELATIONS.map((r, i) => {
          const on = hover === r.from || hover === r.to;
          return (
            <g key={r.id} className={`mdz-edge ${on ? "is-on" : ""} ${hover && !on ? "is-dim" : ""}`}>
              <path d={r.d} pathLength={1} className="mdz-edge__draw" style={vars({ "--d": `${0.9 + i * 0.15}s` })} />
              <path d={r.d} className="mdz-edge__flow" />
              <circle cx={r.fk[0]} cy={r.fk[1]} r="4.5" className="mdz-dot-fk" />
              <circle cx={r.pk[0]} cy={r.pk[1]} r="4.5" className="mdz-dot-pk" />
            </g>
          );
        })}
      </g>

      {TABLES.map((t, i) => {
        const h = HEAD_H + t.cols.length * ROW_H;
        const dim = hover !== null && !linked.has(t.id);
        return (
          <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
            <g className="mdz-pop" style={vars({ "--d": `${i * 0.11}s` })}>
              <g
                className={`mdz-tbl ${hover === t.id ? "is-on" : ""} ${dim ? "is-dim" : ""}`}
                style={vars({ "--fd": `${i * 0.7}s`, "--fs": `${5 + (i % 3)}s` })}
                onPointerEnter={() => setHover(t.id)}
                onPointerLeave={() => setHover(null)}
              >
                <rect x="4" y="6" width={TABLE_W} height={h} rx="10" className="mdz-tbl__shadow" />
                <rect width={TABLE_W} height={h} rx="10" className="mdz-tbl__body" />
                <rect width={TABLE_W} height={HEAD_H} rx="10" style={{ fill: t.color }} />
                <rect y={HEAD_H - 10} width={TABLE_W} height="10" style={{ fill: t.color }} />
                <text x="14" y="22" className="mdz-svg-title">{t.id}</text>
                {t.cols.map((c, ci) => {
                  const y = HEAD_H + ci * ROW_H;
                  return (
                    <g key={c.name}>
                      {ci > 0 ? <line x1="0" x2={TABLE_W} y1={y} y2={y} className="mdz-tbl__line" /> : null}
                      <text x="14" y={y + 17} className="mdz-svg-col">{c.name}</text>
                      {c.key ? (
                        <g className={c.key === "PK" ? "mdz-key mdz-key--pk" : "mdz-key mdz-key--fk"}>
                          <rect x="108" y={y + 6} width="24" height="14" rx="4" />
                          <text x="120" y={y + 16.5} textAnchor="middle">{c.key}</text>
                        </g>
                      ) : null}
                      <text x={TABLE_W - 14} y={y + 17} textAnchor="end" className="mdz-svg-type">{c.type}</text>
                    </g>
                  );
                })}
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
