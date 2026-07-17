"use client";

import { useState, useMemo } from "react";
import DrillDownChart from "./DrillDownChart";
import TimeSeriesChart from "./TimeSeriesChart";
import FinanceurBreakdown from "./FinanceurBreakdown";
import type { TreeNode, FinanceurEntry } from "@/types";

interface CofogSectionProps {
  tree: TreeNode;
  source: string;
  anneesDisponibles: string[];
  financeurs?: Record<string, FinanceurEntry[]>;
}

export default function CofogSection({ tree, source, anneesDisponibles, financeurs }: CofogSectionProps) {
  const [annee, setAnnee] = useState(2025);
  const [selectedCode, setSelectedCode] = useState("TOTAL");
  const [selectedLabel, setSelectedLabel] = useState("Total");
  const [selectedValues, setSelectedValues] = useState<Record<string, number>>({});

  const series = useMemo(() => {
    const s: Record<string, { code: string; unite: string; donnees: Record<string, number> }> = {};
    if (selectedCode && Object.keys(selectedValues).length > 0) {
      s[selectedCode] = { code: selectedCode, unite: "Md€", donnees: selectedValues };
    }
    return s;
  }, [selectedCode, selectedValues]);

  const handleSelectedChange = (code: string, label: string, values: Record<string, number>) => {
    setSelectedCode(code);
    setSelectedLabel(label);
    setSelectedValues(values);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Dépenses par fonction (COFOG)
          {annee === 2025 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Estimé
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="cofog-year" className="text-gray-500">Année :</label>
          <select
            id="cofog-year"
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {anneesDisponibles.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DrillDownChart
          tree={tree}
          secteurData={{}}
          title=""
          annee={annee}
          source={source}
          collapsible={false}
          onSelectedChange={handleSelectedChange}
        />
        {selectedCode && Object.keys(selectedValues).length > 0 ? (
          <TimeSeriesChart
            series={series}
            selected={[selectedCode]}
            title={`Évolution — ${selectedLabel}`}
            source={source}
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-center">
            <p className="text-sm text-gray-400">
              Cliquez sur une fonction colorée dans le graphique pour explorer ses sous-fonctions
            </p>
          </div>
        )}
      </div>
      {false && <div className="mt-8" />}
    </div>
  );
}
