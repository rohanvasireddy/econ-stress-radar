# Data Dictionary

## Entity Grain

The prototype uses one row per `area_month`.

- `area_id`: stable identifier for a CBSA or county
- `level`: `cbsa` or `county`
- `month`: `YYYY-MM`
- `population`: latest population estimate used for low-signal warnings
- `peer_group`: economic peer cluster used for relative scoring

## Pillars

Each area receives five pillar scores from 0 to 100.

- `labor`: unemployment level, unemployment momentum, payroll trend
- `income`: real wage growth and transfer-dependence proxy
- `business`: establishment growth and business-formation proxy
- `housing`: HPI momentum, rent pressure, affordability proxy
- `concentration`: industry concentration and exposure to national shocks

The final `stress_score` is a weighted sum of pillars:

```text
0.30 labor + 0.18 income + 0.18 business + 0.19 housing + 0.15 concentration
```

## Directionality

Higher score means higher stress.

Positive contributors:

- rising unemployment
- payroll contraction
- weak wage growth
- falling establishments
- negative housing momentum
- rising rent burden
- concentrated industry exposure

## Prototype Backtest

The demo script simulates a historical validation panel and reports:

- PR-AUC lift versus base rate
- recall at fixed precision
- median lead time
- rank stability

In the real pipeline, the first validation labels should be simpler:

1. future unemployment spike
2. future payroll employment decline
3. optional composite stress label after the first two are reliable

## Provenance Contract

Every real source row should eventually carry:

- `source`
- `source_url`
- `release_date`
- `vintage_date`
- `geo_vintage`

The dashboard already displays these fields from `meta.sources`.
