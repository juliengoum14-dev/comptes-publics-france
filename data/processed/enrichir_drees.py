#!/usr/bin/env python3
"""Enrichir l'arbre COFOG avec les séries temporelles 2020-2023 des régimes DREES."""

import json
import urllib.request
import urllib.parse
import time
import sys

API_BASE = "https://data.drees.solidarites-sante.gouv.fr/api/explore/v2.1/catalog/datasets/305_les-comptes-de-la-protection-sociale/records"

YEARS = [2020, 2021, 2022, 2023]

COFOG_PARENTS = {
    "GF07": {
        "where_extra": 'risque="SANTÉ"',
        "take_shortest_pscode": True,
    },
    "GF1001": {
        "where_extra": 'risque="SANTÉ" AND ps_code="E11-12"',
        "take_shortest_pscode": False,
    },
    "GF1002": {
        "where_extra": 'risque="VIEILLESSE-SURVIE" AND ps_code="E11-21"',
        "take_shortest_pscode": False,
    },
    "GF1003": {
        "where_extra": 'risque="VIEILLESSE-SURVIE" AND ps_code="E11-22"',
        "take_shortest_pscode": False,
    },
    "GF1004": {
        "where_extra": 'risque="FAMILLE"',
        "take_shortest_pscode": True,
    },
    "GF1005": {
        "where_extra": 'risque="EMPLOI"',
        "take_shortest_pscode": True,
    },
    "GF1006": {
        "where_extra": 'risque="LOGEMENT"',
        "take_shortest_pscode": True,
    },
}

# Exact regime names from API (with correct Unicode characters)
# Using escaped strings to ensure correctness
RSQ = "\u2019"  # Right single quotation mark used by API

REGIME_MAPPING = {
    "GF07": {
        f"Caisse nationale d{RSQ}assurance maladie": "CPAM",
        "R\u00e9gime d'intervention sociale des h\u00f4pitaux publics": "HOPITAUX",
        "R\u00e9gime d'intervention sociale des institutions sans but lucratif au service des m\u00e9nages": "ISBL",
        "Caisse nationale de solidarit\u00e9 pour l'autonomie": "CNSA",
        "R\u00e9gime d'intervention sociale de l'\u00c9tat": "ETAT",
        "Entreprises d'assurance - contrats collectifs": "ASSURANCES",
        "Institutions de pr\u00e9voyance - contrats collectifs": "PREVOYANCE",
    },
    "GF1001": {
        "R\u00e9gime d'intervention sociale des institutions sans but lucratif au service des m\u00e9nages": "ISBL",
        "R\u00e9gime d'intervention sociale de l'\u00c9tat": "ETAT",
        f"Caisse nationale d{RSQ}assurance maladie": "CPAM",
        "R\u00e9gime d'intervention sociale des d\u00e9partements": "DEPARTEMENTS",
        "Caisse nationale de solidarit\u00e9 pour l'autonomie": "CNSA",
        "Institutions de pr\u00e9voyance - contrats collectifs": "PREVOYANCE",
    },
    "GF1002": {
        f"Caisse nationale d{RSQ}assurance vieillesse": "CNAV",
        "Association g\u00e9n\u00e9rale des institutions de retraite des cadres et association des r\u00e9gimes de retraite compl\u00e9mentaire des salari\u00e9s": "AGIRC_ARRCO",
        "R\u00e9gimes pour les agents de l'Etat (y compris ex-L)": "FONC_PUB",
        "Autres r\u00e9gimes sp\u00e9ciaux": "REGIMES_SPECIAUX",
        "R\u00e9gime d'intervention sociale des d\u00e9partements": "DEPARTEMENTS",
        "Exploitants agricoles": "MSA_EXPLOITANTS",
        "CNAVPL base complementaire": "CNAVPL",
    },
    "GF1003": {
        f"Caisse nationale d{RSQ}assurance vieillesse": "CNAV",
        "Association g\u00e9n\u00e9rale des institutions de retraite des cadres et association des r\u00e9gimes de retraite compl\u00e9mentaire des salari\u00e9s": "AGIRC_ARRCO",
        "R\u00e9gimes pour les agents de l'Etat (y compris ex-L)": "FONC_PUB",
        "Autres r\u00e9gimes sp\u00e9ciaux": "REGIMES_SPECIAUX",
        "Entreprises d'assurance - contrats collectifs": "ASSURANCES",
        "Institutions de pr\u00e9voyance - contrats collectifs": "PREVOYANCE",
        "Exploitants agricoles": "MSA_EXPLOITANTS",
    },
    "GF1004": {
        "Caisse nationale des allocations familiales": "CAF",
        "R\u00e9gime d'intervention sociale des institutions sans but lucratif au service des m\u00e9nages": "ISBL",
        "R\u00e9gime d'intervention sociale des communes": "COMMUNES",
        "R\u00e9gime d'intervention sociale des d\u00e9partements": "DEPARTEMENTS",
        f"Caisse nationale d{RSQ}assurance maladie": "CPAM",
        "R\u00e9gime des cr\u00e9dits d'imp\u00f4ts de l'\u00c9tat": "CREDITS_IMPOTS",
        "Autres regimes priv\u00e9s": "AUTRES_PRIVES",
    },
    "GF1005": {
        "UNEDIC et autres r\u00e9gimes": "UNEDIC",
        "Autres regimes priv\u00e9s": "AUTRES_PRIVES",
        "R\u00e9gime d'intervention sociale de l'\u00c9tat": "ETAT",
        "P\u00f4le emploi": "POLE_EMPLOI",
        "R\u00e9gime d'intervention sociale des r\u00e9gions": "REGIONS",
    },
    "GF1006": {
        "R\u00e9gime d'intervention sociale de l'\u00c9tat": "ETAT",
    },
}


def fetch_api(where_clause, limit=100):
    params = urllib.parse.urlencode({
        "limit": str(limit),
        "where": where_clause,
        "order_by": "val desc",
    })
    url = f"{API_BASE}?{params}"
    print(f"  GET {url[:120]}...", file=sys.stderr)
    time.sleep(0.3)
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return []
    return data.get("results", [])


def get_regime_values(results, take_shortest_pscode):
    regimes = {}
    for r in results:
        if r.get("si_niveau") != "2":
            continue
        name = r["nom_regime"]
        val = r["val"]
        pscode = r.get("ps_code", "")
        if name not in regimes:
            regimes[name] = (val, pscode)
        elif take_shortest_pscode and len(pscode) < len(regimes[name][1]):
            regimes[name] = (val, pscode)
        elif not take_shortest_pscode:
            regimes[name] = (regimes[name][0] + val, regimes[name][1])
    return {name: val for name, (val, _) in regimes.items()}


def find_node(tree, code):
    if tree.get("code") == code:
        return tree
    for child in tree.get("children", []):
        result = find_node(child, code)
        if result:
            return result
    return None


def main():
    with open("data/processed/cofog-arbre.json", "r") as f:
        tree = json.load(f)

    total_values_added = 0
    root = tree["depenses"]

    for parent_code in ["GF07", "GF1001", "GF1002", "GF1003", "GF1004", "GF1005", "GF1006"]:
        config = COFOG_PARENTS[parent_code]
        mapping = REGIME_MAPPING[parent_code]

        print(f"\n=== {parent_code} ===", file=sys.stderr)

        for year in YEARS:
            where = f'{config["where_extra"]} AND annee={year} AND si_niveau="2"'
            results = fetch_api(where)
            if not results:
                print(f"  {year}: no data", file=sys.stderr)
                continue

            regimes = get_regime_values(results, config["take_shortest_pscode"])

            mapped_values = {}
            residual_total = 0.0
            for name, val in sorted(regimes.items(), key=lambda x: -x[1]):
                if name.startswith("Total "):
                    continue
                if name in mapping:
                    node_code = mapping[name]
                    mapped_values[node_code] = val / 1000
                else:
                    residual_total += val / 1000

            if residual_total > 0.005:
                mapped_values["AUTRES"] = mapped_values.get("AUTRES", 0) + residual_total

            for node_code, val_md in mapped_values.items():
                parent_node = find_node(root, parent_code)
                if parent_node is None:
                    print(f"  Parent node {parent_code} not found!", file=sys.stderr)
                    continue
                child = find_node(parent_node, node_code)
                if child is None:
                    print(f"  Node {parent_code}/{node_code} not found, skipping", file=sys.stderr)
                    continue
                if "values" not in child:
                    child["values"] = {}
                child["values"][str(year)] = round(val_md, 1)
                total_values_added += 1

        print(f"  Done", file=sys.stderr)

    with open("data/processed/cofog-arbre.json", "w") as f:
        json.dump(tree, f, ensure_ascii=False, indent=2)

    print(f"\nTotal: {total_values_added} values added", file=sys.stderr)


if __name__ == "__main__":
    main()
