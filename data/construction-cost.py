#!/usr/bin/env python3
"""
Derives every construction-cost figure used in the articles, so a reader can
check the arithmetic. Source CSVs are unmodified in
../../data/dubai-statistics-center/ (Dubai Statistics Center, downloaded 4 Sep 2026).

    python3 data/construction-cost.py > data/construction-cost.json
"""
import csv, json, collections, pathlib

SRC = pathlib.Path(__file__).resolve().parents[2] / "data" / "dubai-statistics-center"

def load(p):
    with open(SRC / p, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

def num(v):
    try: return float(str(v).strip().replace(",", ""))
    except Exception: return None

def as_int(v):
    try: return int(str(v).strip())
    except Exception: return None

out = {
    "source": "Dubai Statistics Center, Construction Cost Index and average construction material prices",
    "downloaded": "2026-09-04",
    "base": "2019 = 100 for index levels; material prices in AED",
}

# Quarterly index level, residential general index
q = load("construction-cost-index/Construction_Cost_Index_by_Building_Stages_2019=100_2026-09-04.csv")
quarterly = {}
for r in q:
    if r["Type"].strip() != "General Index": continue
    if r["Description"].strip() != "Residential buildings": continue
    y, n, v = as_int(r["Year"]), as_int(r["Quarter_Number"]), num(r["Value"])
    if y and n and v is not None: quarterly[f"{y}-Q{n}"] = v
out["quarterly_residential_general_index"] = dict(sorted(quarterly.items()))

# Monthly index level, 2026
m = load("construction-cost-index/Monthly_Construction_Cost_Index_by_Building_Stages_2026-09-04.csv")
monthly = {}
for r in m:
    if r["Title"].strip() != "General Index": continue
    if r["Description"].strip() != "Residential buildings": continue
    y, mo, v = as_int(r["Year"]), as_int(r["Month"]), num(r["Value"])
    if y and mo and v is not None: monthly[f"{y}-{mo:02d}"] = v
out["monthly_residential_general_index"] = dict(sorted(monthly.items()))

# The headline comparison
qi = out["quarterly_residential_general_index"]
mi = out["monthly_residential_general_index"]
def pct(a, b): return round((b / a - 1) * 100, 2)
out["headline"] = {
    "2019Q1_to_2025Q4": {
        "from": qi.get("2019-Q1"), "to": qi.get("2025-Q4"),
        "change_pct": pct(qi["2019-Q1"], qi["2025-Q4"]) if qi.get("2019-Q1") and qi.get("2025-Q4") else None,
        "span": "7 years",
    },
    "2026Q1_to_2026Q2": {
        "from": qi.get("2026-Q1"), "to": qi.get("2026-Q2"),
        "change_pct": pct(qi["2026-Q1"], qi["2026-Q2"]) if qi.get("2026-Q1") and qi.get("2026-Q2") else None,
    },
    "2026_jan_to_jun": {
        "from": mi.get("2026-01"), "to": mi.get("2026-06"),
        "change_pct": pct(mi["2026-01"], mi["2026-06"]) if mi.get("2026-01") and mi.get("2026-06") else None,
    },
}

# Change by building stage since 2019, residential
stages = collections.defaultdict(dict)
for r in q:
    if r["Description"].strip() != "Residential buildings": continue
    y, n, v = as_int(r["Year"]), as_int(r["Quarter_Number"]), num(r["Value"])
    if y and n and v is not None: stages[r["Type"].strip()][(y, n)] = v

by_stage = {}
for stage, pts in stages.items():
    ks = sorted(pts)
    base = next((pts[k] for k in ks if k[0] == 2019), None)
    if not base: continue
    last_k = ks[-1]
    by_stage[stage] = {
        "base_2019": round(base, 2),
        "latest": round(pts[last_k], 2),
        "latest_period": f"{last_k[0]}-Q{last_k[1]}",
        "change_pct": pct(base, pts[last_k]),
    }
out["by_building_stage_since_2019"] = dict(
    sorted(by_stage.items(), key=lambda kv: kv[1]["change_pct"], reverse=True)
)

# Material prices, first to latest observation
mat = load("material-prices/Average_Construction_Material_Prices_2026-09-04.csv")
series = collections.defaultdict(dict); units = {}
for r in mat:
    name, v, n, y = r["Materials"].strip(), num(r["Value"]), as_int(r["QuarterNum"]), as_int(r["Year"])
    if v is None or not n or not y: continue
    series[name][(y, n)] = v
    units[name] = r["Quantity"].strip()

materials = {}
for name, pts in series.items():
    ks = sorted(pts)
    if len(ks) < 2: continue
    materials[name] = {
        "unit": units.get(name, ""),
        "first_period": f"{ks[0][0]}-Q{ks[0][1]}", "first_aed": round(pts[ks[0]], 2),
        "latest_period": f"{ks[-1][0]}-Q{ks[-1][1]}", "latest_aed": round(pts[ks[-1]], 2),
        "change_pct": pct(pts[ks[0]], pts[ks[-1]]),
    }
out["materials"] = dict(sorted(materials.items(), key=lambda kv: kv[1]["change_pct"], reverse=True))

print(json.dumps(out, indent=2))
