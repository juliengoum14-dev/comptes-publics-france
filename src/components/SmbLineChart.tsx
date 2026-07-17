"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useMemo } from "react";
import SourceBadge from "./SourceBadge";
import SourceTooltip from "./SourceTooltip";

const MONTHS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jui",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

interface SmbCumulEntry {
  mois: number;
  ae_cumul_meur: number;
  cp_cumul_meur: number;
}

interface SmbLineChartProps {
  cumul: SmbCumulEntry[];
  totalLfiAe: number;
  totalLfiCp: number;
  source?: string;
}

export default function SmbLineChart({
  cumul,
  totalLfiAe,
  totalLfiCp,
  source,
}: SmbLineChartProps) {
  const chartData = useMemo(
    () =>
      cumul
        .filter((e) => e.mois >= 1 && e.mois <= 12)
        .map((e) => ({
          mois: MONTHS[e.mois - 1],
          ae: Math.round(e.ae_cumul_meur * 10) / 10,
          cp: Math.round(e.cp_cumul_meur * 10) / 10,
        })),
    [cumul],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Exécution budgétaire mensuelle 2025 — cumul (engagements/paiements){" "}
        <SourceBadge source={source ?? ""} />
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={70} />
          <Tooltip
            content={
              <SourceTooltip
                source={source ?? ""}
                formatValue={(v: number) => `${v} Md€`}
              />
            }
            wrapperStyle={{ pointerEvents: "auto" }}
          />
          <Legend />
          <ReferenceLine
            y={totalLfiAe}
            stroke="#2563eb"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `LFI engagements ${totalLfiAe} Md€`,
              position: "right",
              fill: "#2563eb",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <ReferenceLine
            y={totalLfiCp}
            stroke="#d97706"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `LFI paiements ${totalLfiCp} Md€`,
              position: "right",
              fill: "#d97706",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <Line
            type="monotone"
            dataKey="ae"
            name="Engagements (AE)"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="cp"
            name="Paiements (CP)"
            stroke="#d97706"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-3 text-[11px] text-gray-400">
        Source : data.economie.gouv.fr — SMB
      </p>
    </div>
  );
}
