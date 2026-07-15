import { getSourceInfo } from "@/lib/sourceMeta";

export function abbreviateSource(s: string): string {
  const hasInsee = s.includes("INSEE");
  const hasEurostat = s.includes("Eurostat");
  const hasEco = s.includes("economie.gouv.fr");
  const hasDirBudget = s.includes("Direction du Budget");
  const hasDatagouv = s.includes("data.gouv.fr");

  if (hasInsee && hasEurostat) return "(INSEE+Eurostat)";
  if (hasEco && hasDirBudget) return "(éco.gouv.fr)";
  if (hasInsee) return "(INSEE)";
  if (hasEurostat) return "(Eurostat)";
  if (hasEco) return "(éco.gouv.fr)";
  if (hasDatagouv) return "(data.gouv.fr)";

  const short = s.split(/[,;]/)[0].trim();
  return short.length > 25 ? `(${short.slice(0, 22)}…)` : `(${short})`;
}

export default function SourceBadge({ source }: { source: string }) {
  if (!source) return null;
  const info = getSourceInfo(source);
  const tooltip = [info.source, info.url && `📎 ${info.url}`, info.methodology && `📐 ${info.methodology}`]
    .filter(Boolean)
    .join("\n");
  return (
    <span className="text-[11px] text-gray-400 italic" title={tooltip}>
      {abbreviateSource(source)}
    </span>
  );
}
