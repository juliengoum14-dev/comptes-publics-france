"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import type { SerieRecette } from "@/types";
import SourceBadge from "./SourceBadge";
import { getSourceInfo } from "@/lib/sourceMeta";

export default function RevenueBreakdown({
  categories,
  annee,
  title,
  formatValue,
  source,
}: {
  categories: SerieRecette[];
  annee: number;
  title: string;
  formatValue?: (v: number) => string;
  source?: string;
}) {
  const chartData = useMemo(() => {
    return categories
      .map((c) => {
        const point = c.donnees.find((d) => d.annee === annee);
        return { name: c.categorie, montant: point?.montant ?? 0 };
      })
      .filter((d) => d.montant > 0)
      .sort((a, b) => b.montant - a.montant);
  }, [categories, annee]);

  const fmt = formatValue ?? ((v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(v) + " Md€");

  const total = chartData.reduce((s, d) => s + d.montant, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        {title} ({annee}) <SourceBadge source={source ?? ""} />
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Total : {new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 1 }).format(total)} Md€ <SourceBadge source={source ?? ""} />
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={180}
          />
          <Tooltip
            formatter={(value) => {
              const info = getSourceInfo(source ?? "");
              return `${fmt(Number(value))}\nSource: ${info.source}\n${info.url ? `📎 ${info.url}` : ""}\n${info.methodology ? `📐 ${info.methodology}` : ""}`;
            }}
          />
          <Bar dataKey="montant" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
