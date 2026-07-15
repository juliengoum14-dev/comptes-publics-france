"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { formatTooltip } from "@/lib/format";
import SourceBadge from "./SourceBadge";

interface SeriesMap {
  [name: string]: { code: string; unite: string; donnees: Record<string, number> };
}

export default function TimeSeriesChart({
  series,
  selected,
  title,
  source,
}: {
  series: SeriesMap;
  selected: string[];
  title: string;
  source?: string;
}) {
  const chartData = useMemo(() => {
    const years = new Set<number>();
    for (const name of selected) {
      const s = series[name];
      if (s) Object.keys(s.donnees).forEach((y) => years.add(Number(y)));
    }
    return Array.from(years)
      .sort((a, b) => a - b)
      .map((annee) => {
        const point: Record<string, number | string> = { annee };
        for (const name of selected) {
          const s = series[name];
          if (s && s.donnees[String(annee)] !== undefined) {
            point[name] = s.donnees[String(annee)];
          }
        }
        return point;
      });
  }, [series, selected]);

  const colors = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#f59e0b"];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {title} <SourceBadge source={source ?? ""} />
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="annee"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => String(v)}
          />
          <YAxis tick={{ fontSize: 12 }} width={70} />
          <Tooltip
            formatter={(value, name) => {
              const s = series[String(name)];
              return `${formatTooltip(Number(value), s?.unite)} — ${source ?? ""}`;
            }}
          />
          <Legend />
          {selected.map((name, i) => {
            const s = series[name];
            if (!s) return null;
            const unitLabel = s.unite === "% PIB" ? s.unite : "Md€";
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={`${name} (${unitLabel})`}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
