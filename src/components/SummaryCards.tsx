import type { DonneesCles } from "@/types";
import { formatMd, formatPct } from "@/lib/format";
import SourceBadge from "./SourceBadge";

export default function SummaryCards({ data, source }: { data: DonneesCles; source?: string }) {
  const cards = [
    {
      label: "Recettes",
      value: formatMd(data.recettes),
      sub: formatPct(data.recettes_pct_pib) + " du PIB",
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      label: "Dépenses",
      value: formatMd(data.depenses),
      sub: formatPct(data.depenses_pct_pib) + " du PIB",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    {
      label: "Solde",
      value: formatMd(data.solde),
      sub: data.solde < 0 ? "Déficit" : "Excédent",
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    {
      label: "Dette publique",
      value: formatMd(data.dette),
      sub: formatPct(data.dette_pct_pib) + " du PIB",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.color}`}>
            {c.value} <SourceBadge source={source ?? ""} />
          </p>
          <p className="text-xs text-gray-400 mt-1">{c.sub} <SourceBadge source={source ?? ""} /></p>
        </div>
      ))}
    </div>
  );
}
