if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}



let invoices = JSON.parse(localStorage.getItem("invoices")) || [];

const tbody = document.getElementById("paymentBody");

let totalPending = 0;
let totalReceived = 0;
let totalOverdue = 0;

function calculateDueDate(invoiceDate){

let date = new Date(invoiceDate);

date.setDate(date.getDate() + 45); // default 45 days

return date.toISOString().split("T")[0];

}

function calculateOverdue(dueDate){

let today = new Date();
let due = new Date(dueDate);

let diff = today - due;

let days = Math.floor(diff / (1000 * 60 * 60 * 24));

return days > 0 ? days : 0;

}

function loadPayments(){

tbody.innerHTML="";

invoices.forEach((inv,index)=>{

let status = inv.status || "Pending";

let dueDate = calculateDueDate(inv.date);

let overdueDays = calculateOverdue(dueDate);

let overdueText = "-";

if(status==="Pending" && overdueDays>0){

overdueText = `<span class="overdue">🔴 ${overdueDays} days</span>`;

totalOverdue += Number(inv.total);

}

if(status==="Pending"){

totalPending += Number(inv.total);

}

if(status==="Received"){

totalReceived += Number(inv.total);

}


let rowClass = "";

if(status === "Received"){
rowClass = "received-row";
}
else if(overdueDays > 0){
rowClass = "overdue-row";
}
else{
rowClass = "pending-row";
}


let row = `

<tr class="${rowClass}">

<td>${inv.invoiceNo}</td>
<td>${inv.customer}</td>
<td>${formatDate(inv.date)}</td>
<td>${formatDate(dueDate)}</td>
<td>₹${inv.total}</td>
<td class="status">${status}</td>
<td class="overdue-cell">${overdueText}</td>

<td>
${status==="Pending"
? `<button onclick="markReceived(${index})">✓ Received</button>`
: "✔ Received"}
</td>

</tr>
`;

tbody.innerHTML += row;

});

document.getElementById("totalPending").innerText = "₹"+totalPending;
document.getElementById("totalReceived").innerText = "₹"+totalReceived;
document.getElementById("totalOverdue").innerText = "₹"+totalOverdue;

}

function markReceived(index){

invoices[index].status = "Received";

localStorage.setItem("invoices", JSON.stringify(invoices));

location.reload();

}

function formatDate(dateString){

let d = new Date(dateString);

let day = String(d.getDate()).padStart(2,'0');
let month = String(d.getMonth()+1).padStart(2,'0');
let year = d.getFullYear();

return `${day}-${month}-${year}`;

}

loadPayments();


// Search Bar

document.getElementById("searchInput").addEventListener("input", function(){

let search = this.value.toLowerCase();

let rows = document.querySelectorAll("#paymentBody tr");

const months = {
january:"01", jan:"01",
february:"02", feb:"02",
march:"03", mar:"03",
april:"04", apr:"04",
may:"05",
june:"06", jun:"06",
july:"07", jul:"07",
august:"08", aug:"08",
september:"09", sep:"09", sept:"09",
october:"10", oct:"10",
november:"11", nov:"11",
december:"12", dec:"12"
};

rows.forEach(row => {

let text = row.innerText.toLowerCase();
let dateText = row.children[2].innerText;
let month = dateText.split("-")[1];

let show = text.includes(search);


// month search
if(months[search]){
show = month === months[search];
}

row.style.display = show ? "" : "none";

});

});




//Filter Buttons

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
row.style.display = status === "Received" ? "" : "none";
}

else if(type === "Overdue"){
row.style.display = overdue.includes("🔴") ? "" : "none";
}

});

}