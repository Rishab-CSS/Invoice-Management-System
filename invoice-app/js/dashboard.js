if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}




let invoices = getInvoices();

// Total invoices
document.getElementById("totalInvoices").textContent = invoices.length;

// Total revenue
let revenue = 0;

invoices.forEach(inv => {
revenue += Number(inv.total);
});

document.getElementById("totalRevenue").textContent ="₹ " + revenue.toLocaleString("en-IN");


// Latest invoice
if(invoices.length > 0){
document.getElementById("latestInvoice").textContent =
invoices[invoices.length - 1].invoiceNo;
}


// Monthly revenue calculation
let monthlyRevenue = {};

invoices.forEach(inv => {

let date = new Date(inv.date);

let month = date.toLocaleString('default', { month: 'short', year: 'numeric' });

if(!monthlyRevenue[month]){
monthlyRevenue[month] = 0;
}

monthlyRevenue[month] += Number(inv.total);

});


// Prepare chart data
let labels = Object.keys(monthlyRevenue);
let values = Object.values(monthlyRevenue);


// Create chart
const ctx = document.getElementById('revenueChart');

new Chart(ctx, {
type: 'line',
data: {
labels: labels,
datasets: [{
label: 'Monthly Revenue',
data: values,
borderWidth: 3,
fill: false,
tension: 0.3
}]
},
options: {
scales: {
y: {
beginAtZero: true
}
}
}
});