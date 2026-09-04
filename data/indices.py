#!/usr/bin/env python3
"""
Derives every price and rent figure used in the articles.

Source CSVs are unmodified in ../../data/dubai-statistics-center/
(Dubai Statistics Center, downloaded 4 Sep 2026).

    python3 data/indices.py > data/indices.json

Base years differ and are NOT comparable across families:
  property price index  2019 = 100
  rent price index      2024 = 100
  construction cost     2019 = 100
"""
import csv, json, collections, pathlib, statistics

SRC = pathlib.Path(__file__).resolve().parents[2] / "data" / "dubai-statistics-center"

def load(p):
    with open(SRC / p, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

def num(v):
    try: return float(str(v).strip().replace(",", ""))
    except Exception: return None

def ai(v):
    try: return int(str(v).strip())
    except Exception: return None

def pct(a, b):
    return round((b / a - 1) * 100, 2) if a and b else None

def quarterly(path, key="Type"):
    """{series: {"YYYY-Qn": value}} from a quarterly index file."""
    out = collections.defaultdict(dict)
    for r in load(path):
        y, q, v = ai(r["Year"]), ai(r["Quarter_Number"]), num(r["Value"])
        if y and q and v is not None:
            out[r[key].strip()][f"{y}-Q{q}"] = v
    return {k: dict(sorted(v.items())) for k, v in out.items()}

def monthly(path):
    out = collections.defaultdict(dict)
    for r in load(path):
        y, m, v = ai(r["Year"]), ai(r["Month_Number"]), num(r["Value"])
        if y and m and v is not None:
            out[r["Type"].strip()][f"{y}-{m:02d}"] = v
    return {k: dict(sorted(v.items())) for k, v in out.items()}

def summarise(series):
    """First, latest, and total change for each series in a family."""
    out = {}
    for name, pts in series.items():
        ks = sorted(pts)
        if not ks: continue
        out[name] = {
            "first_period": ks[0], "first": pts[ks[0]],
            "latest_period": ks[-1], "latest": pts[ks[-1]],
            "change_pct_over_series": pct(pts[ks[0]], pts[ks[-1]]),
            "peak_period": max(pts, key=pts.get), "peak": max(pts.values()),
            "off_peak_pct": pct(max(pts.values()), pts[ks[-1]]),
        }
    return out

out = {
    "source": "Dubai Statistics Center: residential and commercial property price indices, residential rent price index",
    "downloaded": "2026-09-04",
    "bases": {"property_price": "2019 = 100", "rent": "2024 = 100", "construction_cost": "2019 = 100"},
}

res = quarterly("property-price-index/Residential_Property_Price_Index_-_Base_Year_2019_2026-09-04.csv")
com = quarterly("property-price-index/Commercial_Property_Price_Index_-_Base_Year_2019_2026-09-04.csv")
rent = monthly("rent-price-index/Residential_Rent_Price_Index-_Base_Year_2024_2026-09-04.csv")

out["residential_price_index"] = res
out["commercial_price_index"] = com
out["rent_index"] = rent
out["summary"] = {
    "residential": summarise(res),
    "commercial": summarise(com),
    "rent": summarise(rent),
}

# Rent: is the monthly increment decelerating, and have new lets turned?
deltas = {}
for name, pts in rent.items():
    ks = sorted(pts)
    d = [(ks[i], round(pts[ks[i]] - pts[ks[i-1]], 2)) for i in range(1, len(ks))]
    deltas[name] = dict(d[-12:])
out["rent_monthly_deltas_last_12"] = deltas

# Construction cost, to compare price growth against build cost growth
cci = quarterly("construction-cost-index/Construction_Cost_Index_by_Building_Stages_2019=100_2026-09-04.csv")
cci_res = {k: v for k, v in cci.get("General Index", {}).items()}
out["construction_cost_general_index"] = cci_res

r_gen = res.get("General Index", {})
common_last = "2025-Q4"
if r_gen.get(common_last) and cci_res.get(common_last):
    out["price_vs_build_cost"] = {
        "period": f"2019 base to {common_last}",
        "residential_price_index": r_gen[common_last],
        "construction_cost_index": cci_res[common_last],
        "price_growth_pct": round(r_gen[common_last] - 100, 2),
        "build_cost_growth_pct": round(cci_res[common_last] - 100, 2),
        "ratio": round((r_gen[common_last] - 100) / (cci_res[common_last] - 100), 2),
    }

print(json.dumps(out, indent=2))
