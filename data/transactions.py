#!/usr/bin/env python3
"""
Derives every transaction figure used in the articles.

Source: Dubai Land Department transaction export, downloaded 4 Sep 2026,
unmodified, in ../../data/dubai-land-department/transactions/ (1.1 GB, not in git).

    python3 data/transactions.py > data/transactions.json

Filters applied throughout, and why:
  - dates clipped to 2000-2026: 5,760 rows carry impossible dates, one in 1416
  - residential only: rooms_en mixes in Office, Shop and similar
  - meter_sale_price clipped to 500-200,000 AED/sqm to drop obvious outliers
  - 2026 is partial, to 3 September, so it is only ever compared like for like
"""
import glob, json, pathlib, warnings
import pandas as pd

warnings.filterwarnings("ignore")
SRC = pathlib.Path(__file__).resolve().parents[2] / "data" / "dubai-land-department" / "transactions"
CUTOFF = pd.Timestamp("2026-09-03")

COLS = ["actual_worth", "area_name_en", "instance_date", "meter_sale_price",
        "procedure_area", "property_type_en", "property_usage_en", "reg_type_en",
        "rooms_en", "trans_group_en", "nearest_metro_en", "project_name_en"]

df = pd.concat(
    [pd.read_csv(f, usecols=COLS, low_memory=False) for f in sorted(glob.glob(str(SRC / "*.csv")))],
    ignore_index=True,
)
df["d"] = pd.to_datetime(df["instance_date"], errors="coerce")
df = df[df["d"].dt.year.between(2000, 2026)]
df["year"] = df["d"].dt.year

sales = df[(df.trans_group_en == "Sales") & (df.property_usage_en == "Residential")]
sales = sales[sales.actual_worth > 50_000]
psqm = sales[(sales.meter_sale_price > 500) & (sales.meter_sale_price < 200_000)]

def r(x, n=0):
    return None if pd.isna(x) else round(float(x), n)

out = {
    "source": "Dubai Land Department transaction records",
    "downloaded": "2026-09-04",
    "rows_after_filtering": int(len(df)),
    "coverage": {"from": str(df.d.min().date()), "to": str(df.d.max().date())},
    "caveats": [
        "2026 is a partial year to 3 September and is never compared to a full year",
        "5,760 source rows carry dates before 2000 and are excluded",
        "price per sqm clipped to 500-200,000 AED to drop outliers",
    ],
}

# Like-for-like year to date, the only honest way to read 2026
ytd = {}
for y in (2024, 2025, 2026):
    m = df[(df.trans_group_en == "Sales") & (df.d >= pd.Timestamp(f"{y}-01-01")) & (df.d <= CUTOFF.replace(year=y))]
    ytd[str(y)] = {
        "sales": int(len(m)),
        "value_aed_bn": r(m.actual_worth.sum() / 1e9, 1),
        "median_price_aed": r(m.actual_worth.median()),
    }
out["year_to_date_3_september"] = ytd

t = psqm.groupby("year")["meter_sale_price"].agg(["median", "count"])
out["median_price_per_sqm_by_year"] = {
    str(int(y)): {"median_aed_sqm": r(row["median"]), "sales": int(row["count"]),
                  "yoy_pct": r(((row["median"] / t["median"].shift(1).loc[y]) - 1) * 100, 1) if y - 1 in t.index else None}
    for y, row in t.loc[2015:].iterrows()
}

op = df[df.trans_group_en == "Sales"].groupby(["year", "reg_type_en"]).size().unstack(fill_value=0)
out["off_plan_share_pct_by_year"] = {
    str(int(y)): r(row.get("Off-Plan Properties", 0) / row.sum() * 100, 1)
    for y, row in op.loc[2015:].iterrows()
}

pv = psqm.pivot_table(index="year", columns="property_type_en", values="meter_sale_price", aggfunc="median")
out["villa_vs_apartment_aed_sqm"] = {
    str(int(y)): {"apartment": r(row.get("Unit")), "villa": r(row.get("Villa"))}
    for y, row in pv.loc[2020:].iterrows()
}

rooms = {}
for room in ["Studio", "1 B/R", "2 B/R", "3 B/R", "4 B/R"]:
    a = psqm[(psqm.rooms_en == room) & (psqm.year == 2024)].meter_sale_price.median()
    b = psqm[(psqm.rooms_en == room) & (psqm.year == 2026)].meter_sale_price.median()
    if pd.notna(a) and pd.notna(b):
        rooms[room] = {"aed_sqm_2024": r(a), "aed_sqm_2026": r(b), "change_pct": r((b / a - 1) * 100, 1)}
out["by_bedroom_count"] = rooms

metro = psqm[psqm.nearest_metro_en.notna()].groupby("nearest_metro_en").agg(
    sales=("actual_worth", "size"), median_aed_sqm=("meter_sale_price", "median"))
metro = metro[metro.sales >= 2000].sort_values("median_aed_sqm", ascending=False)
out["by_nearest_metro"] = {
    k: {"sales": int(v["sales"]), "median_aed_sqm": r(v["median_aed_sqm"])}
    for k, v in metro.iterrows()
}

area = sales.groupby("area_name_en").agg(
    sales=("actual_worth", "size"), median_price_aed=("actual_worth", "median"))
area = area.join(psqm.groupby("area_name_en")["meter_sale_price"].median().rename("median_aed_sqm"))
out["top_areas_by_volume"] = {
    k: {"sales": int(v["sales"]), "median_price_aed": r(v["median_price_aed"]),
        "median_aed_sqm": r(v["median_aed_sqm"])}
    for k, v in area.sort_values("sales", ascending=False).head(20).iterrows()
}

out["threshold_shares_by_year"] = {
    str(y): {
        "at_or_above_2m_pct": r((sales[sales.year == y].actual_worth >= 2_000_000).mean() * 100, 1),
        "below_1m_pct": r((sales[sales.year == y].actual_worth < 1_000_000).mean() * 100, 1),
    }
    for y in range(2020, 2027) if len(sales[sales.year == y])
}

g = df.groupby(["year", "trans_group_en"]).size().unstack(fill_value=0)
out["mortgages_per_100_sales"] = {
    str(int(y)): r(row.get("Mortgages", 0) / row.get("Sales", 1) * 100, 1)
    for y, row in g.loc[2018:].iterrows()
}

season = sales[sales.year.between(2022, 2025)].groupby(sales.d.dt.month).size() / 4
out["average_sales_by_month_2022_2025"] = {int(m): int(v) for m, v in season.items()}

print(json.dumps(out, indent=2))
