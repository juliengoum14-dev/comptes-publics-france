"use client";

import { useState } from "react";
import DrillDownChart from "./DrillDownChart";
import type { TreeNode } from "@/types";

interface CofogSectionProps {
  tree: TreeNode;
  source: string;
  anneesDisponibles: string[];
}

export default function CofogSection({ tree, source, anneesDisponibles }: CofogSectionProps) {
  const [annee, setAnnee] = useState(2024);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Dépenses par fonction (COFOG)
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
        />
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-center">
          <p className="text-sm text-gray-400">
            Cliquez sur une fonction colorée dans le graphique pour explorer ses sous-fonctions
          </p>
        </div>
      </div>
    </div>
  );
}
