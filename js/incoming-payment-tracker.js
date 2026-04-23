const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

const API_URL = "https://erp-system-303n.onrender.com/api/payments";

let invoices = [];
let selectedInvoiceId = null;
let editingPaymentId = null;

async function getInvoicesFromDB(){
  let res = await fetch("https://erp-system-303n.onrender.com/api/invoices");
  invoices = await res.json();
  loadPayments();
}
getInvoicesFromDB();

const tbody = document.getElementById("paymentBody");

let totalPending = 0;
let totalReceived = 0;
let totalOverdue = 0;


// ================= DATE =================

function calculateDueDate(invoiceDate, paymentTerms){
if(!invoiceDate) return "";
let date = new Date(invoiceDate);
if(isNaN(date)) return "";
let terms = paymentTerms || 45;
date.setDate(date.getDate() + terms);
return date.toISOString().split("T")[0];
}

function calculateOverdue(dueDate){
let today = new Date();
let due = new Date(dueDate);
if(isNaN(due)) return 0;
let diff = today - due;
return Math.floor(diff / (1000 * 60 * 60 * 24));
}


// ================= LOAD =================

async function loadPayments(){

let res = await fetch(API_URL);
let paymentsData = await res.json();

totalPending = 0;
totalReceived = 0;
totalOverdue = 0;

tbody.innerHTML="";

invoices.forEach(inv=>{

let dueDate = calculateDueDate(inv.invoiceDate, inv.paymentTerms);

let payments = paymentsData.filter(p => p.invoiceNo === inv.invoiceNo);
let paid = payments.reduce((sum,p)=>sum+p.amount,0);
let remaining = inv.amount - paid;

// ✅ NOW it's safe
let overdue = getOverdueStatus(dueDate, remaining);

// totals
totalReceived += paid;
if(remaining > 0) totalPending += remaining;

if(overdue.type === "overdue"){
  totalOverdue += remaining;
}

// row style
let rowClass = remaining <= 0 ? "received-row"
              : overdue.type === "overdue" ? "overdue-row"
              : "pending-row";

let statusText = remaining <= 0 ? "Paid" : "Pending";


// row
let row = `
<tr class="${rowClass}">

<td>${inv.invoiceNo}</td>
<td>${inv.customerName}</td>
<td>${formatDate(inv.invoiceDate)}</td>

<td>${formatMoney(inv.amount)}</td>

<td>${formatDate(dueDate)}</td>

<td>${formatMoney(remaining)}</td>

<td class="overdue-cell ${overdue.type}">
${overdue.text}
</td>

<td class="status">${statusText}</td>

<td>
${remaining > 0
  ? `<button onclick="openPanel('${inv._id}', ${remaining})">Received</button>`
  : `<button disabled class="paid-button">Paid</button>`
}
<button onclick="viewPayments('${inv.invoiceNo}')">View</button>
</td>

</tr>
`;



tbody.innerHTML += row;

});

document.getElementById("totalPending").innerText = formatMoney(totalPending);
document.getElementById("totalReceived").innerText = formatMoney(totalReceived);
document.getElementById("totalOverdue").innerText = formatMoney(totalOverdue);

}


// ================= PANEL =================

function openPanel(id, amount){
selectedInvoiceId = id;
editingPaymentId = null;

document.getElementById("payAmount").value = amount;
document.getElementById("payDate").value = new Date().toISOString().split("T")[0];

document.getElementById("paymentPanel").style.display="block";
}

function closePanel(){
document.getElementById("paymentPanel").style.display="none";
}


// ================= SAVE / UPDATE =================

async function confirmPayment(){

let invoice = invoices.find(inv => inv._id === selectedInvoiceId);

let amount = Number(document.getElementById("payAmount").value);
let mode = document.getElementById("payMode").value;
let date = document.getElementById("payDate").value;

if(!amount || !date){
alert("Enter payment details");
return;
}

try{

if(editingPaymentId){

// UPDATE
await fetch(`${API_URL}/${editingPaymentId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: amount,
    paymentDate: new Date(date),
    method: mode.toLowerCase()
  })
});

editingPaymentId = null;

}else{

// CREATE
await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "incoming",
    partyName: invoice.customerName,
    invoiceNo: invoice.invoiceNo,
    amount: amount,
    paymentDate: new Date(date),
    method: mode.toLowerCase()
  })
});

}

closePanel();
loadPayments();

}catch(err){
console.error(err);
alert("Error saving payment");
}

}


// ================= VIEW =================

async function viewPayments(invoiceNo){

let res = await fetch(API_URL);
let data = await res.json();

let payments = data.filter(p => p.invoiceNo === invoiceNo);

let html = "";

if(payments.length === 0){
html = `<tr><td colspan="5" style="text-align:center;">No payments</td></tr>`;
}else{
payments.forEach((p,i)=>{
html += `
<tr>
<td>${i+1}</td>
<td>₹${p.amount}</td>
<td>${p.method}</td>
<td>${formatDate(p.paymentDate)}</td>
<td>
<button onclick="editPayment('${p._id}')">Edit</button>
<button onclick="deletePayment('${p._id}','${invoiceNo}')">Delete</button>
</td>
</tr>`;
});
}

document.getElementById("historyList").innerHTML = html;
document.getElementById("historyPanel").style.display="block";
}

function closeHistory(){
document.getElementById("historyPanel").style.display="none";
}


// ================= DELETE =================

async function deletePayment(id, invoiceNo){

if(!confirm("Delete this payment?")) return;

await fetch(`${API_URL}/${id}`, { method: "DELETE" });

viewPayments(invoiceNo);
loadPayments();
}


// ================= EDIT =================

async function editPayment(id){

let res = await fetch(API_URL);
let data = await res.json();

let payment = data.find(p => p._id === id);

if(!payment){
alert("Payment not found");
return;
}

document.getElementById("payAmount").value = payment.amount;
document.getElementById("payMode").value = toTitleCase(payment.method);
document.getElementById("payDate").value = payment.paymentDate.split("T")[0];

editingPaymentId = id;

closeHistory();
document.getElementById("paymentPanel").style.display="block";
}


// ================= UTIL =================

function toTitleCase(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(dateString){
if(!dateString) return "-";
let d = new Date(dateString);
if(isNaN(d)) return "-";
return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

function formatMoney(value){
return "₹" + Number(value).toLocaleString("en-IN");
}


// ================= SEARCH =================

document.getElementById("searchInput").addEventListener("input", function(){

let search = this.value.toLowerCase();
let rows = document.querySelectorAll("#paymentBody tr");

rows.forEach(row => {
let text = row.innerText.toLowerCase();
row.style.display = text.includes(search) ? "" : "none";
});

});


// ================= FILTER =================

function filterInvoices(type){

let rows = document.querySelectorAll("#paymentBody tr");

rows.forEach(row => {

let status = row.querySelector(".status").innerText;
let overdue = row.querySelector(".overdue-cell").innerText;

if(type === "all"){
row.style.display = "";
}
else if(type === "Pending"){
row.style.display = status === "Pending" ? "" : "none";
}
else if(type === "Received"){
row.style.display = status === "Paid" ? "" : "none";
}
else if(type === "Overdue"){
row.style.display = overdue.includes("🔴") ? "" : "none";
}

});

}


function getOverdueStatus(dueDate, remaining){

if(remaining <= 0){
return { text: "-", type: "paid" };
}

let today = new Date();
let due = new Date(dueDate);

let diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));

if(diff < 0){
return {
text: `🟡 ${Math.abs(diff)} days left`,
type: "pending"
};
}

if(diff === 0){
return {
text: "⚠ Due Today",
type: "today"
};
}

return {
text: `🔴 ${diff} days overdue`,
type: "overdue"
};

}