"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMemo } from "react";
import type { CofogFonction } from "@/types";
import SourceBadge from "./SourceBadge";
import SourceTooltip from "./SourceTooltip";

const COFOG_COLORS = [
  "#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed",
  "#db2777", "#0891b2", "#65a30d", "#ca8a04", "#4f46e5",
];

interface CofogBarChartProps {
  fonctions: CofogFonction[]
  totalTcofog: { label: string; donnees: Record<string, number> }
  annee?: number
  source?: string
}

export default function CofogBarChart({
  fonctions,
  totalTcofog,
  annee = 2024,
  source,
}: CofogBarChartProps) {
  const chartData = useMemo(() => {
    return fonctions
      .map((f) => ({
        code: f.code,
        label: f.label,
        montant: f.donnees[annee] ?? 0,
      }))
      .filter((d) => d.montant > 0)
      .sort((a, b) => b.montant - a.montant);
  }, [fonctions, annee]);

  const total = chartData.reduce((s, d) => s + d.montant, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        Dépenses par fonction (COFOG) - {annee}{" "}
        <SourceBadge source={source ?? ""} />
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Total :{" "}
        {new Intl.NumberFormat("fr-FR", {
          style: "decimal",
          maximumFractionDigits: 1,
        }).format(total)}{" "}
        Md€ <SourceBadge source={source ?? ""} />
      </p>
      <ResponsiveContainer
        width="100%"
        height={Math.max(300, chartData.length * 40)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 20, right: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11 }}
            width={220}
          />
          <Tooltip
            content={
              <SourceTooltip
                source={source ?? ""}
                formatValue={(v: number) =>
                  `${new Intl.NumberFormat("fr-FR", {
                    style: "decimal",
                    maximumFractionDigits: 1,
                  }).format(v)} Md€ (${
                    total > 0 ? ((v / total) * 100).toFixed(1) : "0.0"
                  } %)`
                }
              />
            }
            wrapperStyle={{ pointerEvents: "auto" }}
          />
          <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={entry.code}
                fill={COFOG_COLORS[index % COFOG_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-3">
        Source : Eurostat gov_10a_exp — classification COFOG
      </p>
    </div>
  );
}
