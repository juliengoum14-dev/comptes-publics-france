"use client";

import type { FinanceurEntry } from "@/types";

interface FinanceurBreakdownProps {
  data: Record<string, FinanceurEntry[]>;
}

const FUNCTION_LABELS: Record<string, string> = {
  GF04: "Affaires économiques",
  GF05: "Protection de l'environnement",
  GF06: "Logement et équipements collectifs",
  GF08: "Loisirs, culture et culte",
  GF09: "Éducation",
};

const COLORS: Record<string, string> = {
  BUDGET_ETAT: "#2563eb",
  ETAT: "#2563eb",
  COLLECTIVITES: "#7c3aed",
  COLLECTIVITES_LOCALES: "#7c3aed",
  ODAC: "#059669",
  AUTRES_APU: "#059669",
};

export default function FinanceurBreakdown({ data }: FinanceurBreakdownProps) {
  const codes = Object.keys(data).sort();
  if (codes.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Ventilation par financeur
      </h3>
      <div className="space-y-5">
        {codes.map((code) => {
          const entries = data[code];
          const total = entries.reduce((s, e) => s + (e.values["2024"] ?? 0), 0);
          const funcLabel = FUNCTION_LABELS[code] ?? code;

          return (
            <div key={code}>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {funcLabel}
                <span className="text-gray-400 font-normal ml-1">
                  ({total.toFixed(1)} Md€)
                </span>
              </p>
              <div className="flex h-6 rounded-md overflow-hidden">
                {entries.map((entry) => {
                  const val = entry.values["2024"] ?? 0;
                  const pct = total > 0 ? (val / total) * 100 : 0;
                  const color = COLORS[entry.financeur] ?? "#6b7280";
                  return pct > 1 ? (
                    <div
                      key={entry.financeur}
                      className="flex items-center justify-center text-[10px] font-medium text-white"
                      style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 15 ? undefined : 0 }}
                    >
                      {pct > 15 ? entry.label : ""}
                    </div>
                  ) : null;
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {entries.map((entry) => {
                  const val = entry.values["2024"] ?? 0;
                  const color = COLORS[entry.financeur] ?? "#6b7280";
                  return (
                    <span key={entry.financeur} className="text-xs text-gray-500">
                      <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: color }} />
                      {entry.label}: {val.toFixed(1)} Md€
                    </span>
                  );
                })}
              </div>
              {entries.some((e) => e.detail.length > 0) && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {entries.map((entry) =>
                    entry.detail.map((d) => (
                      <div key={d.code} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
                        {d.label}: <span className="font-medium text-gray-700">{(d.values["2024"] ?? 0).toFixed(1)} Md€</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
