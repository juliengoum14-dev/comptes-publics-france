"use client";

import { useState, useMemo } from "react";
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
import { formatTooltip } from "@/lib/format";
import SourceBadge from "./SourceBadge";
import SourceTooltip from "./SourceTooltip";

interface MissionAnnuelle {
  mission: string
  code_mission: string
  type_mission: string
  ae_meur: number
  cp_meur: number
}

interface MissionsHistoriqueChartProps {
  missionsParAnnee: Record<string, MissionAnnuelle[]>
  source?: string
}

const ANNEES = ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

function getMissionData(
  missionCode: string,
  missionsParAnnee: Record<string, MissionAnnuelle[]>,
): { annee: string; ae: number; cp: number }[] {
  return ANNEES
    .map((annee) => {
      const missions = missionsParAnnee[annee];
      if (!missions) return null;
      const mission = missions.find((m) => m.code_mission === missionCode);
      if (!mission) return null;
      return {
        annee,
        ae: mission.ae_meur,
        cp: mission.cp_meur,
      };
    })
    .filter((d): d is { annee: string; ae: number; cp: number } => d !== null);
}

export default function MissionsHistoriqueChart({
  missionsParAnnee,
  source = "data.economie.gouv.fr",
}: MissionsHistoriqueChartProps) {
  const missionsRecentes = missionsParAnnee["2025"] ?? missionsParAnnee[Object.keys(missionsParAnnee)[0]] ?? [];

  const missionsList = useMemo(() => {
    const seen = new Set<string>();
    return missionsRecentes
      .filter((m) => {
        if (seen.has(m.code_mission)) return false;
        seen.add(m.code_mission);
        return true;
      })
      .sort((a, b) => a.mission.localeCompare(b.mission));
  }, [missionsRecentes]);

  const defautCode = missionsList.find((m) => m.mission === "Défense")?.code_mission ?? missionsList[0]?.code_mission ?? "";

  const [selectedCode, setSelectedCode] = useState(defautCode);

  const chartData = useMemo(
    () => getMissionData(selectedCode, missionsParAnnee),
    [selectedCode, missionsParAnnee],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Évolution des crédits par mission <SourceBadge source={source} />
        </h3>
        <select
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {missionsList.map((m) => (
            <option key={m.code_mission} value={m.code_mission}>
              {m.mission}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="annee" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={70}
            tickFormatter={(v: number) => `${v} Md€`}
          />
          <Tooltip
            content={<SourceTooltip source={source} formatValue={(v: number) => `${v.toFixed(1)} Md€`} />}
            wrapperStyle={{ pointerEvents: "auto" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="ae"
            name="AE"
            stroke="#2563eb"
            strokeWidth={2}
            dot
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="cp"
            name="CP"
            stroke="#d97706"
            strokeWidth={2}
            dot
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400 mt-3">
        Source : data.economie.gouv.fr — PLF 2017-2025
      </p>
    </div>
  );
}
