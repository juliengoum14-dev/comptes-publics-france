"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";
import SourceTooltip from "./SourceTooltip";

interface FinanceurEntry {
  financeur: string;
  label: string;
  values: Record<string, number>;
  detail: { code: string; label: string; values: Record<string, number> }[];
}

interface FinanceurBreakdownProps {
  data: Record<string, FinanceurEntry[]>;
  selectedCode?: string;
  annee?: number;
}

const FUNCTION_LABELS: Record<string, string> = {
  GF01: "Services généraux",
  GF02: "Défense",
  GF03: "Ordre et sécurité",
  GF04: "Affaires économiques",
  GF05: "Environnement",
  GF06: "Logement",
  GF07: "Santé",
  GF08: "Loisirs, culture",
  GF09: "Éducation",
  GF10: "Protection sociale",
};

const FINANCEUR_LABELS: Record<string, string> = {
  ETAT: "État",
  COLLECTIVITES: "Collectivités",
  ODAC: "Autres APU",
  SECU: "Sécurité sociale",
};

const FINANCEUR_COLORS: Record<string, string> = {
  ETAT: "#2563eb",
  COLLECTIVITES: "#7c3aed",
  ODAC: "#059669",
  SECU: "#dc2626",
};

function getFunctionCode(code: string): string | null {
  const match = code.match(/^(GF\d{2})/);
  return match ? match[1] : null;
}

export default function FinanceurBreakdown({
  data,
  selectedCode = "TOTAL",
  annee = 2024,
}: FinanceurBreakdownProps) {
  const funcCode = getFunctionCode(selectedCode);
  const hasFunc = funcCode && data[funcCode];

  const allFinanceurKeys = useMemo(() => {
    const keys = new Set<string>();
    const codes = funcCode && hasFunc ? [funcCode] : Object.keys(data);
    for (const code of codes) {
      for (const entry of data[code] ?? []) {
        const key = entry.financeur === "BUDGET_ETAT" ? "ETAT" : entry.financeur;
        keys.add(key);
      }
    }
    return ["ETAT", "SECU", "COLLECTIVITES", "ODAC"].filter((k) => keys.has(k));
  }, [data, funcCode, hasFunc]);

  const chartData = useMemo(() => {
    const codes = funcCode && hasFunc ? [funcCode] : Object.keys(data).sort();
    return codes.map((code) => {
      const entries = data[code] ?? [];
      const point: Record<string, string | number> = {
        fonction: FUNCTION_LABELS[code] ?? code,
      };
      for (const key of allFinanceurKeys) {
        const entry = entries.find(
          (e) => (e.financeur === "BUDGET_ETAT" ? "ETAT" : e.financeur) === key
        );
        point[key] = entry?.values[String(annee)] ?? 0;
      }
      return point;
    });
  }, [data, annee, funcCode, hasFunc, allFinanceurKeys]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Ventilation par financeur
        </h3>
        <p className="text-sm text-gray-400 text-center py-8">
          Aucune donnée de ventilation par financeur disponible pour cette fonction
        </p>
      </div>
    );
  }

  const title = funcCode && hasFunc
    ? `Ventilation par financeur — ${FUNCTION_LABELS[funcCode] ?? funcCode}`
    : "Ventilation par financeur";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={chartData.length > 1 ? 300 : 80}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          {chartData.length > 1 && (
            <YAxis
              type="category"
              dataKey="fonction"
              tick={{ fontSize: 12 }}
              width={130}
            />
          )}
          <Tooltip
            content={
              <SourceTooltip
                source="Budget PLF + DEPP + DREES"
                formatValue={(v: number) => `${v.toFixed(1)} Md€`}
              />
            }
            wrapperStyle={{ pointerEvents: "none" }}
          />
          {chartData.length > 1 && <Legend />}
          {allFinanceurKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              name={FINANCEUR_LABELS[key] ?? key}
              fill={FINANCEUR_COLORS[key] ?? "#6b7280"}
              stackId="financeur"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
