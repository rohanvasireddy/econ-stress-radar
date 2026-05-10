const data = window.STRESS_DATA;
const page = document.body.dataset.page || "radar";

const params = new URLSearchParams(window.location.search);
const defaultAreaId = data.areas[0]?.area_id;
const requestedAreaId = params.get("area");

const state = {
  metric: "stress_score",
  query: "",
  level: "all",
  risk: "all",
  selectedId: data.areas.some((area) => area.area_id === requestedAreaId)
    ? requestedAreaId
    : defaultAreaId,
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  levelFilter: document.querySelector("#levelFilter"),
  riskFilter: document.querySelector("#riskFilter"),
  metricTabs: document.querySelectorAll(".metric-tab"),
  highRiskCount: document.querySelector("#highRiskCount"),
  risingCount: document.querySelector("#risingCount"),
  medianScore: document.querySelector("#medianScore"),
  leadTime: document.querySelector("#leadTime"),
  resultCount: document.querySelector("#resultCount"),
  rankList: document.querySelector("#rankList"),
  stressMap: document.querySelector("#stressMap"),
  detailContent: document.querySelector("#detailContent"),
  mapTitle: document.querySelector("#mapTitle"),
  areaPageTitle: document.querySelector("#areaPageTitle"),
  areaPageSubtitle: document.querySelector("#areaPageSubtitle"),
  backtestStats: document.querySelector("#backtestStats"),
  backtestNotes: document.querySelector("#backtestNotes"),
  validationGauge: document.querySelector("#validationGauge"),
  validationSummaryCards: document.querySelector("#validationSummaryCards"),
  validationLiftChart: document.querySelector("#validationLiftChart"),
  validationConfusionMatrix: document.querySelector("#validationConfusionMatrix"),
  validationModelTable: document.querySelector("#validationModelTable"),
  validationGateList: document.querySelector("#validationGateList"),
  sourceList: document.querySelector("#sourceList"),
  riskMix: document.querySelector("#riskMix"),
  driverMix: document.querySelector("#driverMix"),
  moverList: document.querySelector("#moverList"),
  regionalTable: document.querySelector("#regionalTable"),
  releaseCalendar: document.querySelector("#releaseCalendar"),
  sourcePriority: document.querySelector("#sourcePriority"),
  radarBrief: document.querySelector("#radarBrief"),
  areaBrief: document.querySelector("#areaBrief"),
  mapNarrative: document.querySelector("#mapNarrative"),
};

function fmtNumber(value, digits = 1) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function fmtPopulation(value) {
  if (value >= 1000000) return `${fmtNumber(value / 1000000, 1)}M`;
  return `${Math.round(value / 1000)}K`;
}

function pluralize(count, singular) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function labelize(value) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function scoreColor(score) {
  if (score >= 70) return "var(--high)";
  if (score >= 55) return "var(--mid)";
  return "var(--low)";
}

function actionLabel(area) {
  if (area.risk_band === "high" && area.change_3m > 2) return "Escalate";
  if (area.risk_band === "high") return "Monitor closely";
  if (area.change_3m > 2) return "Watch trend";
  return "Keep in queue";
}

function actionTone(area) {
  if (area.risk_band === "high") return "high";
  if (area.change_3m > 2 || area.risk_band === "watch") return "watch";
  return "stable";
}

function metricValue(area) {
  if (state.metric === "uncertainty") return area.score_high - area.score_low;
  return area[state.metric];
}

function metricColor(area) {
  const value = metricValue(area);
  if (state.metric === "change_3m") {
    if (value >= 8) return "var(--high)";
    if (value >= 2) return "var(--mid)";
    return "var(--low)";
  }
  if (state.metric === "uncertainty") {
    if (value >= 30) return "var(--high)";
    if (value >= 20) return "var(--mid)";
    return "var(--blue)";
  }
  return scoreColor(area.stress_score);
}

function sourceById(sourceId) {
  return data.meta.sources.find((source) => source.id === sourceId);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function filteredAreas() {
  const q = state.query.trim().toLowerCase();
  return data.areas.filter((area) => {
    const matchesQuery =
      !q ||
      area.name.toLowerCase().includes(q) ||
      area.state.toLowerCase().includes(q) ||
      area.peer_group.toLowerCase().includes(q);
    const matchesLevel = state.level === "all" || area.level === state.level;
    const matchesRisk = state.risk === "all" || area.risk_band === state.risk;
    return matchesQuery && matchesLevel && matchesRisk;
  });
}

function setMeta() {
  document
    .querySelectorAll("[data-latest-month]")
    .forEach((el) => (el.textContent = `Latest: ${data.meta.latest_month}`));
  document
    .querySelectorAll("[data-data-mode]")
    .forEach((el) => (el.textContent = data.meta.mode));

  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === page);
  });
}

function selectedArea(areas = data.areas) {
  if (!areas.some((area) => area.area_id === state.selectedId)) {
    state.selectedId = areas[0]?.area_id || defaultAreaId;
  }
  return data.areas.find((area) => area.area_id === state.selectedId) || data.areas[0];
}

function updateKpis(areas) {
  if (!els.highRiskCount) return;

  const high = areas.filter((area) => area.risk_band === "high").length;
  const rising = areas.filter((area) => area.change_3m > 2).length;
  const scores = areas.map((area) => area.stress_score).sort((a, b) => a - b);
  const median = scores.length ? scores[Math.floor(scores.length / 2)] : 0;

  els.highRiskCount.textContent = high;
  els.risingCount.textContent = rising;
  els.medianScore.textContent = fmtNumber(median, 1);
  els.leadTime.textContent = `${fmtNumber(data.backtest.median_lead_months, 1)} mo`;
}

function renderScoreDial(value, label, sublabel = "") {
  const angle = Math.max(0, Math.min(100, value)) * 3.6;
  return `
    <div class="score-dial" style="--dial:${angle}deg;--dial-color:${scoreColor(value)}">
      <div>
        <strong>${fmtNumber(value, 1)}</strong>
        <span>${label}</span>
        ${sublabel ? `<small>${sublabel}</small>` : ""}
      </div>
    </div>
  `;
}

function renderRadarBrief(areas) {
  if (!els.radarBrief) return;

  const top = [...areas].sort((a, b) => b.stress_score - a.stress_score)[0] || data.areas[0];
  const fastest = [...areas].sort((a, b) => b.change_3m - a.change_3m)[0] || top;
  const high = areas.filter((area) => area.risk_band === "high").length;
  const median = average(areas.map((area) => area.stress_score));
  const dominantDriver = Object.entries(countBy(areas, (area) => area.top_driver.pillar)).sort((a, b) => b[1] - a[1])[0]?.[0] || "labor";

  els.radarBrief.innerHTML = `
    <article class="decision-card decision-card-primary">
      <span class="decision-kicker">Nowcast readout</span>
      <strong>${high} high-risk places in the current screen.</strong>
      <small>${labelize(dominantDriver)} is the most common primary driver across the filtered portfolio.</small>
    </article>
    <article class="decision-card visual-card">
      ${renderScoreDial(top.stress_score, "Top risk", top.name)}
    </article>
    <article class="decision-card">
      <span class="decision-kicker">Next click</span>
      <strong>${actionLabel(fastest)} ${fastest.name}.</strong>
      <small>${fastest.change_3m >= 0 ? "+" : ""}${fmtNumber(fastest.change_3m, 1)} points over three months; ${fastest.top_driver.label}</small>
      <a class="text-link" href="area.html?area=${encodeURIComponent(fastest.area_id)}">Open area detail</a>
    </article>
  `;

  if (els.mapNarrative) {
    els.mapNarrative.innerHTML = `
      <div><strong>${fmtNumber(median, 1)}</strong><span>Average stress score in current filter</span></div>
      <div><strong>${top.name}</strong><span>Highest-ranked area</span></div>
      <div><strong>${labelize(dominantDriver)}</strong><span>Dominant risk driver</span></div>
    `;
  }
}

function rankRowMarkup(area, mode) {
  const width = Math.max(6, area.stress_score);
  const active = area.area_id === state.selectedId ? "active" : "";
  const score = `<span class="score-pill ${area.risk_band}">${fmtNumber(area.stress_score, 1)}</span>`;
  const content = `
    <span class="rank-top">
      <span>
        <span class="rank-name">${area.rank}. ${area.name}</span>
        <span class="rank-meta">${area.state} · ${area.level.toUpperCase()} · ${fmtPopulation(area.population)} · ${area.signal_quality} signal</span>
      </span>
      ${score}
    </span>
    <span class="row-bar"><span style="width:${width}%;background:${scoreColor(area.stress_score)}"></span></span>
    <span class="rank-meta">${area.top_driver.label}</span>
  `;

  if (mode === "link") {
    return `<a class="rank-row ${active}" href="area.html?area=${encodeURIComponent(area.area_id)}">${content}</a>`;
  }

  return `<button class="rank-row ${active}" data-area-id="${area.area_id}" type="button">${content}</button>`;
}

function renderRankList(areas, mode = "button") {
  if (!els.rankList) return;

  els.resultCount.textContent = pluralize(areas.length, "place");
  els.rankList.innerHTML = areas.map((area) => rankRowMarkup(area, mode)).join("");

  if (mode !== "button") return;

  els.rankList.querySelectorAll(".rank-row").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.areaId;
      const url = new URL(window.location.href);
      url.searchParams.set("area", state.selectedId);
      history.replaceState(null, "", url);
      renderAreaPage();
    });
  });
}

function renderMap(areas) {
  if (!els.stressMap) return;

  const title =
    state.metric === "stress_score"
      ? "Stress score"
      : state.metric === "change_3m"
        ? "Three-month change"
        : "Forecast uncertainty";
  els.mapTitle.textContent = title;

  const points = areas
    .map((area) => {
      const selected = area.area_id === state.selectedId;
      const radius = selected ? 3.4 : area.level === "cbsa" ? 2.45 : 2.05;
      const value = metricValue(area);
      const label = area.name.split("-")[0].slice(0, 16);
      return `
        <a href="area.html?area=${encodeURIComponent(area.area_id)}" aria-label="${area.name}, ${fmtNumber(value, 1)}">
          <circle class="map-point" cx="${area.x}" cy="${area.y}" r="${radius}"
            fill="${metricColor(area)}" opacity="${selected ? 1 : 0.84}">
            <title>${area.name}: ${fmtNumber(value, 1)}</title>
          </circle>
          ${selected ? `<text class="map-label" x="${area.x + 3.4}" y="${area.y - 2}">${label}</text>` : ""}
        </a>
      `;
    })
    .join("");

  els.stressMap.innerHTML = `
    <path d="M8 51 C13 31 27 22 44 22 C55 18 70 20 84 29 C91 37 91 52 80 60 C62 72 34 70 17 62 C9 58 6 55 8 51 Z"
      fill="#eef1ed" stroke="#d9dfd7" stroke-width="0.6"></path>
    <path d="M13 57 C22 63 39 66 55 64 C70 62 82 57 87 48" fill="none" stroke="#d9dfd7" stroke-width="0.35"></path>
    <path d="M32 25 C30 34 31 45 37 64" fill="none" stroke="#d9dfd7" stroke-width="0.35"></path>
    <path d="M58 22 C57 35 59 48 64 63" fill="none" stroke="#d9dfd7" stroke-width="0.35"></path>
    ${points}
  `;
}

function renderRadarInsights(areas) {
  if (!els.riskMix) return;

  const riskCounts = countBy(areas, (area) => area.risk_band);
  const riskLabels = [
    ["high", "High risk"],
    ["watch", "Watch"],
    ["stable", "Stable"],
  ];
  els.riskMix.innerHTML = riskLabels
    .map(([key, label]) => {
      const count = riskCounts[key] || 0;
      const share = areas.length ? (count / areas.length) * 100 : 0;
      return `
        <div class="bar-row">
          <div><strong>${label}</strong><span>${pluralize(count, "place")}</span></div>
          <div class="bar-line"><span class="${key}" style="width:${share}%"></span></div>
          <b>${fmtNumber(share, 0)}%</b>
        </div>
      `;
    })
    .join("");

  const driverCounts = countBy(areas, (area) => area.top_driver.pillar);
  const driverRows = Object.entries(driverCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pillar, count]) => {
      const share = areas.length ? (count / areas.length) * 100 : 0;
      return `
        <div class="bar-row">
          <div><strong>${labelize(pillar)}</strong><span>${pluralize(count, "area")}</span></div>
          <div class="bar-line"><span style="width:${share}%;background:${scoreColor(45 + share)}"></span></div>
          <b>${fmtNumber(share, 0)}%</b>
        </div>
      `;
    });
  els.driverMix.innerHTML = driverRows.join("");

  els.moverList.innerHTML = [...areas]
    .sort((a, b) => b.change_3m - a.change_3m)
    .slice(0, 5)
    .map(
      (area) => `
        <a class="mini-row" href="area.html?area=${encodeURIComponent(area.area_id)}">
          <span><strong>${area.name}</strong><small>${area.state} · ${area.level.toUpperCase()}</small></span>
          <b>${area.change_3m >= 0 ? "+" : ""}${fmtNumber(area.change_3m, 1)}</b>
        </a>
      `,
    )
    .join("");

  els.regionalTable.innerHTML = `
    <div class="table-row table-head"><span>Area</span><span>Band</span><span>Score</span><span>3 mo</span><span>Primary driver</span></div>
    ${[...areas]
      .sort((a, b) => b.stress_score - a.stress_score)
      .slice(0, 10)
      .map(
        (area) => `
          <a class="table-row" href="area.html?area=${encodeURIComponent(area.area_id)}">
            <span><strong>${area.name}</strong><small>${area.state} · ${area.level.toUpperCase()}</small></span>
            <span><em class="band ${area.risk_band}">${area.risk_band}</em></span>
            <span>${fmtNumber(area.stress_score, 1)}</span>
            <span>${area.change_3m >= 0 ? "+" : ""}${fmtNumber(area.change_3m, 1)}</span>
            <span>${labelize(area.top_driver.pillar)}</span>
          </a>
        `,
      )
      .join("")}
  `;
}

function renderDetail(area) {
  if (!els.detailContent) return;

  const latest = area.latest;
  const ts = data.timeseries[area.area_id] || [];
  const industry = Object.entries(area.industry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, share]) => `${name} ${Math.round(share * 100)}%`)
    .join(" · ");
  const peerAreas = data.areas
    .filter((peer) => peer.area_id !== area.area_id && (peer.peer_group === area.peer_group || peer.level === area.level))
    .sort((a, b) => Math.abs(a.stress_score - area.stress_score) - Math.abs(b.stress_score - area.stress_score))
    .slice(0, 5);
  const localAverage = average(peerAreas.map((peer) => peer.stress_score));
  const driverSource = sourceById(area.top_driver.source);

  if (els.areaBrief) {
    els.areaBrief.innerHTML = `
      <article class="decision-card decision-card-primary ${actionTone(area)}">
        <span class="decision-kicker">Analyst action</span>
        <strong>${actionLabel(area)} ${area.name}.</strong>
        <small>${area.top_driver.label}</small>
      </article>
      <article class="decision-card visual-card">
        ${renderScoreDial(area.stress_score, "Stress score", `${area.score_low}-${area.score_high} interval`)}
      </article>
      <article class="decision-card">
        <span class="decision-kicker">Evidence trail</span>
        <strong>${driverSource ? driverSource.name : area.top_driver.source}</strong>
        <small>${driverSource ? driverSource.release_date : "Release metadata pending"} · ${area.signal_quality} signal quality</small>
      </article>
    `;
  }

  els.areaPageTitle.textContent = area.name;
  els.areaPageSubtitle.textContent = `${area.state} · ${area.level.toUpperCase()} · ${area.peer_group} · ${fmtPopulation(area.population)} people`;
  document.title = `${area.name} | Local Economic Stress Radar`;

  els.detailContent.innerHTML = `
    <div class="detail-header ${actionTone(area)}">
      <div>
        <p class="eyebrow">${area.level.toUpperCase()} · ${area.peer_group}</p>
        <h2>${area.name}</h2>
        <p class="detail-copy">${area.headline}</p>
      </div>
      <span class="band ${area.risk_band}">${area.risk_band}</span>
    </div>

    <div class="detail-hero">
      <div>
        <span>Stress score</span>
        <strong>${fmtNumber(area.stress_score, 1)}</strong>
      </div>
      <div>
        <span>Score interval</span>
        <strong>${fmtNumber(area.score_low, 1)}-${fmtNumber(area.score_high, 1)}</strong>
      </div>
      <div>
        <span>3 mo change</span>
        <strong>${area.change_3m >= 0 ? "+" : ""}${fmtNumber(area.change_3m, 1)}</strong>
      </div>
    </div>

    ${renderMiniChart(ts)}

    <div class="metric-grid">
      <div class="metric"><span>Unemployment</span><strong>${fmtNumber(latest.unemployment_rate, 1)}%</strong></div>
      <div class="metric"><span>Payroll growth</span><strong>${fmtNumber(latest.payroll_growth_yoy, 1)}%</strong></div>
      <div class="metric"><span>Real wage growth</span><strong>${fmtNumber(latest.real_wage_growth_yoy, 1)}%</strong></div>
      <div class="metric"><span>HPI 6 mo</span><strong>${fmtNumber(latest.hpi_growth_6m, 1)}%</strong></div>
    </div>

    <section class="detail-section">
      <h3>Pillar decomposition</h3>
      <div class="pillars">
        ${Object.entries(area.pillars)
          .map(
            ([name, value]) => `
              <div class="pillar">
                <span>${labelize(name)}</span>
                <div class="pillar-track"><span style="width:${value}%;background:${scoreColor(value)}"></span></div>
                <strong>${fmtNumber(value, 0)}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="detail-section">
      <h3>Top drivers</h3>
      <div class="driver-list">
        ${area.drivers
          .map(
            (driver) => `
              <div class="driver">
                <strong>${labelize(driver.pillar)} · ${fmtNumber(driver.score, 1)}</strong>
                <span>${driver.label}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="detail-section">
      <h3>Industry exposure</h3>
      <p class="detail-copy">${industry}</p>
    </section>

    <section class="detail-section">
      <h3>Local operating readout</h3>
      <div class="readout-grid">
        <div><strong>Labor pressure</strong><span>${fmtNumber(latest.unemployment_rate, 1)}% unemployment with ${fmtNumber(latest.claims_index, 0)} claims index.</span></div>
        <div><strong>Household strain</strong><span>${fmtNumber(latest.real_wage_growth_yoy, 1)}% real wage growth and ${fmtNumber(latest.rent_burden, 1)}% rent burden.</span></div>
        <div><strong>Business pulse</strong><span>${fmtNumber(latest.establishment_growth_yoy, 1)}% establishment growth year over year.</span></div>
        <div><strong>Peer context</strong><span>${fmtNumber(area.stress_score - localAverage, 1)} points versus nearby comparable areas.</span></div>
      </div>
    </section>

    <section class="detail-section">
      <h3>Peer comparison</h3>
      <div class="data-table compact-table">
        <div class="table-row table-head"><span>Peer</span><span>Score</span><span>Band</span><span>Driver</span></div>
        ${peerAreas
          .map(
            (peer) => `
              <a class="table-row" href="area.html?area=${encodeURIComponent(peer.area_id)}">
                <span><strong>${peer.name}</strong><small>${peer.state} · ${peer.level.toUpperCase()}</small></span>
                <span>${fmtNumber(peer.stress_score, 1)}</span>
                <span><em class="band ${peer.risk_band}">${peer.risk_band}</em></span>
                <span>${labelize(peer.top_driver.pillar)}</span>
              </a>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="detail-section">
      <h3>Source trace</h3>
      <div class="source-trace">
        ${area.drivers
          .map((driver) => {
            const source = sourceById(driver.source);
            return `
              <div>
                <strong>${driver.source}</strong>
                <span>${source ? source.name : "Modeled source"} · ${source ? source.release_date : "release metadata pending"}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>

    <section class="detail-section">
      <h3>Next analyst checks</h3>
      <div class="question-list">
        ${area.drivers
          .map(
            (driver) => `
              <div>Confirm whether ${labelize(driver.pillar).toLowerCase()} pressure is broad-based or concentrated in one industry/geography segment.</div>
            `,
          )
          .join("")}
        <div>Compare the latest signal against employer announcements and local budget conditions before escalating.</div>
      </div>
    </section>
  `;
}

function renderMiniChart(ts) {
  if (!ts.length) return "";
  const width = 640;
  const height = 210;
  const pad = 24;
  const values = ts.map((row) => Number(row.stress_score));
  const min = Math.min(...values, 35);
  const max = Math.max(...values, 85);
  const points = values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((value - min) / (max - min || 1)) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const lastY = height - pad - ((last - min) / (max - min || 1)) * (height - pad * 2);
  return `
    <svg class="mini-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Stress score time series">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#d9dfd7" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#d9dfd7" />
      <polyline fill="none" stroke="${scoreColor(last)}" stroke-width="4" points="${points}" />
      <circle cx="${width - pad}" cy="${lastY}" r="6" fill="${scoreColor(last)}" />
      <text x="${pad}" y="17" font-size="13" fill="#65706a">Stress score history</text>
    </svg>
  `;
}

function renderBacktest() {
  if (!els.backtestStats) return;

  const b = data.backtest;
  const precision = 0.3;
  const sampleSize = 1000;
  const positives = Math.round(sampleSize * b.base_rate);
  const truePositive = Math.round(positives * b.recall_at_30_precision);
  const predictedPositive = Math.round(truePositive / precision);
  const falsePositive = Math.max(0, predictedPositive - truePositive);
  const falseNegative = Math.max(0, positives - truePositive);
  const trueNegative = Math.max(0, sampleSize - positives - falsePositive);

  const stats = [
    ["Target", b.label],
    ["Window", b.window],
    ["PR-AUC lift", `${fmtNumber(b.pr_auc_lift, 1)}x base rate`],
    ["Recall @ 30% precision", `${Math.round(b.recall_at_30_precision * 100)}%`],
    ["Median lead", `${fmtNumber(b.median_lead_months, 1)} mo`],
    ["Rank stability", fmtNumber(b.rank_stability, 2)],
  ];
  els.backtestStats.innerHTML = stats
    .map(
      ([label, value]) => `
        <div class="metric">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");

  if (els.backtestNotes) {
    els.backtestNotes.innerHTML = b.notes
      .map((note) => `<div class="note-item">${note}</div>`)
      .join("");
  }

  if (els.validationGauge) {
    const readiness = Math.round((b.rank_stability * 36) + (b.recall_at_30_precision * 28) + (Math.min(b.pr_auc_lift, 3) / 3) * 24);
    els.validationGauge.innerHTML = `
      ${renderScoreDial(readiness, "Demo readiness", "not production ready")}
      <div>
        <strong>${readiness}/100</strong>
        <span>Workflow confidence, not model approval. The missing pieces are real vintages and source snapshots.</span>
      </div>
    `;
  }

  if (els.validationSummaryCards) {
    els.validationSummaryCards.innerHTML = `
      <article class="mini-decision-card">
        <span>Lead time</span>
        <strong>${fmtNumber(b.median_lead_months, 1)} mo</strong>
        <small>Enough time for useful intervention if the signal survives real-vintage testing.</small>
      </article>
      <article class="mini-decision-card">
        <span>Lift</span>
        <strong>${fmtNumber(b.pr_auc_lift, 1)}x</strong>
        <small>Demo PR-AUC lift over base rate; must be recreated with masked releases.</small>
      </article>
      <article class="mini-decision-card">
        <span>Recall</span>
        <strong>${Math.round(b.recall_at_30_precision * 100)}%</strong>
        <small>At 30% precision, high enough to inspect misses and false alarms.</small>
      </article>
    `;
  }

  if (els.validationLiftChart) {
    const baseY = 150 - b.base_rate * 360;
    const modelX = 82 + b.recall_at_30_precision * 330;
    const modelY = 150 - precision * 300;
    els.validationLiftChart.innerHTML = `
      <svg viewBox="0 0 520 220" role="img" aria-label="Demo precision recall chart">
        <rect x="0" y="0" width="520" height="220" rx="8" fill="#fbfcfa"></rect>
        <line x1="64" y1="24" x2="64" y2="170" stroke="#d9dfd7"></line>
        <line x1="64" y1="170" x2="480" y2="170" stroke="#d9dfd7"></line>
        <line x1="64" y1="${baseY}" x2="480" y2="${baseY}" stroke="#b9842a" stroke-dasharray="6 6"></line>
        <path d="M72 151 C152 128 215 104 298 93 C362 84 419 78 470 66" fill="none" stroke="#456c91" stroke-width="4"></path>
        <circle cx="${modelX}" cy="${modelY}" r="7" fill="#b14a42"></circle>
        <text x="64" y="196" fill="#65706a" font-size="12">Recall</text>
        <text x="16" y="30" fill="#65706a" font-size="12">Precision</text>
        <text x="310" y="${baseY - 8}" fill="#745014" font-size="12">base rate ${Math.round(b.base_rate * 100)}%</text>
        <text x="${modelX + 12}" y="${modelY - 8}" fill="#17201b" font-size="12">operating point</text>
      </svg>
      <div class="chart-caption">
        <strong>Demo operating point:</strong>
        ${Math.round(precision * 100)}% precision with ${Math.round(b.recall_at_30_precision * 100)}% recall.
      </div>
    `;
  }

  if (els.validationConfusionMatrix) {
    els.validationConfusionMatrix.innerHTML = `
      <p class="eyebrow">Demo confusion matrix</p>
      <h3>1,000 scored areas</h3>
      <div class="matrix-grid">
        <div><span>True positives</span><strong>${truePositive}</strong></div>
        <div><span>False positives</span><strong>${falsePositive}</strong></div>
        <div><span>False negatives</span><strong>${falseNegative}</strong></div>
        <div><span>True negatives</span><strong>${trueNegative}</strong></div>
      </div>
      <p class="body-copy">These counts are illustrative, derived from the demo base rate and recall. The real matrix should be segmented by geography size and source availability.</p>
    `;
  }

  if (els.validationModelTable) {
    const modelRows = [
      ["Transparent score", "active demo", `${fmtNumber(b.pr_auc_lift, 1)}x`, `${Math.round(b.recall_at_30_precision * 100)}%`, "Inspectable drivers"],
      ["Regularized logistic", "next", "TBD", "TBD", "Coefficient sanity check"],
      ["LightGBM", "later", "TBD", "TBD", "Only after leakage audit"],
      ["LLM brief", "blocked", "n/a", "n/a", "Summarize only trusted drivers"],
    ];
    els.validationModelTable.innerHTML = `
      <div class="table-row table-head"><span>Model</span><span>Status</span><span>Lift</span><span>Recall</span><span>Use case</span></div>
      ${modelRows
        .map(
          ([model, status, lift, recall, use]) => `
            <div class="table-row">
              <span><strong>${model}</strong><small>${use}</small></span>
              <span><em class="status-pill">${status}</em></span>
              <span>${lift}</span>
              <span>${recall}</span>
              <span>${use}</span>
            </div>
          `,
        )
        .join("")}
    `;
  }

  if (els.validationGateList) {
    const gates = [
      ["Release-date masking", "blocked", "Need source-level availability dates before historical scoring is credible."],
      ["Simple outcome labels", "ready", "Unemployment spikes and payroll declines are observable and easy to defend."],
      ["Segment stability", "demo", "Rank stability is shown, but needs geography-size slices."],
      ["Calibration", "demo", "Precision-recall workflow exists; probability calibration still pending."],
      ["Interpretability", "ready", "Pillar decomposition and source trace are visible in area pages."],
      ["Miss review", "next", "False negatives need structured analyst notes after real backtest runs."],
    ];
    els.validationGateList.innerHTML = gates
      .map(
        ([name, status, copy]) => `
          <div class="gate-card ${status}">
            <span>${status}</span>
            <strong>${name}</strong>
            <small>${copy}</small>
          </div>
        `,
      )
      .join("");
  }
}

function renderSources() {
  if (!els.sourceList) return;

  els.sourceList.innerHTML = data.meta.sources
    .map(
      (source) => `
        <article class="source-card">
          <div>
            <strong>${source.name}</strong>
            <a href="${source.source_url}" target="_blank" rel="noreferrer">${source.id}</a>
          </div>
          <span>${source.series}</span>
          <span>${source.release_date}</span>
          <span>${source.prototype_status}</span>
        </article>
      `,
    )
    .join("");

  if (els.releaseCalendar) {
    els.releaseCalendar.innerHTML = data.meta.sources
      .map(
        (source) => `
          <div class="calendar-row">
            <strong>${source.name}</strong>
            <span>${source.release_date}</span>
            <small>${source.series}</small>
          </div>
        `,
      )
      .join("");
  }

  if (els.sourcePriority) {
    const priorities = {
      BLS_LAUS: ["1", "Core monthly labor signal and first production ingestion target."],
      BLS_QCEW: ["2", "Essential industry concentration and wage context, but lagged quarterly."],
      ACS_5YR: ["3", "Static structural controls for income, commuting, and housing burden."],
      FRED: ["4", "Macro controls for state and national regime conditions."],
      FHFA_HPI: ["5", "Optional housing proxy after labor and industry signals are stable."],
    };
    els.sourcePriority.innerHTML = data.meta.sources
      .map((source) => {
        const [rank, reason] = priorities[source.id] || ["-", "Add after core public feeds are stable."];
        return `
          <div class="priority-row">
            <b>${rank}</b>
            <span><strong>${source.name}</strong><small>${reason}</small></span>
          </div>
        `;
      })
      .join("");
  }
}

function renderRadarPage() {
  const areas = filteredAreas();
  selectedArea(areas);
  renderRadarBrief(areas);
  updateKpis(areas);
  renderRankList(areas, "link");
  renderMap(areas);
  renderRadarInsights(areas);
}

function renderAreaPage() {
  const areas = filteredAreas();
  const area = selectedArea(areas);
  renderRankList(areas, "button");
  renderDetail(area);
}

function renderCurrentPage() {
  if (page === "area") {
    renderAreaPage();
    return;
  }
  if (page === "radar") {
    renderRadarPage();
  }
}

function bindEvents() {
  els.searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCurrentPage();
  });

  els.levelFilter?.addEventListener("change", (event) => {
    state.level = event.target.value;
    renderCurrentPage();
  });

  els.riskFilter?.addEventListener("change", (event) => {
    state.risk = event.target.value;
    renderCurrentPage();
  });

  els.metricTabs.forEach((button) => {
    button.addEventListener("click", () => {
      els.metricTabs.forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      state.metric = button.dataset.metric;
      renderCurrentPage();
    });
  });
}

function init() {
  setMeta();
  bindEvents();
  renderBacktest();
  renderSources();
  renderCurrentPage();
}

init();
