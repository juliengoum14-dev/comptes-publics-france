const nf = (v: number, digits = 1) =>
  new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

export function formatMd(v: number | null | undefined): string {
  if (v == null) return "N/D";
  return nf(v).format(v) + " Md€";
}

export function formatPct(v: number): string {
  return nf(v).format(v) + "%";
}

export function formatNumber(v: number, decimals = 1): string {
  return nf(v, decimals).format(v);
}

export function formatTooltip(v: number, unite?: string, label?: string): string {
  let base: string;
  if (unite === "% PIB") base = formatPct(v);
  else base = formatNumber(v) + " Md€";
  return label ? `${base} (${label})` : base;
}
