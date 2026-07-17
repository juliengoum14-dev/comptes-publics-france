"use client";

import { getSourceInfo } from "@/lib/sourceMeta";

interface SourceTooltipProps {
  active?: boolean;
  payload?: readonly { value?: unknown; name?: unknown; dataKey?: unknown; color?: unknown }[];
  label?: string | number;
  source: string;
  formatValue?: (v: number, name?: string, dataKey?: string) => string;
  extraContent?: React.ReactNode;
}

export default function SourceTooltip({
  active,
  payload,
  label,
  source,
  formatValue,
  extraContent,
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
            style={{ color: (entry.color as string | undefined) ?? "#374151" }}
          >
            {String(entry.name ?? entry.dataKey ?? "")}: {fmt(typeof entry.value === 'number' ? entry.value : 0, String(entry.name ?? ""), String(entry.dataKey ?? ""))}
          </p>
        ))}
      </div>
      {extraContent}
      <div className="mt-2 pt-1.5 border-t border-gray-100 text-[11px] text-gray-400 space-y-0.5">
        <p>Source : {info.source}</p>
        {info.url && <p className="truncate">📎 {info.url}</p>}
        {info.methodology && <p>📐 {info.methodology}</p>}
      </div>
    </div>
  );
}
