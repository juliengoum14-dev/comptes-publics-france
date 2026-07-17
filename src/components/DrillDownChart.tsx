"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TreeNode {
  code: string;
  label: string;
  values?: Record<string, number>;
  children?: TreeNode[];
}

const COLORS = [
  "#2563eb", "#7c3aed", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#4f46e5", "#ca8a04",
  "#16a34a", "#9333ea", "#0d9488", "#b91c1c",
  "#1d4ed8", "#a21caf",
];

const SECTOR_LABELS: Record<string, string> = {
  S13: "Total APU",
  S1311: "État (APUC)",
  S1313: "Collectivités (APUL)",
  S1314: "Sécurité sociale (ASSO)",
};

const SECTOR_COLORS: Record<string, string> = {
  S13: "#6366f1",
  S1311: "#8b5cf6",
  S1313: "#a78bfa",
  S1314: "#c4b5fd",
};

import { formatNumber as fmt } from "@/lib/format";
import SourceBadge from "./SourceBadge";
import SourceTooltip from "./SourceTooltip";

interface DrillDownChartProps {
  tree: TreeNode;
  secteurData: Record<string, Record<string, Record<string, number>>>;
  title: string;
  annee?: number;
  source?: string;
  collapsible?: boolean;
  onSelectedChange?: (code: string, label: string, values: Record<string, number>) => void;
}

function flattenLookup(node: TreeNode): Record<string, TreeNode> {
  const map: Record<string, TreeNode> = {};
  function walk(n: TreeNode) {
    map[n.code] = n;
    if (n.children) n.children.forEach(walk);
  }
  walk(node);
  return map;
}

export default function DrillDownChart({
  tree,
  secteurData,
  title,
  annee = 2025,
  source,
  collapsible,
  onSelectedChange,
}: DrillDownChartProps) {
  const [nodeStack, setNodeStack] = useState<TreeNode[]>([tree]);
  const currentNode = nodeStack[nodeStack.length - 1] ?? tree;

  useEffect(() => {
    if (onSelectedChange && currentNode) {
      onSelectedChange(currentNode.code, currentNode.label, currentNode.values ?? {});
    }
  }, [currentNode, onSelectedChange]);

  const [collapsed, setCollapsed] = useState(collapsible !== false);
  const lookup = useMemo(() => flattenLookup(tree), [tree]);

  const items = useMemo(() => {
    if (!currentNode.children) return [];
    const yearStr = String(annee);
    return currentNode.children
      .map((c) => ({
        code: c.code,
        label: c.label,
        montant: c.values?.[yearStr] ?? 0,
        hasChildren: (c.children?.length ?? 0) > 0,
      }))
      .filter((c) => c.montant > 0 || c.code === "DISC")
      .sort((a, b) => b.montant - a.montant);
  }, [currentNode, annee]);

  const handleClick = (code: string) => {
    const child = lookup[code];
    if (child?.children && child.children.length > 0) {
      setNodeStack([...nodeStack, child]);
    }
  };

  const handleBack = () => {
    if (nodeStack.length > 1) {
      setNodeStack(nodeStack.slice(0, -1));
    }
  };

  const handleCrumbClick = (idx: number) => {
    setNodeStack(nodeStack.slice(0, idx + 2));
  };

  const total = items.reduce((s, c) => s + c.montant, 0);

  const sectorBreakdown = useMemo(() => {
    const code = currentNode.code;
    if (code === "TE" || code === "TR" || code === "DISC") return null;
    const secData = secteurData[code];
    if (!secData) return null;
    const yearStr = String(annee);
    const entries = Object.entries(secData)
      .filter(([, years]) => years[yearStr] != null)
      .map(([sec, years]) => ({
        secteur: sec,
        label: SECTOR_LABELS[sec] ?? sec,
        montant: years[yearStr],
      }));
    if (entries.length === 0) return null;
    return entries;
  }, [currentNode, secteurData, annee]);

  const parentVal = nodeStack.length > 1
    ? nodeStack[nodeStack.length - 2].values?.[String(annee)]
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {title} <SourceBadge source={source ?? ""} />
          {collapsible !== false && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-2 align-middle"
            >
              {collapsed ? "▼ Afficher" : "▲ Masquer"}
            </button>
          )}
        </h3>
        {nodeStack.length > 1 && (
          <button
            onClick={handleBack}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Retour
          </button>
        )}
      </div>

      {!collapsed ? (
        <>
          {/* Breadcrumb */}
          {nodeStack.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
              {nodeStack.map((n, i) => (
                <span key={n.code} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300 mx-1">/</span>}
                  {i < nodeStack.length - 1 ? (
                    <button
                      onClick={() => handleCrumbClick(i)}
                      className="hover:text-blue-600"
                    >
                      {n.label}
                    </button>
                  ) : (
                    <span className="text-gray-700 font-medium">{n.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Total */}
          <p className="text-xs text-gray-400 mb-3">
            {currentNode.values?.[String(annee)] != null && (
              <span>Total : {fmt(currentNode.values[String(annee)])} Md€ <SourceBadge source={source ?? ""} /></span>
            )}
            {parentVal != null && (
              <span className="ml-2 text-gray-300">
                | dont détail ci-dessous ({fmt(total)} Md€)
              </span>
            )}
          </p>

          {/* Chart */}
          {items.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, items.length * 40)}>
              <BarChart data={items} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  width={220}
                />
                <Tooltip
                  content={<SourceTooltip source={source ?? ""} formatValue={(v: number) => {
                    const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                    return `${fmt(v)} Md€ (${pct}%)`;
                  }} />}
                  wrapperStyle={{ pointerEvents: "auto" }}
                />
                <Bar
                  dataKey="montant"
                  fill="#2563eb"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(entry: unknown) => {
                    const e = entry as { payload?: { code?: string; hasChildren?: boolean } } | null;
                    const code = e?.payload?.code;
                    if (code && e?.payload?.hasChildren) {
                      handleClick(code);
                    }
                  }}
                >
                  {items.map((entry, idx) => (
                    <Cell
                      key={entry.code}
                      fill={entry.hasChildren ? COLORS[idx % COLORS.length] : "#94a3b8"}
                      className={entry.hasChildren ? "cursor-pointer" : ""}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">
              Aucune sous-catégorie disponible
            </p>
          )}

          {/* Hint */}
          <p className="text-xs text-gray-400 mt-2">
            {currentNode.children?.some((c) => (c.children?.length ?? 0) > 0)
              ? `Cliquez sur une barre colorée pour explorer le détail`
              : currentNode.code === "TE" || currentNode.code === "TR"
                ? `Cliquez sur une barre pour explorer le détail`
                : `Dernier niveau de détail atteint`}
          </p>

          {/* Sector breakdown panel */}
          {sectorBreakdown && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Répartition par sous-secteur ({annee})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {sectorBreakdown.map((s) => {
                  const totalEntry = sectorBreakdown.find((e) => e.secteur === "S13");
                  const totalMontant = totalEntry?.montant ?? 0;
                  const pct =
                    totalMontant > 0
                      ? ((s.montant / totalMontant) * 100).toFixed(1)
                      : "0";
                  return (
                    <div
                      key={s.secteur}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                      <p
                        className="text-lg font-bold mt-1"
                        style={{ color: SECTOR_COLORS[s.secteur] ?? "#6366f1" }}
                      >
                        {fmt(s.montant)} Md€ <SourceBadge source={source ?? ""} />
                      </p>
                      {s.secteur !== "S13" && (
                        <p className="text-xs text-gray-400">{pct}% du total</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {sectorBreakdown.filter((s) => s.secteur !== "S13").length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={sectorBreakdown.filter((s) => s.secteur !== "S13")}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      width={160}
                    />
                    <Tooltip
        content={<SourceTooltip source={source ?? ""} formatValue={(v: number) => `${fmt(v)} Md€`} />}
        wrapperStyle={{ pointerEvents: "auto" }}
    />
                    <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
                      {sectorBreakdown
                        .filter((s) => s.secteur !== "S13")
                        .map((s) => (
                          <Cell
                            key={s.secteur}
                            fill={SECTOR_COLORS[s.secteur] ?? "#6366f1"}
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-400 mt-2">
          Cliquez pour explorer la répartition détaillée
        </p>
      )}
    </div>
  );
}
