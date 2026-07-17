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
  annee?: number;
}

const FUNCTION_LABELS: Record<string, string> = {
  GF04: "Affaires économiques",
  GF05: "Environnement",
  GF06: "Logement",
  GF08: "Loisirs, culture",
  GF09: "Éducation",
};

const FINANCEUR_KEYS = ["ETAT", "COLLECTIVITES", "ODAC"];

const FINANCEUR_LABELS: Record<string, string> = {
  ETAT: "État",
  COLLECTIVITES: "Collectivités",
  ODAC: "Autres APU",
};

const FINANCEUR_COLORS: Record<string, string> = {
  ETAT: "#2563eb",
  COLLECTIVITES: "#7c3aed",
  ODAC: "#059669",
};

export default function FinanceurBreakdown({ data, annee = 2024 }: FinanceurBreakdownProps) {
  const codes = Object.keys(data).sort();
  if (codes.length === 0) return null;

  const chartData = useMemo(() => {
    return codes.map((code) => {
      const entries = data[code];
      const point: Record<string, string | number> = { fonction: FUNCTION_LABELS[code] ?? code };
      for (const key of FINANCEUR_KEYS) {
        const entry = entries.find((e) => e.financeur === key || e.financeur === `BUDGET_${key}`);
        point[key] = entry?.values[String(annee)] ?? 0;
      }
      return point;
    });
  }, [data, annee, codes]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Ventilation par financeur
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="fonction"
            tick={{ fontSize: 12 }}
            width={130}
          />
          <Tooltip
            content={
              <SourceTooltip
                source="Budget PLF + DEPP"
                formatValue={(v: number) => `${v.toFixed(1)} Md€`}
              />
            }
            wrapperStyle={{ pointerEvents: "none" }}
          />
          <Legend />
          {FINANCEUR_KEYS.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              name={FINANCEUR_LABELS[key]}
              fill={FINANCEUR_COLORS[key]}
              stackId="financeur"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
