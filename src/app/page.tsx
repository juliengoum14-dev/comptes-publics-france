import { getAllData } from "@/lib/data";
import { formatMd } from "@/lib/format";
import SummaryCards from "@/components/SummaryCards";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import ApuBreakdown from "@/components/ApuBreakdown";
import DrillDownChart from "@/components/DrillDownChart";
import RevenueBreakdown from "@/components/RevenueBreakdown";
import SourceBadge from "@/components/SourceBadge";

export default function Home() {
  const { synthese, recettes, apu, series, budgetEtat, arbreNature, natureParSecteur, projections } = getAllData();

  const etat2025 = budgetEtat.synthese_etat["2025"];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Comptes Publics France</h1>
          <p className="text-gray-500 mt-1">
            Recettes et dépenses publiques en France
          </p>
        </header>

        {/* APU Summary Cards + Evolution */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">
          Vue d&apos;ensemble APU
        </h2>
        <SummaryCards data={synthese.donnees_cles_2025} source={synthese.meta.source as string} />

        <div className="mt-8">
          <TimeSeriesChart
            series={series.series}
            selected={["Recettes APU", "Dépenses APU"]}
            title="Évolution des recettes et dépenses APU (Md€)"
            source={series.meta.source as string}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DrillDownChart
            tree={arbreNature.recettes}
            secteurData={natureParSecteur.data}
            title="Recettes APU"
            annee={2025}
            source={arbreNature.meta.source as string}
          />
          <DrillDownChart
            tree={arbreNature.depenses}
            secteurData={natureParSecteur.data}
            title="Dépenses APU"
            annee={2025}
            source={arbreNature.meta.source as string}
          />
        </div>

        <div className="mt-8">
          <ApuBreakdown
            data={apu.depenses_par_sous_secteur_eurostat}
            title="Dépenses APU par sous-secteur (Md€ empilés)"
            source={apu.meta.source as string}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimeSeriesChart
            series={series.series}
            selected={["Dette publique (Maastricht)", "PIB"]}
            title="Dette publique et PIB (Md€)"
            source={series.meta.source as string}
          />
          <TimeSeriesChart
            series={series.series}
            selected={["Dépenses APU (% PIB)", "Recettes APU (% PIB)"]}
            title="Taux de prélèvement et dépense publique (% PIB)"
            source={series.meta.source as string}
          />
        </div>

        {/* Projections du rapport Ragot */}
        <section className="mb-8 mt-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Projections — Rapport Ragot <SourceBadge source="Rapport Ragot/Tavernier/Jaravel/Valla - juillet 2026" />
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Scénario à politique inchangée — la dette pourrait atteindre 130,5% du PIB en 2030
          </p>
          <TimeSeriesChart
            series={series.series}
            selected={["Dette publique (% PIB)", "Déficit (% PIB)"]}
            title="Dette et déficit public (% PIB) — projection 2026-2030"
            source={series.meta.source as string}
            projections={projections.projections}
          />
        </section>

        {/* Deux périmètres côte à côte */}
        <section className="mb-8 mt-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Solde 2025 — Comparaison État vs APU
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">
                Budget de l&apos;État (comptabilité budgétaire)
              </p>
              <p className="text-lg font-bold text-blue-800 mt-2">
                Solde : {formatMd(etat2025.solde_budgetaire_meur)} <SourceBadge source={budgetEtat.meta.source as string} />
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Recettes nettes BG : {formatMd(etat2025.recettes_nettes_bg_meur)} <SourceBadge source={budgetEtat.meta.source as string} />
              </p>
              <div className="mt-2 text-xs text-blue-500 space-y-1">
                <p>✓ Amélioration de {formatMd(etat2025.amélioration_vs_2024_meur)} <SourceBadge source={budgetEtat.meta.source as string} /> vs 2024</p>
                <p>✓ Amélioration de {formatMd(etat2025.amélioration_vs_lfg_meur)} <SourceBadge source={budgetEtat.meta.source as string} /> vs prévision LFG</p>
                <p>✓ Amélioration de {formatMd(etat2025.amélioration_vs_lfi_meur)} <SourceBadge source={budgetEtat.meta.source as string} /> vs LFI 2025</p>
              </div>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">
                APU (Administrations Publiques — comptabilité nationale)
              </p>
              <p className="text-lg font-bold text-purple-800 mt-2">
                Solde : {formatMd(synthese.donnees_cles_2025.solde)} <SourceBadge source={synthese.meta.source as string} />
              </p>
              <p className="text-sm text-purple-600 mt-1">
                Recettes APU : {formatMd(synthese.donnees_cles_2025.recettes)} <SourceBadge source={synthese.meta.source as string} /> | Dépenses : {formatMd(synthese.donnees_cles_2025.depenses)} <SourceBadge source={synthese.meta.source as string} />
              </p>
              <div className="mt-2 text-xs text-purple-500 space-y-1">
                <p>Périmètre : État (APUC) + Sécurité sociale (ASSO) + Collectivités (APUL)</p>
                <p>Norme SEC 2010 — données APU consolidées</p>
              </div>
            </div>
          </div>
        </section>

        {/* Détail des recettes de l'État */}
        <section className="mb-8 mt-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Détail des recettes de l&apos;État (2025)
          </h2>
          <RevenueBreakdown
            categories={recettes.recettes_par_categorie}
            annee={2025}
            title="Recettes fiscales et sociales"
            source={recettes.meta.source as string}
          />
        </section>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Sources : INSEE, Eurostat, Direction du Budget, data.economie.gouv.fr, economie.gouv.fr</p>
          <p className="mt-1">APU = comptes nationaux base 2020 (SEC 2010) | État = comptabilité budgétaire</p>
          <p className="mt-1">Généré le {new Date().toLocaleDateString("fr-FR")}</p>
        </footer>
      </div>
    </main>
  );
}
