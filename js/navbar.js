fetch("navbar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("navbar").innerHTML = data;

    // ✅ NOW navbar is loaded → safe to modify
    const role = localStorage.getItem("role");

    if (role === "qc") {

      document.getElementById("navInvoice")?.closest(".nav-item")?.remove();
      document.getElementById("navPurchase")?.closest(".nav-item")?.remove();
      document.getElementById("navPayment")?.closest(".nav-item")?.remove();
      document.getElementById("navISO")?.closest(".nav-item")?.remove();
      document.getElementById("navDashboard")?.closest(".nav-item")?.remove();

    }

  });