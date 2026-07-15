#!/usr/bin/env python3
"""Build enriched arbre-nature.json from Eurostat gov_10a_main.json"""

import json
from datetime import datetime, timezone
from collections import OrderedDict

RAW_PATH = "data/raw/eurostat/gov_10a_main.json"
COFOG_PATH = "data/raw/eurostat/gov_10a_exp_gf10_subfunctions_fr.json"
OUT_PATH = "data/processed/arbre-nature.json"

RECETTES_HIERARCHY = OrderedDict([
    ("TR", {
        "label": "Total des recettes APU",
        "children": ["D2REC", "D5REC", "D61REC", "D4REC", "D7REC", "D9REC"]
    }),
    ("D2REC", {
        "label": "Impôts sur la production et importations",
        "children": ["D21REC", "D29REC"]
    }),
    ("D21REC", {
        "label": "Impôts sur les produits",
        "children": ["D211REC"]
    }),
    ("D211REC", { "label": "TVA" }),
    ("D29REC", { "label": "Autres impôts sur la production" }),
    ("D5REC", {
        "label": "Impôts courants sur le revenu",
        "children": ["D51A_C1REC", "D51B_C2REC"]
    }),
    ("D51A_C1REC", { "label": "Impôt sur le revenu (IR)" }),
    ("D51B_C2REC", { "label": "Impôt sur les sociétés (IS)" }),
    ("D61REC", {
        "label": "Cotisations sociales nettes",
        "children": ["D611REC", "D613REC"]
    }),
    ("D611REC", { "label": "Cotisations sociales employeurs" }),
    ("D613REC", { "label": "Cotisations sociales ménages" }),
    ("D4REC", {
        "label": "Revenus de la propriété",
        "children": ["D41REC", "D42REC", "D43REC", "D44REC", "D45REC"]
    }),
    ("D41REC", { "label": "Intérêts" }),
    ("D42REC", { "label": "Dividendes" }),
    ("D43REC", { "label": "Revenus prélevés sur les quasi-sociétés" }),
    ("D44REC", { "label": "Revenus de la propriété attribués aux assurés" }),
    ("D45REC", { "label": "Loyers" }),
    ("D7REC", {
        "label": "Autres transferts courants",
        "children": ["D71REC", "D72REC", "D73REC", "D74REC", "D75REC", "D76REC"]
    }),
    ("D71REC", { "label": "Primes nettes d'assurance-dommages" }),
    ("D72REC", { "label": "Transferts courants entre administrations" }),
    ("D73REC", { "label": "Transferts de coopération" }),
    ("D74REC", { "label": "Coopération internationale courante" }),
    ("D75REC", { "label": "Transferts courants divers" }),
    ("D76REC", { "label": "Ressources propres de l'UE" }),
    ("D9REC", {
        "label": "Transferts en capital",
        "children": ["D91REC", "D92REC", "D99REC"]
    }),
    ("D91REC", { "label": "Impôts en capital" }),
    ("D92REC", { "label": "Aides à l'investissement" }),
    ("D99REC", { "label": "Autres transferts en capital" }),
])

DEPENSES_HIERARCHY = OrderedDict([
    ("TE", {
        "label": "Total des dépenses APU",
        "children": ["P3", "P5", "D29PAY", "D3PAY", "D4PAY", "D5PAY", "D62PAY", "D632PAY", "D7PAY", "D9PAY", "NP", "DISC"]
    }),
    ("P3", {
        "label": "Dépense de consommation finale",
        "children": ["P31", "P32", "D1PAY", "P2", "P51C", "P3_AUTRES"]
    }),
    ("P31", { "label": "Consommation individuelle" }),
    ("P32", { "label": "Consommation collective" }),
    ("D1PAY", {
        "label": "Rémunération des salariés",
        "children": ["D11PAY", "D12PAY"]
    }),
    ("D11PAY", { "label": "Salaires et traitements bruts" }),
    ("D12PAY", { "label": "Cotisations sociales employeurs" }),
    ("P2", { "label": "Consommation intermédiaire" }),
    ("P51C", { "label": "Consommation de capital fixe (amortissements)" }),
    ("P3_AUTRES", { "label": "Autres dépenses de consommation finale" }),
    ("P5", {
        "label": "Formation brute de capital",
        "children": ["P51G", "P52_P53"]
    }),
    ("P51G", { "label": "FBCF" }),
    ("P52_P53", { "label": "Variation des stocks" }),
    ("D29PAY", { "label": "Autres impôts sur la production" }),
    ("D3PAY", {
        "label": "Subventions",
        "children": ["D31PAY", "D39PAY"]
    }),
    ("D31PAY", { "label": "Subventions sur les produits" }),
    ("D39PAY", { "label": "Autres subventions sur la production" }),
    ("D4PAY", {
        "label": "Revenus de la propriété",
        "children": ["D41PAY", "D42PAY", "D43PAY", "D44PAY", "D45PAY"]
    }),
    ("D41PAY", { "label": "Intérêts" }),
    ("D42PAY", { "label": "Dividendes versés" }),
    ("D43PAY", { "label": "Revenus prélevés sur les quasi-sociétés" }),
    ("D44PAY", { "label": "Revenus de la propriété attribués aux assurés" }),
    ("D45PAY", { "label": "Loyers" }),
    ("D5PAY", { "label": "Impôts courants sur le revenu" }),
    ("D62PAY", {
        "label": "Prestations sociales (espèces)",
        "children": ["D621PAY", "D622PAY", "D623PAY", "GF_BREAKDOWN"]
    }),
    ("D621PAY", { "label": "Prestations de sécurité sociale" }),
    ("D622PAY", { "label": "Prestations d'assurance sociale" }),
    ("D623PAY", { "label": "Prestations d'assistance sociale" }),
    # COFOG functional breakdown of D62PAY
    ("GF_BREAKDOWN", {
        "label": "Par fonction (COFOG)",
        "children": ["D62PAY_GF1002", "D62PAY_GF1003", "D62PAY_GF1005", "GF_AUTRES"]
    }),
    ("D62PAY_GF1002", { "label": "Vieillesse (pensions retraite)" }),
    ("D62PAY_GF1003", { "label": "Survivants (pensions réversion)" }),
    ("D62PAY_GF1005", { "label": "Chômage" }),
    ("GF_AUTRES", {
        "label": "Autres prestations sociales",
        "children": ["GF_AUTRES_FAMILLE", "GF_AUTRES_SANTE", "GF_AUTRES_LOGEMENT", "GF_AUTRES_EXCLUSION", "GF_AUTRES_NEC"]
    }),
    ("GF_AUTRES_FAMILLE", { "label": "Famille et enfants" }),
    ("GF_AUTRES_SANTE", { "label": "Maladie et invalidité" }),
    ("GF_AUTRES_LOGEMENT", { "label": "Logement" }),
    ("GF_AUTRES_EXCLUSION", { "label": "Exclusion sociale" }),
    ("GF_AUTRES_NEC", { "label": "Divers" }),
    ("D632PAY", { "label": "Transferts sociaux en nature (santé)" }),
    ("D7PAY", {
        "label": "Autres transferts courants",
        "children": ["D71PAY", "D74PAY", "D75PAY", "D76PAY"]
    }),
    ("D71PAY", { "label": "Primes nettes d'assurance-dommages" }),
    ("D74PAY", { "label": "Coopération internationale courante" }),
    ("D75PAY", { "label": "Transferts courants divers" }),
    ("D76PAY", { "label": "Ressources propres de l'UE" }),
    ("D9PAY", {
        "label": "Transferts en capital",
        "children": ["D92PAY", "D99PAY"]
    }),
    ("D92PAY", { "label": "Aides à l'investissement" }),
    ("D99PAY", { "label": "Autres transferts en capital" }),
    ("NP", { "label": "Acquisitions nettes d'actifs non financiers" }),
    ("DISC", { "label": "Écart statistique (solde non ventilé)" }),
])


def decode_index(k, sizes):
    indices = []
    for s in reversed(sizes):
        indices.append(k % s)
        k //= s
    return list(reversed(indices))


def extract_code_values(data, code, preferred_unit="MIO_EUR"):
    dim = data["dimension"]
    na_item_map = {k: v for k, v in dim["na_item"]["category"]["index"].items()}
    sector_map = {k: v for k, v in dim["sector"]["category"]["index"].items()}
    unit_map = {k: v for k, v in dim["unit"]["category"]["index"].items()}
    geo_map = {k: v for k, v in dim["geo"]["category"]["index"].items()}
    time_map = {k: v for k, v in dim["time"]["category"]["index"].items()}
    time_by_idx = {v: k for k, v in time_map.items()}

    if code not in na_item_map:
        return None

    na_idx = na_item_map[code]
    s13_idx = sector_map.get("S13")
    fr_idx = geo_map.get("FR")
    pref_u_idx = unit_map.get(preferred_unit)
    fallback_u_idx = unit_map.get("MIO_NAC")

    if s13_idx is None or fr_idx is None:
        return None

    sizes = data["size"]
    values_pref = {}
    values_fallback = {}

    for key_str, raw_val in data["value"].items():
        k = int(key_str)
        indices = decode_index(k, sizes)
        f_idx, u_idx, s_idx, n_idx, g_idx, t_idx = indices

        if s_idx != s13_idx or n_idx != na_idx or g_idx != fr_idx:
            continue

        year = time_by_idx.get(t_idx)
        if not year:
            continue

        val_md = round(raw_val / 1000.0, 3)

        if u_idx == pref_u_idx:
            values_pref[year] = val_md
        elif u_idx == fallback_u_idx:
            values_fallback[year] = val_md

    if values_pref:
        return values_pref
    return values_fallback if values_fallback else None


def build_node(code, hierarchy, data, old_tree=None):
    if code not in hierarchy:
        return None

    info = hierarchy[code]
    label = info["label"]
    children_codes = info.get("children", [])

    if code == "DISC":
        # Try to read DISC from old file, then from git
        disc_values = {}
        if old_tree:
            old_disc = find_old_node(old_tree["depenses"], "DISC")
            if old_disc:
                disc_values = dict(old_disc.get("values", {}))
        if not disc_values:
            try:
                import subprocess
                result = subprocess.run(
                    ["git", "show", "HEAD:data/processed/arbre-nature.json"],
                    capture_output=True, text=True, timeout=10
                )
                if result.returncode == 0:
                    git_tree = json.loads(result.stdout)
                    git_disc = find_old_node(git_tree.get("depenses", {}), "DISC")
                    if git_disc:
                        disc_values = dict(git_disc.get("values", {}))
            except Exception:
                pass
        return {"code": "DISC", "label": label, "values": disc_values}

    if code == "P3_AUTRES":
        p3_vals = extract_code_values(data, "P3")
        p31_vals = extract_code_values(data, "P31")
        p32_vals = extract_code_values(data, "P32")

        if not p3_vals:
            return None

        values = {}
        for y in p3_vals:
            p31_y = (p31_vals or {}).get(y, 0)
            p32_y = (p32_vals or {}).get(y, 0)
            values[y] = round(p3_vals[y] - p31_y - p32_y, 3)

        if not values:
            return None
        return {"code": "P3_AUTRES", "label": label, "values": values}

    # Special handling for GF_BREAKDOWN — values = D62PAY (même total, ventilé différemment)
    if code == "GF_BREAKDOWN":
        d62pay_vals = extract_code_values(data, "D62PAY")
        if not d62pay_vals:
            return None
        node = {"code": "GF_BREAKDOWN", "label": label, "values": dict(d62pay_vals)}
        if children_codes:
            children = []
            for child_code in children_codes:
                child = build_node(child_code, hierarchy, data, old_tree)
                if child is not None:
                    children.append(child)
            if children:
                node["children"] = children
        return node

    # Special handling for GF codes — estimate missing years (Eurostat COFOG lags by 1 year)
    if code in ("D62PAY_GF1002", "D62PAY_GF1003", "D62PAY_GF1005"):
        d62pay_vals = extract_code_values(data, "D62PAY")
        values = extract_code_values(data, code)
        if values and d62pay_vals:
            values = estimate_missing_years(values, d62pay_vals)
        return {"code": code, "label": label, "values": values or {}}

    # Special handling for GF_AUTRES — reste = D62PAY - (GF1002 + GF1003 + GF1005)
    if code == "GF_AUTRES":
        d62pay_vals = extract_code_values(data, "D62PAY")
        if not d62pay_vals:
            return None
        values = {}
        gf1002 = estimate_missing_years(extract_code_values(data, "D62PAY_GF1002") or {}, d62pay_vals)
        gf1003 = estimate_missing_years(extract_code_values(data, "D62PAY_GF1003") or {}, d62pay_vals)
        gf1005 = estimate_missing_years(extract_code_values(data, "D62PAY_GF1005") or {}, d62pay_vals)
        for y in d62pay_vals:
            values[y] = round(d62pay_vals[y] - gf1002.get(y, 0) - gf1003.get(y, 0) - gf1005.get(y, 0), 3)
        if not values:
            return None
        node = {"code": "GF_AUTRES", "label": label, "values": values}
        if children_codes:
            children = []
            for child_code in children_codes:
                child = build_node(child_code, hierarchy, data, old_tree)
                if child is not None:
                    children.append(child)
            if children:
                node["children"] = children
        return node

    # Special handling for GF_AUTRES_* — proportion COFOG du résidu
    if code in GF_AUTRES_SOURCES:
        d62pay_vals = extract_code_values(data, "D62PAY")
        if not d62pay_vals:
            return None
        gf1002 = estimate_missing_years(extract_code_values(data, "D62PAY_GF1002") or {}, d62pay_vals)
        gf1003 = estimate_missing_years(extract_code_values(data, "D62PAY_GF1003") or {}, d62pay_vals)
        gf1005 = estimate_missing_years(extract_code_values(data, "D62PAY_GF1005") or {}, d62pay_vals)
        cofog_data = load_cofog_values(COFOG_PATH)
        if not cofog_data:
            return {"code": code, "label": label, "values": {}}
        source_code = GF_AUTRES_SOURCES[code]
        source_raw = cofog_data.get(source_code, {})
        if not source_raw:
            return {"code": code, "label": label, "values": {}}
        # Compute proportions from the last available COFOG year
        autres_cofog_total = {}
        for sc in GF_AUTRES_SOURCES.values():
            sv = cofog_data.get(sc, {})
            for y, v in sv.items():
                autres_cofog_total[y] = autres_cofog_total.get(y, 0) + v
        last_cofog_year = max(autres_cofog_total.keys(), key=int) if autres_cofog_total else None
        proportions = {}
        for y, v in autres_cofog_total.items():
            for sc, source_sc in GF_AUTRES_SOURCES.items():
                sv = cofog_data.get(source_sc, {})
                svi = sv.get(y, 0)
                if sc == code and v > 0:
                    proportions[y] = svi / v
        # Use latest proportion as default, fallback to average
        latest_proportion = proportions.get(last_cofog_year, 0) if last_cofog_year else 0
        values = {}
        for y in d62pay_vals:
            autres_d62pay = round(d62pay_vals[y] - gf1002.get(y, 0) - gf1003.get(y, 0) - gf1005.get(y, 0), 3)
            ratio = proportions.get(y, latest_proportion)
            values[y] = round(autres_d62pay * ratio, 3)
        if not values:
            return None
        return {"code": code, "label": label, "values": values}

    values = extract_code_values(data, code)
    if values is None and not children_codes:
        return None

    node = {
        "code": code,
        "label": label,
        "values": values or {},
    }

    if children_codes:
        children = []
        for child_code in children_codes:
            child = build_node(child_code, hierarchy, data, old_tree)
            if child is not None:
                children.append(child)
        if children:
            node["children"] = children

    return node


def count_nodes(node):
    if node is None:
        return 0
    n = 1
    for c in node.get("children", []):
        n += count_nodes(c)
    return n


def max_depth(node, d=1):
    if node is None:
        return 0
    if not node.get("children"):
        return d
    return max(max_depth(c, d+1) for c in node["children"])


def estimate_missing_years(values, ref_values):
    """Estimate missing years in values using growth rate from ref_values."""
    if not values or not ref_values:
        return values or {}
    result = dict(values)
    for y in sorted(ref_values, key=int):
        if y not in result and y in ref_values:
            available = sorted(result, key=int)
            if not available:
                continue
            last_avail = available[-1]
            if last_avail in ref_values and ref_values[last_avail] > 0:
                growth = ref_values[y] / ref_values[last_avail]
                result[y] = round(result[last_avail] * growth, 3)
    return result


def load_cofog_values(path):
    """Extract GF10 sub-function values from COFOG gov_10a_exp data."""
    try:
        with open(path) as f:
            cofog_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

    def decode_index(k, sizes):
        indices = []
        for s in reversed(sizes):
            indices.append(k % s)
            k //= s
        return list(reversed(indices))

    dim = cofog_data["dimension"]
    s13_idx = dim["sector"]["category"]["index"]["S13"]
    te_idx = dim["na_item"]["category"]["index"]["TE"]
    mio_eur_idx = dim["unit"]["category"]["index"]["MIO_EUR"]
    fr_idx = dim["geo"]["category"]["index"]["FR"]
    sizes = cofog_data["size"]

    results = {}
    for gf_code in ["GF1001", "GF1004", "GF1006", "GF1007", "GF1009"]:
        cof_idx = dim["cofog99"]["category"]["index"].get(gf_code)
        if cof_idx is None:
            continue
        years = {}
        for key_str, raw_val in cofog_data["value"].items():
            k = int(key_str)
            indices = decode_index(k, sizes)
            f_idx, u_idx, s_idx, cof_idx2, na_idx, geo_idx, t_idx = indices
            if (s_idx == s13_idx and cof_idx2 == cof_idx and
                na_idx == te_idx and geo_idx == fr_idx and u_idx == mio_eur_idx):
                year = list(dim["time"]["category"]["index"].keys())[t_idx]
                years[year] = raw_val / 1000
        if years:
            results[gf_code] = years
    return results


COFOG_LABELS = {
    "GF_AUTRES_FAMILLE": "Famille et enfants",
    "GF_AUTRES_SANTE": "Maladie et invalidité",
    "GF_AUTRES_LOGEMENT": "Logement",
    "GF_AUTRES_EXCLUSION": "Exclusion sociale",
    "GF_AUTRES_NEC": "Divers",
}

# Mapping: GF_AUTRES code → COFOG source code
GF_AUTRES_SOURCES = {
    "GF_AUTRES_FAMILLE": "GF1004",
    "GF_AUTRES_SANTE": "GF1001",
    "GF_AUTRES_LOGEMENT": "GF1006",
    "GF_AUTRES_EXCLUSION": "GF1007",
    "GF_AUTRES_NEC": "GF1009",
}


def find_old_node(node, code):
    if node.get("code") == code:
        return node
    for c in node.get("children", []):
        r = find_old_node(c, code)
        if r:
            return r
    return None


def main():
    with open(RAW_PATH) as f:
        data = json.load(f)

    old_tree = None
    try:
        with open(OUT_PATH) as f:
            old_tree = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    if old_tree:
        old_dep_count = count_nodes(old_tree["depenses"])
        old_rec_count = count_nodes(old_tree["recettes"])
        old_dep_depth = max_depth(old_tree["depenses"])
        old_rec_depth = max_depth(old_tree["recettes"])
    else:
        old_dep_count = old_rec_count = old_dep_depth = old_rec_depth = 0

    depenses = build_node("TE", DEPENSES_HIERARCHY, data, old_tree)
    recettes = build_node("TR", RECETTES_HIERARCHY, data, old_tree)

    tree = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source": "Eurostat (gov_10a_main)",
            "description": "Arbre hiérarchique complet dépenses/recettes APU — nomenclature SEC 2010",
            "unite": "Md€"
        },
        "depenses": depenses,
        "recettes": recettes,
    }

    with open(OUT_PATH, "w") as f:
        json.dump(tree, f, indent=2, ensure_ascii=False)

    new_dep_count = count_nodes(depenses)
    new_rec_count = count_nodes(recettes)
    new_dep_depth = max_depth(depenses)
    new_rec_depth = max_depth(recettes)

    print(f"Written {OUT_PATH}")
    print()
    print(f"Dépenses: {old_dep_count} → {new_dep_count} nœuds, profondeur {old_dep_depth} → {new_dep_depth}")
    print(f"Recettes: {old_rec_count} → {new_rec_count} nœuds, profondeur {old_rec_depth} → {new_rec_depth}")
    print(f"Total: {old_dep_count + old_rec_count} → {new_dep_count + new_rec_count} nœuds")


if __name__ == "__main__":
    main()
