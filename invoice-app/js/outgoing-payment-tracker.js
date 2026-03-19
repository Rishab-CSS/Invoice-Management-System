if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}

let invoices = JSON.parse(localStorage.getItem("purchaseInvoices")) || [];

const tbody = document.getElementById("paymentBody");

let selectedIndex = null;



function loadPayments(){

let totalPending = 0;

tbody.innerHTML="";

invoices.forEach((inv,index)=>{

let payments = inv.payments || [];

let paid = payments.reduce((sum,p)=>sum+p.amount,0);

let remaining = inv.total - paid;

let paymentModes = payments.map(p=>`• ${p.mode}`).join("<br>");

let paymentDates = payments.map(p=>`• ${formatDate(p.date)}`).join("<br>");

totalPending += remaining;

let row = `

<tr>

<td>${inv.invoiceNo}</td>

<td>${inv.vendor}</td>

<td>${formatDate(inv.date)}</td>

<td>₹${Number(inv.total).toLocaleString("en-IN")}</td>

<td>₹${Number(paid).toLocaleString("en-IN")}</td>

<td>₹${Number(remaining).toLocaleString("en-IN")}</td>

<td>

${remaining > 0
? `<button onclick="openPanel(${index})">Pay</button>`
: "✔ Paid"}


<button onclick="viewPayments(${index})">View Payments</button>

</td>

</tr>
`;

tbody.innerHTML += row;

});

document.getElementById("totalPending").innerText = "₹" + totalPending;

document.getElementById("totalPending").innerText =
"₹" + Number(totalPending).toLocaleString("en-IN");

}



function openPanel(index){

selectedIndex = index;

clearPanel();

document.getElementById("paymentPanel").style.display="block";

}


function closePanel(){

document.getElementById("paymentPanel").style.display="none";

}

function confirmPayment(){

let amount = Number(document.getElementById("payAmount").value);
let mode = document.getElementById("payMode").value;
let date = document.getElementById("payDate").value;

if(!amount || !date){
alert("Enter payment details");
return;
}

let inv = invoices[selectedIndex];

if(!inv.payments){
inv.payments = [];
}

inv.payments.push({
amount:amount,
mode:mode,
date:date
});

let paidTotal = inv.payments.reduce((sum,p)=>sum+p.amount,0);

if(paidTotal >= inv.total){
inv.status = "Paid";
}

localStorage.setItem("purchaseInvoices", JSON.stringify(invoices));

closePanel();
clearPanel();

loadPayments();

}

function formatDate(dateString){

let d = new Date(dateString);

let day = String(d.getDate()).padStart(2,'0');
let month = String(d.getMonth()+1).padStart(2,'0');
let year = d.getFullYear();

return `${day}-${month}-${year}`;

}

loadPayments();



// Search

document.getElementById("searchInput").addEventListener("input", function(){

let search = this.value.toLowerCase();

let rows = document.querySelectorAll("#paymentBody tr");

rows.forEach(row => {

let text = row.innerText.toLowerCase();

row.style.display = text.includes(search) ? "" : "none";

});

});




// Filters

function filterInvoices(type){

tbody.innerHTML="";

invoices.forEach((inv,index)=>{

let payments = inv.payments || [];

let paid = payments.reduce((sum,p)=>sum+p.amount,0);

let remaining = inv.total - paid;

let status = remaining > 0 ? "Pending" : "Paid";

if(type === "Pending" && status !== "Pending") return;
if(type === "Paid" && status !== "Paid") return;

let row = `

<tr>

<td>${inv.invoiceNo}</td>

<td>${inv.vendor}</td>

<td>${formatDate(inv.date)}</td>

<td>₹${inv.total}</td>

<td>₹${paid}</td>

<td>₹${remaining}</td>

<td>

${remaining > 0
? `<button onclick="openPanel(${index})">Pay</button>`
: "✔ Paid"}

<button onclick="viewPayments(${index})">View Payments</button>

</td>

</tr>
`;

tbody.innerHTML += row;

});

}



function clearPanel(){

document.getElementById("payAmount").value="";
document.getElementById("payDate").value="";
document.getElementById("payMode").selectedIndex=0;

}



function viewPayments(index){

let inv = invoices[index];

let payments = inv.payments || [];

let html = "";

if(payments.length === 0){

html = `
<tr>
<td colspan="5" style="text-align:center;">
No payments recorded
</td>
</tr>
`;

}
else{

payments.forEach((p,i)=>{

html += `
<tr>
<td>${i+1}</td>
<td>₹${p.amount}</td>
<td>${p.mode}</td>
<td>${formatDate(p.date)}</td>
<td>
<button onclick="editPayment(${index},${i})">Edit</button>
<button onclick="deletePayment(${index},${i})">Delete</button>
</td>
</tr>
`;

});

}

document.getElementById("historyList").innerHTML = html;

document.getElementById("historyPanel").style.display="block";

}




function closeHistory(){

document.getElementById("historyPanel").style.display="none";

}



function deletePayment(invIndex,payIndex){

if(!confirm("Delete this payment?")) return;

invoices[invIndex].payments.splice(payIndex,1);

localStorage.setItem("purchaseInvoices", JSON.stringify(invoices));

viewPayments(invIndex);
loadPayments();

}



function editPayment(invIndex,payIndex){

let payment = invoices[invIndex].payments[payIndex];

document.getElementById("payAmount").value = payment.amount;
document.getElementById("payMode").value = payment.mode;
document.getElementById("payDate").value = payment.date;

selectedIndex = invIndex;

document.getElementById("historyPanel").style.display="none";

document.getElementById("paymentPanel").style.display="block";

}