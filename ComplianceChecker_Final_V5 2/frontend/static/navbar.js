/* ==========================================================
   NAVBAR HANDLER — FINAL VERSION
   Controls page switching between Analyzer and Dashboard
========================================================== */

console.log("%c[NAVBAR] Loaded", "color:#ff66b3;font-weight:bold;");

/* Grab nav buttons */
const navAnalyzer = document.getElementById("navAnalyzer");
const navDashboard = document.getElementById("navDashboard");

/* Grab page sections */
const pageAnalyzer = document.getElementById("pageAnalyzer");
const pageDashboard = document.getElementById("pageDashboard");

/* Main page switch function */
function switchPage(page) {
  if (page === "analyzer") {
    pageAnalyzer.classList.remove("hidden");
    pageDashboard.classList.add("hidden");

    navAnalyzer.classList.add("active");
    navDashboard.classList.remove("active");
  } 
  else if (page === "dashboard") {
    pageDashboard.classList.remove("hidden");
    pageAnalyzer.classList.add("hidden");

    navDashboard.classList.add("active");
    navAnalyzer.classList.remove("active");
  }
}

/* Click events */
if (navAnalyzer)
  navAnalyzer.addEventListener("click", () => switchPage("analyzer"));

if (navDashboard)
  navDashboard.addEventListener("click", () => switchPage("dashboard"));

/* Export for app.js (optional) */
window.switchPage = switchPage;
