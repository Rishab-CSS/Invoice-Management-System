let invoices = [];
let payments = [];
let productionData = [];
let purchaseInvoices = [];

let selectedMonth = "all"; 
let revenueMonth = "all";
let paymentMonth = "all";
let pendingMonth = "all";
let productionMonth = "all";

// ================= LOAD DATA =================
async function loadAnalytics() {
  try {
    invoices = await (await fetch("https://erp-system-303n.onrender.com/api/invoices")).json();
    payments = await (await fetch("https://erp-system-303n.onrender.com/api/payments")).json();
    productionData = await (await fetch("https://erp-system-303n.onrender.com/api/production")).json();
    purchaseInvoices = await (await fetch("https://erp-system-303n.onrender.com/api/purchase-invoices")).json();

    setupMonthFilters();
    updateChartTheme();
    renderKPIs();
    renderRevenueChart();
    renderPaymentChart();
    renderPendingChart();
    renderProductionChart();
  } catch (err) {
    console.error("Error loading analytics:", err);
  }
}

// ================= SETUP FILTER =================
function setupMonthFilters() {
  let monthSet = new Set();
  invoices.forEach(inv => {
    let d = new Date(inv.invoiceDate);
    let key = `${d.getFullYear()}-${d.getMonth()}`;
    monthSet.add(key);
  });
  let months = Array.from(monthSet).sort();

  let filters = ["monthFilter", "revenueMonthFilter", "paymentMonthFilter", "pendingMonthFilter", "productionMonthFilter"];
  
  filters.forEach(id => {
    let select = document.getElementById(id);
    if (!select) return;
    months.forEach(m => {
      let [year, month] = m.split("-");
      let option = document.createElement("option");
      option.value = m;
      option.textContent = new Date(year, month).toLocaleString("default", { month: "short", year: "numeric" });
      select.appendChild(option);
    });
  });
}

// ================= HELPERS =================
function filterInvoicesByMonth(data, monthStr) {
  if (monthStr === "all") return data;
  return data.filter(inv => {
    let d = new Date(inv.invoiceDate);
    return `${d.getFullYear()}-${d.getMonth()}` === monthStr;
  });
}

function filterPaymentsByMonth(data, monthStr) {
  if (monthStr === "all") return data;
  return data.filter(p => {
    let d = new Date(p.paymentDate);
    return `${d.getFullYear()}-${d.getMonth()}` === monthStr;
  });
}

function filterProductionByMonth(data, monthStr) {
  if (monthStr === "all") return data;
  return data.filter(p => {
    let dispatchProcess = (p.processes || []).find(proc => proc.processName?.toLowerCase().includes("dispatch"));
    let dispatchDate = dispatchProcess?.endDate || dispatchProcess?.completedAt;
    let d = dispatchDate ? new Date(dispatchDate) : new Date(p.createdAt || p.date);
    return `${d.getFullYear()}-${d.getMonth()}` === monthStr;
  });
}

function filterPurchaseInvoicesByMonth(data, monthStr) {
  if (monthStr === "all") return data;
  return data.filter(inv => {
    let d = new Date(inv.invoiceDate);
    return `${d.getFullYear()}-${d.getMonth()}` === monthStr;
  });
}

// ================= KPIs =================
function renderKPIs() {
  let filteredInvoices = filterInvoicesByMonth(invoices, selectedMonth);
  let filteredPayments = filterPaymentsByMonth(payments, selectedMonth);
  let filteredProduction = filterProductionByMonth(productionData, selectedMonth);
  let filteredPurchaseInvoices = filterPurchaseInvoicesByMonth(purchaseInvoices, selectedMonth);

  let totalRevenue = filteredInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  let paymentsReceived = filteredPayments.filter(p => p.type?.toLowerCase() === "incoming").reduce((s, p) => s + (p.amount || 0), 0);
  
  let pendingIncoming = 0;
  filteredInvoices.forEach(inv => {
    let paid = filteredPayments.filter(p => p.invoiceNo === inv.invoiceNo).reduce((s, p) => s + (p.amount || 0), 0);
    let rem = (inv.amount || 0) - paid;
    if (rem > 0) pendingIncoming += rem;
  });
  
  let paymentsMade = filteredPayments.filter(p => p.type?.toLowerCase() === "outgoing").reduce((s, p) => s + (p.amount || 0), 0);
  let pendingOutgoing = 0;

  // Pending from purchase invoices
  filteredPurchaseInvoices.forEach(inv => {
    let paid = filteredPayments.filter(p => p.invoiceNo === inv.invoiceNo).reduce((s, p) => s + (p.amount || 0), 0);
    let total = Number(inv.grandTotal || 0);
    let rem = total - paid;
    if (rem > 0) pendingOutgoing += rem;
  });

  // Pending from manual payments
  let manualPayments = filteredPayments.filter(p => p.isManual);
  let manualGroups = {};
  manualPayments.forEach(p => {
    let key = p.manualGroupId || p._id;
    if (!manualGroups[key]) {
      manualGroups[key] = { total: 0, paid: 0 };
    }
    manualGroups[key].total = Math.max(manualGroups[key].total, Number(p.totalAmount || 0));
    manualGroups[key].paid += Number(p.amount || 0);
  });
  Object.values(manualGroups).forEach(group => {
    let rem = group.total - group.paid;
    if (rem > 0) pendingOutgoing += rem;
  });

  let MathTop = {};
  filteredProduction.forEach(p => {
    let name = p.productName || "Unknown";
    let dispatchProcess = (p.processes || []).find(proc => proc.processName?.toLowerCase().includes("dispatch"));
    let qty = dispatchProcess?.acceptedQty || 0;
    if (!MathTop[name]) MathTop[name] = 0;
    MathTop[name] += qty;
  });
  let topProductName = "";
  let maxQty = 0;
  for (let key in MathTop) {
    if (MathTop[key] > maxQty) { maxQty = MathTop[key]; topProductName = key; }
  }

  let currentMonthRevenue = 0;
  let previousMonthRevenue = 0;
  if (selectedMonth !== "all") {
    currentMonthRevenue = totalRevenue;
    let [y, m] = selectedMonth.split("-").map(Number);
    let prevM = m - 1, prevY = y;
    if (prevM < 0) { prevM = 11; prevY--; }
    let prevMonthKey = `${prevY}-${prevM}`;
    let prevInvoices = invoices.filter(inv => {
      let d = new Date(inv.invoiceDate); return `${d.getFullYear()}-${d.getMonth()}` === prevMonthKey;
    });
    previousMonthRevenue = prevInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  } else {
    if (invoices.length > 0) {
      let allMonths = invoices.map(inv => {
        let d = new Date(inv.invoiceDate); return { y: d.getFullYear(), m: d.getMonth(), amt: (inv.amount || 0) };
      });
      allMonths.sort((a,b) => (a.y === b.y ? b.m - a.m : b.y - a.y));
      let lastY = allMonths[0].y; let lastM = allMonths[0].m;
      let prevM = lastM - 1, prevY = lastY;
      if (prevM < 0) { prevM = 11; prevY--; }
      currentMonthRevenue = allMonths.filter(x => x.y === lastY && x.m === lastM).reduce((s, x) => s + x.amt, 0);
      previousMonthRevenue = allMonths.filter(x => x.y === prevY && x.m === prevM).reduce((s, x) => s + x.amt, 0);
    }
  }

let growthText = "0%";
let growthCard = document.getElementById("companyGrowth").parentElement;

if (previousMonthRevenue === 0 && currentMonthRevenue > 0) {
    growthText = "+100% 🚀";
}
else if (previousMonthRevenue === 0 && currentMonthRevenue === 0) {
    growthText = "0%";
}
else {
    let growthPerc = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

    growthText = (growthPerc > 0 ? "+" : "") + growthPerc.toFixed(1) + "%";

    if (growthPerc > 0) {
        growthText += " 📈";
    } else if (growthPerc < 0) {
        growthText += " 📉";
    }
}

  let topCustomerMap = {};
  filteredInvoices.forEach(inv => {
    let name = inv.customerName || "Unknown";
    topCustomerMap[name] = (topCustomerMap[name] || 0) + (inv.amount || 0);
  });
  let topCustomerName = "-";
  let maxCustomerAmt = 0;
  for (let c in topCustomerMap) {
    if (topCustomerMap[c] > maxCustomerAmt && c !== "Unknown") {
      maxCustomerAmt = topCustomerMap[c];
      topCustomerName = c;
    }
  }

  document.getElementById("totalRevenue").innerText = "₹" + totalRevenue.toLocaleString();
  document.getElementById("paymentsReceived").innerText = "₹" + paymentsReceived.toLocaleString();
  document.getElementById("pendingIncoming").innerText = "₹" + pendingIncoming.toLocaleString();
  document.getElementById("paymentsMade").innerText = "₹" + paymentsMade.toLocaleString();
  document.getElementById("pendingOutgoing").innerText ="₹" + pendingOutgoing.toLocaleString();
  document.getElementById("topProduct").innerText = topProductName ? `🏆 ${topProductName}\n(${maxQty} units)` : "-";
  document.getElementById("companyGrowth").innerText = growthText;
  document.getElementById("topCustomer").innerText = topCustomerName !== "-" ? `👑 ${topCustomerName}\n(₹${maxCustomerAmt.toLocaleString()})` : "-";
}

// Reset Helper
function resetChartCanvas(id) {
  let canvas = document.getElementById(id);
  let newCanvas = canvas.cloneNode();
  canvas.parentNode.replaceChild(newCanvas, canvas);
}

// ================= REVENUE CHART =================
function renderRevenueChart() {
  let filteredInvoices = filterInvoicesByMonth(invoices, revenueMonth);
  let monthlySales = {};
  filteredInvoices.forEach(inv => {
    let d = new Date(inv.invoiceDate);
    let key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlySales[key] = (monthlySales[key] || 0) + (inv.amount || 0);
  });
  let months = Object.keys(monthlySales).sort();
  let revenueLabels = months.map(m => {
    let [year, month] = m.split("-");
    return new Date(year, month).toLocaleString("default", { month: "short", year: "numeric" });
  });
  let revenueData = months.map(m => monthlySales[m]);

  resetChartCanvas("revenueChart");
  new Chart(document.getElementById("revenueChart"), {
    type: "line",
    data: {
      labels: revenueLabels,
      datasets: [{
        label: "Revenue",
        data: revenueData,
        borderColor: "#00f2fe",
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(0, 242, 254, 0.6)");
          gradient.addColorStop(1, "rgba(79, 172, 254, 0.05)");
          return gradient;
        },
        fill: true, tension: 0.5, pointRadius: 5, pointBackgroundColor: "#fff",
        pointBorderColor: "#00f2fe", pointBorderWidth: 2, pointHoverRadius: 8, borderWidth: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", weight: "500" } } },
        y: { grid: { borderDash: [5, 5] }, ticks: { font: { family: "'Inter', sans-serif" }, beginAtZero: true } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)", titleFont: { size: 14, family: "'Inter', sans-serif" }, bodyFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" }, padding: 12, cornerRadius: 8, displayColors: false },
        datalabels: { display: false }
      }
    }
  });
}

// ================= PAYMENT CHART =================
function renderPaymentChart() {
  let filteredPayments = filterPaymentsByMonth(payments, paymentMonth);
  let paymentsReceived = filteredPayments.filter(p => p.type?.toLowerCase() === "incoming").reduce((s, p) => s + (p.amount || 0), 0);
  let paymentsMade = filteredPayments.filter(p => p.type?.toLowerCase() === "outgoing").reduce((s, p) => s + (p.amount || 0), 0);

  resetChartCanvas("paymentChart");
  new Chart(document.getElementById("paymentChart"), {
    type: "bar",
    data: {
      labels: ["Payments Overview"],
      datasets: [
        { label: "Incoming", data: [paymentsReceived], backgroundColor: (context) => { const chart = context.chart; const {ctx, chartArea} = chart; if (!chartArea) return "#00c9a7"; const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom); gradient.addColorStop(0, "#00c9a7"); gradient.addColorStop(1, "#84fab0"); return gradient; }, borderRadius: 15, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.8 },
        { label: "Outgoing", data: [paymentsMade], backgroundColor: (context) => { const chart = context.chart; const {ctx, chartArea} = chart; if (!chartArea) return "#ff0844"; const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom); gradient.addColorStop(0, "#ff0844"); gradient.addColorStop(1, "#ffb199"); return gradient; }, borderRadius: 15, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.8 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, layout: { padding: 10 },
      scales: { x: { grid: { display: false }, ticks: { display: true, font: { family: "'Inter', sans-serif", weight: "500" } } }, y: { grid: { borderDash: [5, 5] }, ticks: { font: { family: "'Inter', sans-serif" }, callback: value => "₹" + value, beginAtZero: true } } },
      plugins: {
        legend: { position: "top", labels: { font: { family: "'Inter', sans-serif", weight: "bold" }, usePointStyle: true, pointStyle: "circle" } },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)", titleFont: { size: 14, family: "'Inter', sans-serif" }, bodyFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" }, padding: 12, cornerRadius: 8 },
        datalabels: { color: "#fff", anchor: "center", align: "center", formatter: value => value > 0 ? "₹" + value.toLocaleString() : "", font: { weight: "bold", size: 14, family: "'Inter', sans-serif", textShadowBlur: 4, textShadowColor: "rgba(0,0,0,0.5)" } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ================= PENDING CHART =================
function renderPendingChart() {
  let filteredInvoices = filterInvoicesByMonth(invoices, pendingMonth);
  let filteredPayments = filterPaymentsByMonth(payments, pendingMonth);
  let filteredPurchaseInvoices = filterPurchaseInvoicesByMonth(purchaseInvoices, pendingMonth);
  let pendingIncoming = 0;
  let pendingOutgoing = 0;

  // Pending incoming
  filteredInvoices.forEach(inv => {
    let paid = filteredPayments.filter(p => p.invoiceNo === inv.invoiceNo).reduce((s, p) => s + (p.amount || 0), 0);
    let rem = (inv.amount || 0) - paid;
    if (rem > 0) pendingIncoming += rem;
  });

  // Pending outgoing from purchase invoices
  filteredPurchaseInvoices.forEach(inv => {
    let paid = filteredPayments.filter(p => p.invoiceNo === inv.invoiceNo).reduce((s, p) => s + (p.amount || 0), 0);
    let total = Number(inv.grandTotal || 0);
    let rem = total - paid;
    if (rem > 0) pendingOutgoing += rem;
  });

  // Pending outgoing from manual payments
  let manualPayments = filteredPayments.filter(p => p.isManual);
  let manualGroups = {};
  manualPayments.forEach(p => {
    let key = p.manualGroupId || p._id;
    if (!manualGroups[key]) {
      manualGroups[key] = { total: 0, paid: 0 };
    }
    manualGroups[key].total = Math.max(manualGroups[key].total, Number(p.totalAmount || 0));
    manualGroups[key].paid += Number(p.amount || 0);
  });
  Object.values(manualGroups).forEach(group => {
    let rem = group.total - group.paid;
    if (rem > 0) pendingOutgoing += rem;
  });

  const gaugeTicksPlugin = {
    id: 'gaugeTicks',
    afterDraw(chart) {
      if (chart.config.options.circumference !== 180) return;
      const meta = chart.getDatasetMeta(0);
      if (!meta.data || !meta.data[0]) return;
      const { ctx } = chart;
      const arc = meta.data[0];
      const centerX = arc.x;
      const centerY = arc.y;
      const outerRadius = arc.outerRadius;
      const tickRadius = outerRadius + 20;

      ctx.save();
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i <= 100; i += 10) {
        const angle = -Math.PI + (i / 100) * Math.PI;
        const x = centerX + Math.cos(angle) * tickRadius;
        const y = centerY + Math.sin(angle) * tickRadius;
        ctx.fillText(i + "%", x, y);
      }
      ctx.restore();
    }
  };

  resetChartCanvas("pendingChart");
  new Chart(document.getElementById("pendingChart"), {
    type: "doughnut",
    data: {
      labels: [`Incoming (₹${pendingIncoming.toLocaleString()})`, `Outgoing (₹${pendingOutgoing.toLocaleString()})`],
      datasets: [{
        data: [pendingIncoming, pendingOutgoing],
        backgroundColor: ["#00c9a7", "#ff0844"],
        borderWidth: 0, hoverOffset: 10, borderRadius: 5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, rotation: -90, circumference: 180, cutout: "80%", layout: { padding: { left: 50, right: 50, top: 40, bottom: 10 } },
      plugins: {
        legend: { position: "bottom", labels: { font: { family: "'Inter', sans-serif", size: 13, weight: "500" }, usePointStyle: true, padding: 10 } },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)", bodyFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" }, padding: 12, cornerRadius: 8 },
        datalabels: { display: false }
      }
    },
    plugins: [gaugeTicksPlugin]
  });
}

// ================= PRODUCTION CHART =================
function renderProductionChart() {
  let filteredProduction = filterProductionByMonth(productionData, productionMonth);
  let productionProducts = {};
  filteredProduction.forEach(p => {
    let name = p.productName || "Unknown";
    let dispatchProcess = (p.processes || []).find(proc => proc.processName?.toLowerCase().includes("dispatch"));
    let qty = dispatchProcess?.acceptedQty || 0;
    if (!productionProducts[name]) productionProducts[name] = 0;
    productionProducts[name] += qty;
  });
  let productKeys = Object.keys(productionProducts);
  let prodLabels = productKeys.map(p => `${p} (${productionProducts[p]})`);
  let prodData = productKeys.map(p => productionProducts[p]);

  let baseColors = ["#4facfe", "#43e97b", "#fa709a", "#a18cd1", "#fee140", "#00f2fe", "#ff0844", "#9be15d"];
  let dynamicColors = prodData.map((_, i) => baseColors[i] || `hsl(${(i * 137.5) % 360}, 80%, 65%)`);

  resetChartCanvas("productionChart");
  new Chart(document.getElementById("productionChart"), {
    type: "doughnut",
    data: {
      labels: prodLabels,
      datasets: [{
        data: prodData,
        backgroundColor: dynamicColors,
        borderWidth: 2, borderColor: "#18181b",
        hoverOffset: 15, borderRadius: 10
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "80%",
      plugins: {
        legend: { 
          position: "right", 
          labels: { font: { family: "'Inter', sans-serif", size: 12, weight: "500" }, usePointStyle: true, padding: 15 },
          onHover: function(e, legendItem, legend) {
            const chart = legend.chart;
            const index = legendItem.index;
            chart.setActiveElements([{ datasetIndex: 0, index: index }]);
            const meta = chart.getDatasetMeta(0);
            if (meta.data[index] && chart.tooltip) {
              const pos = meta.data[index].tooltipPosition();
              chart.tooltip.setActiveElements([{ datasetIndex: 0, index: index }], pos);
            }
            chart.update();
          },
          onLeave: function(e, legendItem, legend) {
            const chart = legend.chart;
            chart.setActiveElements([]);
            if (chart.tooltip) chart.tooltip.setActiveElements([]);
            chart.update();
          }
        },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)", bodyFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" }, padding: 12, cornerRadius: 8 },
        datalabels: { display: false }
      }
    }
  });
}

// ================= EVENTS =================
document.getElementById("monthFilter").addEventListener("change", function () { selectedMonth = this.value; renderKPIs(); });
document.getElementById("revenueMonthFilter").addEventListener("change", function () { revenueMonth = this.value; renderRevenueChart(); });
document.getElementById("paymentMonthFilter").addEventListener("change", function () { paymentMonth = this.value; renderPaymentChart(); });
document.getElementById("pendingMonthFilter").addEventListener("change", function () { pendingMonth = this.value; renderPendingChart(); });
document.getElementById("productionMonthFilter").addEventListener("change", function () { productionMonth = this.value; renderProductionChart(); });

function updateChartTheme() {
  Chart.defaults.color = "#ffffff";
  Chart.defaults.borderColor = "rgba(255,255,255,0.1)";
}

function closePopup() { document.getElementById("productDetails").style.display = "none"; }

// ================= INIT =================
loadAnalytics();