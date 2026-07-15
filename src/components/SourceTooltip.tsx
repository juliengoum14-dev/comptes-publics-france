"use client";

import { getSourceInfo } from "@/lib/sourceMeta";

interface SourceTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
  source: string;
  formatValue?: (v: number, name?: string, dataKey?: string) => string;
}

export default function SourceTooltip({
  active,
  payload,
  label,
  source,
  formatValue,
}: SourceTooltipProps) {
  if (!active || !payload?.length) return null;

  const info = getSourceInfo(source);
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
      {label && (
        <p className="font-semibold text-gray-800 mb-1 text-sm">{label}</p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <p
            key={i}
            className="text-sm"
            style={{ color: entry.color ?? "#374151" }}
          >
            {entry.name ?? entry.dataKey}: {fmt(entry.value, entry.name, entry.dataKey)}
          </p>
        ))}
      </div>
      <div className="mt-2 pt-1.5 border-t border-gray-100 text-[11px] text-gray-400 space-y-0.5">
        <p>Source : {info.source}</p>
        {info.url && <p className="truncate">📎 {info.url}</p>}
        {info.methodology && <p>📐 {info.methodology}</p>}
      </div>
    </div>
  );
}
