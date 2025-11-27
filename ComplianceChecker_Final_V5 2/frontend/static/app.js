/* ========================================================================
   AI COMPLIANCE CHECKER — FINAL STABLE FRONTEND (Single-Page Version)
   Analyzer + Dashboard + Email Preview + History + Charts
   Author: FINAL CLEAN BUILD
======================================================================= */

console.log("%c[APP] Final Stable Version Loaded", "color:#ff66b3;font-weight:bold;");

/* -----------------------------------------------------------
   BASIC HELPERS
----------------------------------------------------------- */
const $ = (id) => document.getElementById(id);

const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : location.origin;

/* -----------------------------------------------------------
   DOM REFERENCES
----------------------------------------------------------- */
const fileInput = $("fileInput");
const analyzeBtn = $("analyzeBtn");
const applyBtn = $("applyBtn");
const downloadReportBtn = $("downloadReportBtn");
const previewEmailBtn = $("previewEmailBtn");
const emailModal = $("emailModal");
const emailContent = $("emailContent");
const closeEmailModal = $("closeEmailModal");
const refreshBtn = $("refreshBtn");

const analysisPanel = $("analysisPanel");
const riskLabel = $("riskLabel");
const riskScore = $("riskScore");
const riskArc = $("riskArc");
const summaryArea = $("summaryArea");
const resultsBox = $("results");

const missingList = $("missingList");
const presentList = $("presentList");
const detailsBox = $("detailsBox");

/* Charts */
const ctxRisk = document.getElementById("riskChart")?.getContext("2d");
const ctxMissing = document.getElementById("missingChart")?.getContext("2d");

let riskChart = null;
let missingChart = null;

/* Dashboard items */
const totalDocsEl = $("totalDocs");
const avgRiskEl = $("avgRisk");
const maxRiskFileEl = $("maxRiskFile");
const historyTableBody = $("historyTableBody");

/* Page switching */
const navAnalyzer = $("navAnalyzer");
const navDashboard = $("navDashboard");
const pageAnalyzer = $("pageAnalyzer");
const pageDashboard = $("pageDashboard");

let lastAnalysis = null;
let lastFilename = null;

/* -----------------------------------------------------------
   PAGE SWITCHING
----------------------------------------------------------- */
function showPage(page) {
  if (page === "analyzer") {
    pageAnalyzer.classList.add("block");
    pageAnalyzer.classList.remove("hidden");

    pageDashboard.classList.add("hidden");
    pageDashboard.classList.remove("block");

    navAnalyzer.classList.add("active");
    navDashboard.classList.remove("active");
  } else {
    pageDashboard.classList.add("block");
    pageDashboard.classList.remove("hidden");

    pageAnalyzer.classList.add("hidden");
    pageAnalyzer.classList.remove("block");

    navDashboard.classList.add("active");
    navAnalyzer.classList.remove("active");

    refreshAll();
  }
}

navAnalyzer.addEventListener("click", () => showPage("analyzer"));
navDashboard.addEventListener("click", () => showPage("dashboard"));

/* -----------------------------------------------------------
   SAFER JSON FETCH
----------------------------------------------------------- */
async function safeJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

/* -----------------------------------------------------------
   RISK BLOCK COLOR (only block background changes)
----------------------------------------------------------- */
function updateRiskBlock(score) {
  analysisPanel.classList.remove("low-risk", "medium-risk", "high-risk");

  if (score <= 33) analysisPanel.classList.add("low-risk");
  else if (score <= 66) analysisPanel.classList.add("medium-risk");
  else analysisPanel.classList.add("high-risk");
}

/* -----------------------------------------------------------
   SVG ARC (Risk Meter)
----------------------------------------------------------- */
function drawArc(score = 0) {
  if (!riskArc) return;
  riskArc.innerHTML = "";

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");

  const cx = 50, cy = 50, r = 36;
  const start = 225;
  const sweep = 270;
  const angle = (Math.max(0, Math.min(score, 100)) / 100) * sweep;
  const end = start - angle;

  function point(a) {
    const rad = (a - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const startPt = point(start);
  const endPt = point(end);

  // Background arc
  const bg = document.createElementNS(NS, "path");
  const fullPt = point(start - sweep);
  bg.setAttribute("d", `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 1 1 ${fullPt.x} ${fullPt.y}`);
  bg.setAttribute("stroke", "rgba(0,0,0,0.15)");
  bg.setAttribute("stroke-width", "6");
  bg.setAttribute("fill", "none");

  svg.appendChild(bg);

  // Gradient
  const defs = document.createElementNS(NS, "defs");
  const grad = document.createElementNS(NS, "linearGradient");
  const id = "grad" + Math.random().toString(36).slice(2);

  grad.setAttribute("id", id);
  grad.innerHTML = `
    <stop offset="0%" stop-color="#ff99cc"/>
    <stop offset="100%" stop-color="#ff66b3"/>
  `;
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Foreground arc
  const fg = document.createElementNS(NS, "path");
  const large = angle > 180 ? 1 : 0;
  fg.setAttribute("d", `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${large} 1 ${endPt.x} ${endPt.y}`);
  fg.setAttribute("stroke", `url(#${id})`);
  fg.setAttribute("stroke-width", "6");
  fg.setAttribute("stroke-linecap", "round");
  fg.setAttribute("fill", "none");

  svg.appendChild(fg);
  riskArc.appendChild(svg);

  if (window.gsap) gsap.from(svg, { scale: 0.85, opacity: 0, duration: 0.45 });
}

/* -----------------------------------------------------------
   ANALYZE FILE
----------------------------------------------------------- */
async function analyzeFile(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
  if (!res.ok) return alert("Upload failed");

  const analysis = await res.json();
  lastAnalysis = analysis;
  lastFilename = file.name;

  renderAnalysis(analysis);
  updateRiskBlock(analysis.risk_score);

  refreshAll();
}

/* -----------------------------------------------------------
   RENDER ANALYSIS PANEL
----------------------------------------------------------- */
function renderAnalysis(a) {
  analysisPanel.classList.remove("hidden");

  riskLabel.innerText = a.risk_level.toUpperCase();
  riskScore.innerText = a.risk_score;
  summaryArea.innerText = a.risk_summary;

  drawArc(a.risk_score);

  missingList.innerHTML = a.missing_clauses.map(c => `<li>${c}</li>`).join("");
  presentList.innerHTML = a.present_clauses.map(c => `<li>${c}</li>`).join("");

  detailsBox.innerHTML =
    a.details
      .map(
        d => `
      <div class="p-2 border-b border-gray-300/20">
        <b>${d.clause}</b> — ${d.status}<br>
        Severity: ${d.severity}<br>
        Advice: ${d.advice}
      </div>`
      )
      .join("");

  resultsBox.innerHTML = "";

  // Generate suggestion boxes
  a.missing_clauses.forEach((clause) => {
    const block = document.createElement("div");
    block.innerHTML = `
      <div class="font-semibold mt-2">${clause}</div>
      <textarea data-clause="${clause}" rows="4"
      class="w-full p-2 rounded border border-pink-300"></textarea>
    `;
    resultsBox.appendChild(block);

    // Fetch suggestions
    (async () => {
      try {
        const sug = await safeJson(`${API_BASE}/suggest?clause=${encodeURIComponent(clause)}`);
        block.querySelector("textarea").value = sug.suggestion || "";
      } catch {
        block.querySelector("textarea").value = "[Suggestion unavailable]";
      }
    })();
  });

  if (window.gsap)
    gsap.from(analysisPanel, { y: 14, opacity: 0, duration: 0.45 });
}

/* -----------------------------------------------------------
   APPLY CLAUSES
----------------------------------------------------------- */
async function applyClauses() {
  if (!lastAnalysis) return alert("Analyze first!");

  const fields = {};
  document.querySelectorAll("textarea[data-clause]").forEach((t) => {
    fields[t.dataset.clause] = t.value;
  });

  const fd = new FormData();
  fd.append("filename", lastFilename);
  fd.append("clauses", JSON.stringify(fields));

  const res = await fetch(`${API_BASE}/apply`, { method: "POST", body: fd });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "modified_" + lastFilename;
  a.click();
}

/* -----------------------------------------------------------
   PDF REPORT
----------------------------------------------------------- */
async function downloadReport() {
  if (!lastAnalysis) return alert("Analyze first!");

  const fd = new FormData();
  fd.append("filename", lastFilename);
  fd.append("analysis_json", JSON.stringify(lastAnalysis));

  const res = await fetch(`${API_BASE}/report`, { method: "POST", body: fd });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "report_" + lastFilename;
  a.click();
}

/* -----------------------------------------------------------
   DASHBOARD HISTORY + CHARTS
----------------------------------------------------------- */
async function loadHistory() {
  try {
    return await safeJson(`${API_BASE}/sheet_history`);
  } catch {
    try {
      const old = await safeJson(`${API_BASE}/history`);
      return Array.isArray(old) ? old : old.history || [];
    } catch {
      return [];
    }
  }
}

function normalize(r) {
  return {
    filename: r.filename || "Unknown",
    risk_score: Number(r.risk_score || 0),
    missing_count:
      r.missing_count ??
      (r.missing_clauses ? r.missing_clauses.length : 0),
    timestamp: r.timestamp || null,
  };
}

function drawCharts(recordsRaw) {
  if (!ctxRisk || !ctxMissing) return;

  const rec = recordsRaw.map(normalize);

  const labels = rec.map((r) =>
    r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : "NA"
  );

  const riskData = rec.map((r) => r.risk_score);
  const missData = rec.map((r) => r.missing_count);

  if (riskChart) riskChart.destroy();
  if (missingChart) missingChart.destroy();

  riskChart = new Chart(ctxRisk, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: riskData,
          borderColor: "#ff66b3",
          backgroundColor: "rgba(255, 102, 179, 0.18)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: { plugins: { legend: { display: false } } },
  });

  missingChart = new Chart(ctxMissing, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: missData,
          backgroundColor: "#ffd6ea",
        },
      ],
    },
    options: { plugins: { legend: { display: false } } },
  });
}

async function refreshAll() {
  const records = (await loadHistory()).map(normalize);

  totalDocsEl.innerText = records.length;
  avgRiskEl.innerText =
    records.length === 0
      ? 0
      : Math.round(
          records.reduce((s, r) => s + r.risk_score, 0) / records.length
        );

  const max = records.reduce(
    (best, r) => (r.risk_score > best.risk_score ? r : best),
    { risk_score: -1 }
  );
  maxRiskFileEl.innerText =
    max.risk_score >= 0 ? `${max.filename} (${max.risk_score})` : "—";

  historyTableBody.innerHTML = records
    .map(
      (r) => `
        <tr>
          <td>${r.filename}</td>
          <td class="text-right">${r.risk_score}</td>
          <td class="text-right">${r.missing_count}</td>
          <td class="text-right">
            ${r.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}
          </td>
        </tr>`
    )
    .join("");

  drawCharts(records);
}

/* -----------------------------------------------------------
   EMAIL MODAL
----------------------------------------------------------- */
previewEmailBtn?.addEventListener("click", () => {
  if (!lastAnalysis) return alert("Analyze first!");

  emailContent.textContent = `
To: compliance-team@company.com
Subject: Compliance Alert

Contract: ${lastFilename}

Missing Clauses:
${lastAnalysis.missing_clauses.map((c) => "- " + c).join("\n")}

Risk Score: ${lastAnalysis.risk_score}
Risk Level: ${lastAnalysis.risk_level}

Regards,
AI Compliance Checker
  `;

  emailModal.classList.remove("hidden");
});

closeEmailModal?.addEventListener("click", () =>
  emailModal.classList.add("hidden")
);

/* -----------------------------------------------------------
   BIND EVENTS
----------------------------------------------------------- */
analyzeBtn.addEventListener("click", () => {
  if (!fileInput.files.length) return alert("Select a file first");
  analyzeFile(fileInput.files[0]);
});

applyBtn.addEventListener("click", applyClauses);
downloadReportBtn.addEventListener("click", downloadReport);
refreshBtn.addEventListener("click", refreshAll);

/* -----------------------------------------------------------
   INITIAL LOAD
----------------------------------------------------------- */
refreshAll();
