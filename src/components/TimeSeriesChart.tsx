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
  ReferenceLine,
} from "recharts";
import { useMemo, Fragment } from "react";
import { formatTooltip } from "@/lib/format";
import SourceBadge from "./SourceBadge";
import SourceTooltip from "./SourceTooltip";

interface SeriesMap {
  [name: string]: { code: string; unite: string; donnees: Record<string, number> };
}

export default function TimeSeriesChart({
  series,
  selected,
  title,
  source,
  projections,
}: {
  series: SeriesMap;
  selected: string[];
  title: string;
  source?: string;
  projections?: Record<string, { annee: number; valeur: number }[]>;
}) {
  const premiereAnneeProjection = useMemo(() => {
    let min: number | null = null;
    for (const name of selected) {
      const proj = projections?.[name];
      if (proj) {
        for (const p of proj) {
          if (min === null || p.annee < min) min = p.annee;
        }
      }
    }
    return min;
  }, [selected, projections]);

  const chartData = useMemo(() => {
    const years = new Set<number>();
    for (const name of selected) {
      const s = series[name];
      if (s) Object.keys(s.donnees).forEach((y) => years.add(Number(y)));
      const proj = projections?.[name];
      if (proj) proj.forEach((p) => years.add(p.annee));
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
          const proj = projections?.[name];
          if (proj && premiereAnneeProjection !== null && annee >= premiereAnneeProjection) {
            const found = proj.find((p) => p.annee === annee);
            if (found) point[name + "__projection"] = found.valeur;
          }
        }
        return point;
      });
  }, [series, selected, projections, premiereAnneeProjection]);

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
            content={<SourceTooltip source={source ?? ""} formatValue={(v: number, _name?: string, dataKey?: string) => {
              const cleanKey = dataKey?.replace("__projection", "");
              const s = cleanKey ? series[cleanKey] : undefined;
              const label = dataKey?.includes("__projection") ? "Projection" : undefined;
              return formatTooltip(v, s?.unite, label);
            }} />}
            wrapperStyle={{ pointerEvents: "none" }}
          />
          <Legend />
          {premiereAnneeProjection !== null && (
            <ReferenceLine
              x={premiereAnneeProjection - 0.5}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Projections",
                position: "top",
                fill: "#94a3b8",
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}
          {selected.map((name, i) => {
            const s = series[name];
            if (!s) return null;
            const unitLabel = s.unite === "% PIB" ? s.unite : "Md€";
            const hasProjection = projections?.[name] && projections[name].length > 0;
            return (
              <Fragment key={name}>
                <Line
                  type="monotone"
                  dataKey={name}
                  name={`${name} (${unitLabel})`}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                {hasProjection && (
                  <Line
                    type="monotone"
                    dataKey={name + "__projection"}
                    name={`${name} (projection)`}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    opacity={0.6}
                    dot={false}
                    connectNulls
                  />
                )}
              </Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
