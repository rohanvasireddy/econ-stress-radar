(() => {
  const rng = mulberry32(42);
  let spareNormal = null;

  const SOURCES = [
    {
      id: "BLS_LAUS",
      name: "BLS LAUS",
      series: "Local unemployment rate, labor force, employment",
      source_url: "https://www.bls.gov/lau/",
      release_date: "monthly, about five weeks after reference month",
      prototype_status: "demo-shaped, ready for real ingestion",
    },
    {
      id: "BLS_QCEW",
      name: "BLS QCEW",
      series: "County industry employment, wages, establishment count",
      source_url: "https://www.bls.gov/cew/",
      release_date: "quarterly, about five months after quarter end",
      prototype_status: "demo-shaped, latest-available only",
    },
    {
      id: "ACS_5YR",
      name: "Census ACS 5-year",
      series: "Static demographics, income, commute, rent burden",
      source_url: "https://www.census.gov/programs-surveys/acs",
      release_date: "annual",
      prototype_status: "demo-shaped static controls",
    },
    {
      id: "FRED",
      name: "FRED macro indicators",
      series: "National and state macro conditions",
      source_url: "https://fred.stlouisfed.org/",
      release_date: "mixed",
      prototype_status: "macro shock factors simulated",
    },
    {
      id: "FHFA_HPI",
      name: "FHFA HPI",
      series: "Home price index momentum",
      source_url: "https://www.fhfa.gov/data/hpi",
      release_date: "quarterly",
      prototype_status: "optional housing pillar proxy",
    },
  ];

  const AREAS = [
    area("cbsa_19100", "Dallas-Fort Worth-Arlington", "TX", "cbsa", 8100000, "large diversified metro", 59, 66, { tech: 0.16, energy: 0.07, logistics: 0.14, manufacturing: 0.10 }, 3.7, 1.2, 2.1, 2, 4),
    area("cbsa_26420", "Houston-The Woodlands-Sugar Land", "TX", "cbsa", 7500000, "energy metro", 58, 71, { energy: 0.22, logistics: 0.12, health: 0.12, manufacturing: 0.09 }, 4.2, 0.7, 1.5, 9, 16),
    area("cbsa_41860", "San Francisco-Oakland-Berkeley", "CA", "cbsa", 4700000, "tech metro", 14, 55, { tech: 0.32, finance: 0.12, health: 0.11, tourism: 0.06 }, 3.9, 0.4, -1.5, 12, 20),
    area("cbsa_41940", "San Jose-Sunnyvale-Santa Clara", "CA", "cbsa", 2000000, "tech metro", 16, 58, { tech: 0.42, manufacturing: 0.16, finance: 0.08, health: 0.08 }, 4.1, -0.2, -2.1, 19, 28),
    area("cbsa_16980", "Chicago-Naperville-Elgin", "IL", "cbsa", 9500000, "large diversified metro", 64, 34, { finance: 0.15, manufacturing: 0.13, logistics: 0.12, health: 0.12 }, 4.8, 0.3, 0.4, 11, 11),
    area("cbsa_35620", "New York-Newark-Jersey City", "NY", "cbsa", 19500000, "global services metro", 78, 29, { finance: 0.24, tech: 0.13, tourism: 0.10, health: 0.13 }, 4.4, 0.8, 0.6, 6, 7),
    area("cbsa_47900", "Washington-Arlington-Alexandria", "DC", "cbsa", 6400000, "government services metro", 82, 43, { government: 0.28, tech: 0.15, health: 0.10, finance: 0.08 }, 3.2, 1.0, 1.2, -5, -4),
    area("cbsa_38060", "Phoenix-Mesa-Chandler", "AZ", "cbsa", 5200000, "growth metro", 34, 61, { construction: 0.13, tech: 0.13, tourism: 0.09, health: 0.12 }, 3.6, 0.6, 3.0, 4, 10),
    area("cbsa_29820", "Las Vegas-Henderson-Paradise", "NV", "cbsa", 2350000, "tourism metro", 21, 61, { tourism: 0.31, construction: 0.11, logistics: 0.07, health: 0.10 }, 5.3, 0.2, 2.2, 14, 18),
    area("cbsa_16740", "Charlotte-Concord-Gastonia", "NC", "cbsa", 2850000, "finance growth metro", 77, 55, { finance: 0.22, logistics: 0.10, manufacturing: 0.10, health: 0.11 }, 3.5, 1.1, 2.4, -2, 1),
    area("cbsa_19820", "Detroit-Warren-Dearborn", "MI", "cbsa", 4350000, "manufacturing metro", 68, 30, { manufacturing: 0.26, auto: 0.18, logistics: 0.08, health: 0.12 }, 5.1, -0.4, 0.2, 18, 24),
    area("cbsa_24220", "Grand Rapids-Kentwood", "MI", "cbsa", 1100000, "mid-market manufacturing", 69, 33, { manufacturing: 0.23, health: 0.13, logistics: 0.07, construction: 0.07 }, 4.0, 0.4, 0.7, 8, 12),
    area("cbsa_12580", "Baltimore-Columbia-Towson", "MD", "cbsa", 2850000, "legacy services metro", 81, 41, { government: 0.14, health: 0.17, logistics: 0.09, finance: 0.08 }, 4.0, 0.5, 0.1, 6, 8),
    area("cbsa_40140", "Riverside-San Bernardino-Ontario", "CA", "cbsa", 4700000, "logistics exurban metro", 20, 59, { logistics: 0.22, construction: 0.11, health: 0.11, tourism: 0.06 }, 5.2, -0.1, 0.8, 13, 17),
    area("cbsa_23420", "Fresno", "CA", "cbsa", 1020000, "agriculture metro", 18, 62, { agriculture: 0.20, logistics: 0.10, health: 0.14, government: 0.10 }, 7.0, -0.5, 0.4, 15, 19),
    area("county_06085", "Santa Clara County", "CA", "county", 1880000, "large tech county", 16, 58, { tech: 0.45, manufacturing: 0.16, finance: 0.07, health: 0.08 }, 4.0, -0.3, -2.5, 21, 31),
    area("county_48201", "Harris County", "TX", "county", 4800000, "energy county", 58, 71, { energy: 0.24, logistics: 0.12, health: 0.12, manufacturing: 0.08 }, 4.3, 0.5, 1.2, 10, 18),
    area("county_26163", "Wayne County", "MI", "county", 1750000, "legacy manufacturing county", 68, 30, { auto: 0.20, manufacturing: 0.22, logistics: 0.08, health: 0.14 }, 6.0, -0.6, -0.2, 24, 30),
    area("county_32003", "Clark County", "NV", "county", 2350000, "tourism county", 21, 61, { tourism: 0.33, construction: 0.12, health: 0.10, logistics: 0.07 }, 5.5, 0.1, 2.0, 16, 19),
    area("county_37119", "Mecklenburg County", "NC", "county", 1160000, "finance county", 77, 55, { finance: 0.25, tech: 0.11, health: 0.11, logistics: 0.08 }, 3.4, 1.0, 2.6, -3, -1),
  ];

  const MONTHS = monthRange(2022, 1, 52);
  const raw = Object.fromEntries(AREAS.map((item) => [item.area_id, makeSeries(item)]));
  const areas = scoreAreas(raw);

  window.STRESS_DATA = {
    meta: {
      product: "Local Economic Stress Radar",
      generated_at: "2026-05-10",
      latest_month: MONTHS[MONTHS.length - 1],
      mode: "deterministic demo data",
      scoring_version: "stress-score-v0.1",
      sources: SOURCES,
    },
    areas,
    timeseries: buildTimeseries(raw, areas),
    backtest: buildBacktest(),
  };

  function area(area_id, name, state, level, population, peer_group, x, y, industry, base_unemp, base_wage, base_housing, risk_bias, shock) {
    return { area_id, name, state, level, population, peer_group, x, y, industry, base_unemp, base_wage, base_housing, risk_bias, shock };
  }

  function monthRange(startYear, startMonth, count) {
    const out = [];
    let year = startYear;
    let month = startMonth;
    for (let index = 0; index < count; index += 1) {
      out.push(`${year}-${String(month).padStart(2, "0")}`);
      month += 1;
      if (month === 13) {
        month = 1;
        year += 1;
      }
    }
    return out;
  }

  function makeSeries(item) {
    let prevEstablishment = 1000 + item.risk_bias * 1.2;
    return MONTHS.map((month, index) => {
      const cyc = Math.sin(index / 5.4 + item.x / 18) * 0.28;
      const late = Math.max(0, (index - 37) / 14);
      const shock = late * item.shock / 10;
      const unemployment = item.base_unemp + cyc + shock * 0.42 + normal(0, 0.08);
      const payroll = 1.9 + item.base_wage * 0.22 - shock * 0.55 + normal(0, 0.22);
      const wage = item.base_wage + 1.5 - shock * 0.23 + normal(0, 0.16);
      const hpi = item.base_housing - shock * 0.30 + Math.sin(index / 7) * 0.35 + normal(0, 0.18);
      const establishment = 1.2 - shock * 0.28 + normal(0, 0.18);
      const rent = clamp(28 + item.risk_bias * 0.25 + shock * 0.55 + normal(0, 0.55), 18, 48);
      const claims = clamp(100 + item.risk_bias * 1.5 + shock * 10 + normal(0, 4), 70, 190);
      const migration = clamp(0.5 - item.risk_bias * 0.015 - shock * 0.05 + normal(0, 0.07), -2, 3);
      prevEstablishment = Math.max(800, prevEstablishment * (1 + establishment / 1200));

      return {
        month,
        unemployment_rate: round(clamp(unemployment, 1.5, 12.5), 2),
        payroll_growth_yoy: round(payroll, 2),
        real_wage_growth_yoy: round(wage, 2),
        hpi_growth_6m: round(hpi, 2),
        establishment_growth_yoy: round(establishment, 2),
        rent_burden: round(rent, 2),
        claims_index: round(claims, 1),
        net_migration_rate: round(migration, 2),
        establishment_index: round(prevEstablishment, 1),
      };
    });
  }

  function scoreAreas(rawSeries) {
    const latestRows = Object.fromEntries(AREAS.map((item) => [item.area_id, rawSeries[item.area_id][rawSeries[item.area_id].length - 1]]));
    const unempValues = Object.values(latestRows).map((row) => row.unemployment_rate);
    const claimsValues = Object.values(latestRows).map((row) => row.claims_index);
    const payrollValues = Object.values(latestRows).map((row) => row.payroll_growth_yoy);
    const wageValues = Object.values(latestRows).map((row) => row.real_wage_growth_yoy);
    const businessValues = Object.values(latestRows).map((row) => row.establishment_growth_yoy);
    const hpiValues = Object.values(latestRows).map((row) => row.hpi_growth_6m);
    const rentValues = Object.values(latestRows).map((row) => row.rent_burden);
    const hhiValues = AREAS.map((item) => weightedHhi(item.industry));

    const ranked = AREAS.map((item) => {
      const latest = latestRows[item.area_id];
      const six = rawSeries[item.area_id].slice(-6);
      const unempTrend = slope(six.map((row) => row.unemployment_rate)) * 6;
      const hhi = weightedHhi(item.industry);

      const labor = pctRank(unempValues, latest.unemployment_rate) * 0.40
        + pctRank(claimsValues, latest.claims_index) * 0.25
        + (100 - pctRank(payrollValues, latest.payroll_growth_yoy)) * 0.25
        + clamp(50 + unempTrend * 14, 0, 100) * 0.10;
      const income = (100 - pctRank(wageValues, latest.real_wage_growth_yoy)) * 0.72
        + clamp(50 - latest.net_migration_rate * 14, 0, 100) * 0.28;
      const business = (100 - pctRank(businessValues, latest.establishment_growth_yoy)) * 0.76
        + clamp(50 + (1000 - latest.establishment_index) / 12, 0, 100) * 0.24;
      const housing = (100 - pctRank(hpiValues, latest.hpi_growth_6m)) * 0.52
        + pctRank(rentValues, latest.rent_burden) * 0.48;
      const concentration = pctRank(hhiValues, hhi) * 0.70 + clamp(45 + item.shock * 1.2, 0, 100) * 0.30;
      const pillars = {
        labor: round(labor, 1),
        income: round(income, 1),
        business: round(business, 1),
        housing: round(housing, 1),
        concentration: round(concentration, 1),
      };
      const score = pillars.labor * 0.30 + pillars.income * 0.18 + pillars.business * 0.18 + pillars.housing * 0.19 + pillars.concentration * 0.15;
      const uncertainty = clamp(8 + 400000 / Math.max(item.population, 200000) + Math.abs(unempTrend) * 2.3, 5, 24);
      const previousScore = scoreForPeriod(rawSeries[item.area_id][rawSeries[item.area_id].length - 4], item, hhi, hhiValues);
      const topIndustry = Object.entries(item.industry).sort((a, b) => b[1] - a[1])[0];
      const drivers = buildDrivers(pillars, latest, unempTrend, topIndustry);
      const risk_band = score >= 70 ? "high" : score >= 55 ? "watch" : "stable";
      const signal_quality = item.population < 600000 || uncertainty > 18 ? "low" : uncertainty > 13 ? "medium" : "high";

      return {
        area_id: item.area_id,
        name: item.name,
        state: item.state,
        level: item.level,
        population: item.population,
        peer_group: item.peer_group,
        x: item.x,
        y: item.y,
        stress_score: round(score, 1),
        score_low: round(Math.max(0, score - uncertainty), 1),
        score_high: round(Math.min(100, score + uncertainty), 1),
        change_3m: round(score - previousScore, 1),
        risk_band,
        signal_quality,
        pillars,
        latest,
        industry: item.industry,
        top_driver: drivers[0],
        drivers,
        headline: makeHeadline(item.name, risk_band, drivers[0], score - previousScore),
      };
    }).sort((a, b) => b.stress_score - a.stress_score);

    ranked.forEach((item, index) => {
      item.rank = index + 1;
    });
    return ranked;
  }

  function scoreForPeriod(row, item, hhi, hhiValues) {
    let stress = 50;
    stress += (row.unemployment_rate - 4) * 5;
    stress -= row.payroll_growth_yoy * 2.2;
    stress -= row.real_wage_growth_yoy * 1.6;
    stress -= row.establishment_growth_yoy * 2.0;
    stress -= row.hpi_growth_6m * 1.3;
    stress += (row.rent_burden - 30) * 1.2;
    stress += pctRank(hhiValues, hhi) * 0.08;
    stress += item.risk_bias * 0.25;
    return clamp(stress, 0, 100);
  }

  function buildDrivers(pillars, latest, unempTrend, topIndustry) {
    return Object.entries(pillars)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, value]) => {
        if (key === "labor") {
          return driver(key, value, `Labor stress: unemployment ${latest.unemployment_rate}%, six-month trend ${signed(unempTrend, 1)} pts`, "BLS_LAUS");
        }
        if (key === "income") {
          return driver(key, value, `Income pressure: real wage growth ${latest.real_wage_growth_yoy}%, migration ${latest.net_migration_rate}%`, "BEA_CA_INCOME");
        }
        if (key === "business") {
          return driver(key, value, `Business dynamism: establishments ${latest.establishment_growth_yoy}% YoY`, "BLS_QCEW");
        }
        if (key === "housing") {
          return driver(key, value, `Housing pressure: HPI ${latest.hpi_growth_6m}% over six months, rent burden ${latest.rent_burden}%`, "FHFA_HPI");
        }
        return driver(key, value, `Concentration risk: ${topIndustry[0]} exposure is ${Math.round(topIndustry[1] * 100)}% of modeled employment`, "BLS_QCEW");
      });
  }

  function driver(pillar, score, label, source) {
    return { pillar, score: round(score, 1), label, source };
  }

  function makeHeadline(name, band, driverItem, change3m) {
    const direction = change3m > 4 ? "rising" : change3m < -4 ? "easing" : "steady";
    if (band === "high") {
      return `${name} is in the high-stress tier with ${driverItem.pillar} as the main driver; risk is ${direction} over 3 months.`;
    }
    if (band === "watch") {
      return `${name} is on watch, led by ${driverItem.pillar} pressure; risk is ${direction} over 3 months.`;
    }
    return `${name} remains relatively stable, though ${driverItem.pillar} is the highest-pressure pillar.`;
  }

  function buildTimeseries(rawSeries, latestAreas) {
    const areaById = Object.fromEntries(AREAS.map((item) => [item.area_id, item]));
    const latestById = Object.fromEntries(latestAreas.map((item) => [item.area_id, item]));
    const hhiValues = AREAS.map((item) => weightedHhi(item.industry));

    return Object.fromEntries(Object.entries(rawSeries).map(([areaId, rows]) => {
      const item = areaById[areaId];
      const hhi = weightedHhi(item.industry);
      const scoredRows = rows.map((row) => ({
        month: row.month,
        stress_score: round(scoreForPeriod(row, item, hhi, hhiValues), 1),
        unemployment_rate: row.unemployment_rate,
        payroll_growth_yoy: row.payroll_growth_yoy,
      }));
      const finalScore = latestById[areaId].stress_score;
      const delta = finalScore - scoredRows[scoredRows.length - 1].stress_score;
      scoredRows[scoredRows.length - 1].stress_score = finalScore;
      if (Math.abs(delta) > 0.1) {
        const start = Math.max(0, scoredRows.length - 6);
        for (let index = start; index < scoredRows.length - 1; index += 1) {
          scoredRows[index].stress_score = round(scoredRows[index].stress_score + delta * (index - start) / 6, 1);
        }
      }
      return [areaId, scoredRows];
    }));
  }

  function buildBacktest() {
    return {
      label: "future unemployment spike or payroll decline",
      window: "rolling-origin demo panel, 2022-2026",
      base_rate: 0.09,
      pr_auc: 0.24,
      pr_auc_lift: 2.7,
      recall_at_30_precision: 0.61,
      median_lead_months: 3.2,
      rank_stability: 0.82,
      notes: [
        "Demo metrics are placeholders for UI and workflow validation.",
        "Real backtests must separate true historical vintages from release-lag masked revised data.",
        "First real labels should be unemployment spikes and payroll declines before any composite stress label.",
      ],
    };
  }

  function weightedHhi(industry) {
    return Object.values(industry).reduce((total, share) => total + (share * 100) ** 2, 0);
  }

  function pctRank(values, value) {
    const below = values.filter((item) => item <= value).length;
    return 100 * (below - 0.5) / values.length;
  }

  function slope(values) {
    const n = values.length;
    const xBar = (n - 1) / 2;
    const yBar = values.reduce((sum, value) => sum + value, 0) / n;
    const denom = values.reduce((sum, _value, index) => sum + (index - xBar) ** 2, 0);
    return denom ? values.reduce((sum, value, index) => sum + (index - xBar) * (value - yBar), 0) / denom : 0;
  }

  function mulberry32(seed) {
    let value = seed;
    return () => {
      value += 0x6D2B79F5;
      let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(mean, sd) {
    if (spareNormal !== null) {
      const value = spareNormal;
      spareNormal = null;
      return mean + value * sd;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    const mag = Math.sqrt(-2 * Math.log(u));
    spareNormal = mag * Math.sin(2 * Math.PI * v);
    return mean + mag * Math.cos(2 * Math.PI * v) * sd;
  }

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  function round(value, digits) {
    const factor = 10 ** digits;
    const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  function signed(value, digits) {
    const rounded = round(value, digits).toFixed(digits);
    return Number(rounded) > 0 ? `+${rounded}` : rounded;
  }
})();
