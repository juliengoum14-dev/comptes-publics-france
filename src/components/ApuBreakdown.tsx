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
import SourceBadge from "./SourceBadge";
import SourceTooltip from "./SourceTooltip";

interface SousSecteurData {
  [secteur: string]: { annee: number; total_depenses: number }[];
}

const LABELS: Record<string, string> = {
  S13: "APU (total)",
  S1311: "APUC (État)",
  S1313: "APUL (Collectivités)",
  S1314: "ASSO (Sécurité sociale)",
};

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

export default function ApuBreakdown({
  data,
  title,
  source,
}: {
  data: SousSecteurData;
  title: string;
  source?: string;
}) {
  const chartData = useMemo(() => {
    const years = new Set<number>();
    for (const entries of Object.values(data)) {
      entries.forEach((e) => years.add(e.annee));
    }
    return Array.from(years)
      .filter((y) => y >= 2000)
      .sort((a, b) => a - b)
      .map((annee) => {
        const point: Record<string, number | string> = { annee };
        for (const [key, entries] of Object.entries(data)) {
          const entry = entries.find((e) => e.annee === annee);
          if (entry) {
            point[key] = entry.total_depenses;
          }
        }
        return point;
      });
  }, [data]);

  const sectors = Object.keys(data);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {title} <SourceBadge source={source ?? ""} />
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="annee"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => String(v)}
          />
          <YAxis tick={{ fontSize: 12 }} width={70} />
          <Tooltip
            content={<SourceTooltip source={source ?? ""} formatValue={(v: number) =>
              new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 1 }).format(v) + " Md€"
            } />}
            wrapperStyle={{ pointerEvents: "none" }}
          />
          <Legend />
          {sectors.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={LABELS[key] ?? key}
              fill={COLORS[i % COLORS.length]}
              stackId="apu"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
