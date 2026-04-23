const role = localStorage.getItem("role");

if (!role) {
  window.location.href = "login.html";
}

// 🔐 QC restriction
if (role === "qc") {

  document.getElementById("cardInvoice")?.remove();
  document.getElementById("cardPurchase")?.remove();
  document.getElementById("cardPayment")?.remove();
  document.getElementById("cardISO")?.remove();
  document.getElementById("cardDashboard")?.remove();

}