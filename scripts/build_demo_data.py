#!/usr/bin/env python3
"""Generate deterministic demo data for the Local Economic Stress Radar.

The goal is not to fake precision. It creates a stable, realistic-looking
panel with the same shape the real ingestion pipeline should emit.
"""

from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "stress_data.js"
RNG = random.Random(42)


@dataclass(frozen=True)
class AreaSeed:
    area_id: str
    name: str
    state: str
    level: str
    population: int
    peer_group: str
    x: float
    y: float
    industry: dict[str, float]
    base_unemp: float
    base_wage: float
    base_housing: float
    risk_bias: float
    shock: float


AREAS = [
    AreaSeed("cbsa_19100", "Dallas-Fort Worth-Arlington", "TX", "cbsa", 8100000, "large diversified metro", 59, 66, {"tech": .16, "energy": .07, "logistics": .14, "manufacturing": .10}, 3.7, 1.2, 2.1, 2, 4),
    AreaSeed("cbsa_26420", "Houston-The Woodlands-Sugar Land", "TX", "cbsa", 7500000, "energy metro", 58, 71, {"energy": .22, "logistics": .12, "health": .12, "manufacturing": .09}, 4.2, .7, 1.5, 9, 16),
    AreaSeed("cbsa_41860", "San Francisco-Oakland-Berkeley", "CA", "cbsa", 4700000, "tech metro", 14, 55, {"tech": .32, "finance": .12, "health": .11, "tourism": .06}, 3.9, .4, -1.5, 12, 20),
    AreaSeed("cbsa_41940", "San Jose-Sunnyvale-Santa Clara", "CA", "cbsa", 2000000, "tech metro", 16, 58, {"tech": .42, "manufacturing": .16, "finance": .08, "health": .08}, 4.1, -.2, -2.1, 19, 28),
    AreaSeed("cbsa_16980", "Chicago-Naperville-Elgin", "IL", "cbsa", 9500000, "large diversified metro", 64, 34, {"finance": .15, "manufacturing": .13, "logistics": .12, "health": .12}, 4.8, .3, .4, 11, 11),
    AreaSeed("cbsa_35620", "New York-Newark-Jersey City", "NY", "cbsa", 19500000, "global services metro", 78, 29, {"finance": .24, "tech": .13, "tourism": .10, "health": .13}, 4.4, .8, .6, 6, 7),
    AreaSeed("cbsa_47900", "Washington-Arlington-Alexandria", "DC", "cbsa", 6400000, "government services metro", 82, 43, {"government": .28, "tech": .15, "health": .10, "finance": .08}, 3.2, 1.0, 1.2, -5, -4),
    AreaSeed("cbsa_38060", "Phoenix-Mesa-Chandler", "AZ", "cbsa", 5200000, "growth metro", 34, 61, {"construction": .13, "tech": .13, "tourism": .09, "health": .12}, 3.6, .6, 3.0, 4, 10),
    AreaSeed("cbsa_29820", "Las Vegas-Henderson-Paradise", "NV", "cbsa", 2350000, "tourism metro", 21, 61, {"tourism": .31, "construction": .11, "logistics": .07, "health": .10}, 5.3, .2, 2.2, 14, 18),
    AreaSeed("cbsa_16740", "Charlotte-Concord-Gastonia", "NC", "cbsa", 2850000, "finance growth metro", 77, 55, {"finance": .22, "logistics": .10, "manufacturing": .10, "health": .11}, 3.5, 1.1, 2.4, -2, 1),
    AreaSeed("cbsa_19820", "Detroit-Warren-Dearborn", "MI", "cbsa", 4350000, "manufacturing metro", 68, 30, {"manufacturing": .26, "auto": .18, "logistics": .08, "health": .12}, 5.1, -.4, .2, 18, 24),
    AreaSeed("cbsa_24220", "Grand Rapids-Kentwood", "MI", "cbsa", 1100000, "mid-market manufacturing", 69, 33, {"manufacturing": .23, "health": .13, "logistics": .07, "construction": .07}, 4.0, .4, .7, 8, 12),
    AreaSeed("cbsa_12580", "Baltimore-Columbia-Towson", "MD", "cbsa", 2850000, "legacy services metro", 81, 41, {"government": .14, "health": .17, "logistics": .09, "finance": .08}, 4.0, .5, .1, 6, 8),
    AreaSeed("cbsa_40140", "Riverside-San Bernardino-Ontario", "CA", "cbsa", 4700000, "logistics exurban metro", 20, 59, {"logistics": .22, "construction": .11, "health": .11, "tourism": .06}, 5.2, -.1, .8, 13, 17),
    AreaSeed("cbsa_23420", "Fresno", "CA", "cbsa", 1020000, "agriculture metro", 18, 62, {"agriculture": .20, "logistics": .10, "health": .14, "government": .10}, 7.0, -.5, .4, 15, 19),
    AreaSeed("county_06085", "Santa Clara County", "CA", "county", 1880000, "large tech county", 16, 58, {"tech": .45, "manufacturing": .16, "finance": .07, "health": .08}, 4.0, -.3, -2.5, 21, 31),
    AreaSeed("county_48201", "Harris County", "TX", "county", 4800000, "energy county", 58, 71, {"energy": .24, "logistics": .12, "health": .12, "manufacturing": .08}, 4.3, .5, 1.2, 10, 18),
    AreaSeed("county_26163", "Wayne County", "MI", "county", 1750000, "legacy manufacturing county", 68, 30, {"auto": .20, "manufacturing": .22, "logistics": .08, "health": .14}, 6.0, -.6, -.2, 24, 30),
    AreaSeed("county_32003", "Clark County", "NV", "county", 2350000, "tourism county", 21, 61, {"tourism": .33, "construction": .12, "health": .10, "logistics": .07}, 5.5, .1, 2.0, 16, 19),
    AreaSeed("county_37119", "Mecklenburg County", "NC", "county", 1160000, "finance county", 77, 55, {"finance": .25, "tech": .11, "health": .11, "logistics": .08}, 3.4, 1.0, 2.6, -3, -1),
]


SOURCES = [
    {
        "id": "BLS_LAUS",
        "name": "BLS LAUS",
        "series": "Local unemployment rate, labor force, employment",
        "source_url": "https://www.bls.gov/lau/",
        "release_date": "monthly, about five weeks after reference month",
        "prototype_status": "demo-shaped, ready for real ingestion",
    },
    {
        "id": "BLS_QCEW",
        "name": "BLS QCEW",
        "series": "County industry employment, wages, establishment count",
        "source_url": "https://www.bls.gov/cew/",
        "release_date": "quarterly, about five months after quarter end",
        "prototype_status": "demo-shaped, latest-available only",
    },
    {
        "id": "ACS_5YR",
        "name": "Census ACS 5-year",
        "series": "Static demographics, income, commute, rent burden",
        "source_url": "https://www.census.gov/programs-surveys/acs",
        "release_date": "annual",
        "prototype_status": "demo-shaped static controls",
    },
    {
        "id": "FRED",
        "name": "FRED macro indicators",
        "series": "National and state macro conditions",
        "source_url": "https://fred.stlouisfed.org/",
        "release_date": "mixed",
        "prototype_status": "macro shock factors simulated",
    },
    {
        "id": "FHFA_HPI",
        "name": "FHFA HPI",
        "series": "Home price index momentum",
        "source_url": "https://www.fhfa.gov/data/hpi",
        "release_date": "quarterly",
        "prototype_status": "optional housing pillar proxy",
    },
]


def month_range(start_year: int, start_month: int, count: int) -> list[str]:
    out = []
    year, month = start_year, start_month
    for _ in range(count):
        out.append(f"{year:04d}-{month:02d}")
        month += 1
        if month == 13:
            month = 1
            year += 1
    return out


MONTHS = month_range(2022, 1, 52)
LATEST_MONTH = MONTHS[-1]


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def pct_rank(values: list[float], value: float) -> float:
    if not values:
        return 50.0
    below = sum(1 for item in values if item <= value)
    return 100.0 * (below - 0.5) / len(values)


def weighted_hhi(industry: dict[str, float]) -> float:
    return sum((share * 100) ** 2 for share in industry.values())


def make_series(area: AreaSeed) -> list[dict[str, float | str]]:
    series = []
    prev_est = 1000.0 + area.risk_bias * 1.2
    for idx, month in enumerate(MONTHS):
        cyc = math.sin(idx / 5.4 + area.x / 18.0) * 0.28
        late = max(0.0, (idx - 37) / 14.0)
        shock = late * area.shock / 10.0
        noise = RNG.normalvariate(0, 0.08)

        unemployment = area.base_unemp + cyc + shock * 0.42 + noise
        payroll_growth = 1.9 + area.base_wage * 0.22 - shock * 0.55 + RNG.normalvariate(0, 0.22)
        wage_growth = area.base_wage + 1.5 - shock * 0.23 + RNG.normalvariate(0, 0.16)
        hpi_growth = area.base_housing - shock * 0.30 + math.sin(idx / 7.0) * 0.35 + RNG.normalvariate(0, 0.18)
        establishment_growth = 1.2 - shock * 0.28 + RNG.normalvariate(0, 0.18)
        rent_burden = clamp(28 + area.risk_bias * 0.25 + shock * 0.55 + RNG.normalvariate(0, 0.55), 18, 48)
        claims_proxy = clamp(100 + area.risk_bias * 1.5 + shock * 10 + RNG.normalvariate(0, 4), 70, 190)
        migration_rate = clamp(0.5 - area.risk_bias * 0.015 - shock * 0.05 + RNG.normalvariate(0, 0.07), -2.0, 3.0)

        prev_est = max(800, prev_est * (1 + establishment_growth / 1200.0))
        series.append(
            {
                "month": month,
                "unemployment_rate": round(clamp(unemployment, 1.5, 12.5), 2),
                "payroll_growth_yoy": round(payroll_growth, 2),
                "real_wage_growth_yoy": round(wage_growth, 2),
                "hpi_growth_6m": round(hpi_growth, 2),
                "establishment_growth_yoy": round(establishment_growth, 2),
                "rent_burden": round(rent_burden, 2),
                "claims_index": round(claims_proxy, 1),
                "net_migration_rate": round(migration_rate, 2),
                "establishment_index": round(prev_est, 1),
            }
        )
    return series


def slope(last: list[float]) -> float:
    n = len(last)
    if n < 2:
        return 0.0
    x_bar = (n - 1) / 2
    y_bar = sum(last) / n
    denom = sum((i - x_bar) ** 2 for i in range(n))
    if denom == 0:
        return 0.0
    return sum((i - x_bar) * (y - y_bar) for i, y in enumerate(last)) / denom


def score_areas(raw: dict[str, list[dict[str, float | str]]]) -> list[dict[str, object]]:
    latest_rows = {area.area_id: raw[area.area_id][-1] for area in AREAS}
    six_months = {area.area_id: raw[area.area_id][-6:] for area in AREAS}

    unemp_values = [float(row["unemployment_rate"]) for row in latest_rows.values()]
    claims_values = [float(row["claims_index"]) for row in latest_rows.values()]
    payroll_values = [float(row["payroll_growth_yoy"]) for row in latest_rows.values()]
    wage_values = [float(row["real_wage_growth_yoy"]) for row in latest_rows.values()]
    business_values = [float(row["establishment_growth_yoy"]) for row in latest_rows.values()]
    hpi_values = [float(row["hpi_growth_6m"]) for row in latest_rows.values()]
    rent_values = [float(row["rent_burden"]) for row in latest_rows.values()]
    hhi_values = [weighted_hhi(area.industry) for area in AREAS]

    ranked = []
    for area in AREAS:
        latest = latest_rows[area.area_id]
        six = six_months[area.area_id]
        unemp_trend = slope([float(row["unemployment_rate"]) for row in six]) * 6
        payroll = float(latest["payroll_growth_yoy"])
        wage = float(latest["real_wage_growth_yoy"])
        business = float(latest["establishment_growth_yoy"])
        hpi = float(latest["hpi_growth_6m"])
        rent = float(latest["rent_burden"])
        claims = float(latest["claims_index"])
        migration = float(latest["net_migration_rate"])
        hhi = weighted_hhi(area.industry)

        labor = (
            pct_rank(unemp_values, float(latest["unemployment_rate"])) * 0.40
            + pct_rank(claims_values, claims) * 0.25
            + (100 - pct_rank(payroll_values, payroll)) * 0.25
            + clamp(50 + unemp_trend * 14, 0, 100) * 0.10
        )
        income = (100 - pct_rank(wage_values, wage)) * 0.72 + clamp(50 - migration * 14, 0, 100) * 0.28
        business_score = (100 - pct_rank(business_values, business)) * 0.76 + clamp(50 + (1000 - float(latest["establishment_index"])) / 12, 0, 100) * 0.24
        housing = (100 - pct_rank(hpi_values, hpi)) * 0.52 + pct_rank(rent_values, rent) * 0.48
        concentration = pct_rank(hhi_values, hhi) * 0.70 + clamp(45 + area.shock * 1.2, 0, 100) * 0.30

        pillars = {
            "labor": round(labor, 1),
            "income": round(income, 1),
            "business": round(business_score, 1),
            "housing": round(housing, 1),
            "concentration": round(concentration, 1),
        }
        score = (
            pillars["labor"] * 0.30
            + pillars["income"] * 0.18
            + pillars["business"] * 0.18
            + pillars["housing"] * 0.19
            + pillars["concentration"] * 0.15
        )
        uncertainty = clamp(8 + (400000 / max(area.population, 200000)) + abs(unemp_trend) * 2.3, 5, 24)
        change_3m = score - score_for_period(raw[area.area_id][-4], area, hhi, hhi_values)
        top_industry = max(area.industry.items(), key=lambda pair: pair[1])
        drivers = build_drivers(pillars, latest, unemp_trend, top_industry)

        risk_band = "high" if score >= 70 else "watch" if score >= 55 else "stable"
        signal_quality = "low" if area.population < 600000 or uncertainty > 18 else "medium" if uncertainty > 13 else "high"

        ranked.append(
            {
                "area_id": area.area_id,
                "name": area.name,
                "state": area.state,
                "level": area.level,
                "population": area.population,
                "peer_group": area.peer_group,
                "x": area.x,
                "y": area.y,
                "stress_score": round(score, 1),
                "score_low": round(max(0, score - uncertainty), 1),
                "score_high": round(min(100, score + uncertainty), 1),
                "change_3m": round(change_3m, 1),
                "risk_band": risk_band,
                "signal_quality": signal_quality,
                "pillars": pillars,
                "latest": latest,
                "industry": area.industry,
                "top_driver": drivers[0],
                "drivers": drivers,
                "headline": make_headline(area.name, risk_band, drivers[0], change_3m),
            }
        )

    ranked.sort(key=lambda item: item["stress_score"], reverse=True)
    for idx, item in enumerate(ranked, 1):
        item["rank"] = idx
    return ranked


def score_for_period(row: dict[str, float | str], area: AreaSeed, hhi: float, hhi_values: list[float]) -> float:
    stress = 50
    stress += (float(row["unemployment_rate"]) - 4.0) * 5.0
    stress -= float(row["payroll_growth_yoy"]) * 2.2
    stress -= float(row["real_wage_growth_yoy"]) * 1.6
    stress -= float(row["establishment_growth_yoy"]) * 2.0
    stress -= float(row["hpi_growth_6m"]) * 1.3
    stress += (float(row["rent_burden"]) - 30) * 1.2
    stress += pct_rank(hhi_values, hhi) * 0.08
    stress += area.risk_bias * 0.25
    return clamp(stress, 0, 100)


def build_drivers(
    pillars: dict[str, float],
    latest: dict[str, float | str],
    unemp_trend: float,
    top_industry: tuple[str, float],
) -> list[dict[str, str | float]]:
    ranked_pillars = sorted(pillars.items(), key=lambda pair: pair[1], reverse=True)
    out = []
    for key, value in ranked_pillars[:3]:
        if key == "labor":
            label = f"Labor stress: unemployment {latest['unemployment_rate']}%, six-month trend {unemp_trend:+.1f} pts"
            source = "BLS_LAUS"
        elif key == "income":
            label = f"Income pressure: real wage growth {latest['real_wage_growth_yoy']}%, migration {latest['net_migration_rate']}%"
            source = "BEA_CA_INCOME"
        elif key == "business":
            label = f"Business dynamism: establishments {latest['establishment_growth_yoy']}% YoY"
            source = "BLS_QCEW"
        elif key == "housing":
            label = f"Housing pressure: HPI {latest['hpi_growth_6m']}% over six months, rent burden {latest['rent_burden']}%"
            source = "FHFA_HPI"
        else:
            label = f"Concentration risk: {top_industry[0]} exposure is {top_industry[1] * 100:.0f}% of modeled employment"
            source = "BLS_QCEW"
        out.append({"pillar": key, "score": round(value, 1), "label": label, "source": source})
    return out


def make_headline(name: str, band: str, driver: dict[str, str | float], change_3m: float) -> str:
    direction = "rising" if change_3m > 4 else "easing" if change_3m < -4 else "steady"
    if band == "high":
        return f"{name} is in the high-stress tier with {driver['pillar']} as the main driver; risk is {direction} over 3 months."
    if band == "watch":
        return f"{name} is on watch, led by {driver['pillar']} pressure; risk is {direction} over 3 months."
    return f"{name} remains relatively stable, though {driver['pillar']} is the highest-pressure pillar."


def build_timeseries(raw: dict[str, list[dict[str, float | str]]], latest: list[dict[str, object]]) -> dict[str, list[dict[str, float | str]]]:
    by_id = {item["area_id"]: item for item in latest}
    hhi_values = [weighted_hhi(area.industry) for area in AREAS]
    area_by_id = {area.area_id: area for area in AREAS}
    out = {}
    for area_id, rows in raw.items():
        area = area_by_id[area_id]
        hhi = weighted_hhi(area.industry)
        scored_rows = []
        for row in rows:
            score = score_for_period(row, area, hhi, hhi_values)
            scored_rows.append(
                {
                    "month": row["month"],
                    "stress_score": round(score, 1),
                    "unemployment_rate": row["unemployment_rate"],
                    "payroll_growth_yoy": row["payroll_growth_yoy"],
                }
            )
        final_score = float(by_id[area_id]["stress_score"])
        delta = final_score - scored_rows[-1]["stress_score"]
        scored_rows[-1]["stress_score"] = final_score
        if abs(delta) > 0.1:
            for idx in range(max(0, len(scored_rows) - 6), len(scored_rows) - 1):
                scored_rows[idx]["stress_score"] = round(float(scored_rows[idx]["stress_score"]) + delta * (idx - (len(scored_rows) - 6)) / 6, 1)
        out[area_id] = scored_rows
    return out


def build_backtest() -> dict[str, object]:
    return {
        "label": "future unemployment spike or payroll decline",
        "window": "rolling-origin demo panel, 2022-2026",
        "base_rate": 0.09,
        "pr_auc": 0.24,
        "pr_auc_lift": 2.7,
        "recall_at_30_precision": 0.61,
        "median_lead_months": 3.2,
        "rank_stability": 0.82,
        "notes": [
            "Demo metrics are placeholders for UI and workflow validation.",
            "Real backtests must separate true historical vintages from release-lag masked revised data.",
            "First real labels should be unemployment spikes and payroll declines before any composite stress label.",
        ],
    }


def main() -> None:
    raw = {area.area_id: make_series(area) for area in AREAS}
    latest = score_areas(raw)
    timeseries = build_timeseries(raw, latest)
    payload = {
        "meta": {
            "product": "Local Economic Stress Radar",
            "generated_at": date.today().isoformat(),
            "latest_month": LATEST_MONTH,
            "mode": "deterministic demo data",
            "scoring_version": "stress-score-v0.1",
            "sources": SOURCES,
        },
        "areas": latest,
        "timeseries": timeseries,
        "backtest": build_backtest(),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("window.STRESS_DATA = " + json.dumps(payload, indent=2) + ";\n", encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"Areas: {len(latest)}")


if __name__ == "__main__":
    main()
