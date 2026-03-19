if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}

const table = document.querySelector("#invoiceTable tbody");
const searchBox = document.getElementById("searchBox");

function loadInvoices(){

table.innerHTML="";

let invoices = JSON.parse(localStorage.getItem("purchaseInvoices")) || [];

invoices.forEach(inv=>{

let row = document.createElement("tr");

row.innerHTML = `

<td>${inv.invoiceNo}</td>
<td>${inv.vendor}</td>
<td>${inv.date}</td>
<td>₹ ${Number(inv.total).toLocaleString("en-IN")}</td>

<td>
<button onclick="editInvoice('${inv.invoiceNo}')">Edit</button>
<button onclick="deleteInvoice('${inv.invoiceNo}')">Delete</button>
</td>

`;

table.appendChild(row);

});

}

loadInvoices();

function editInvoice(no){

let invoices = JSON.parse(localStorage.getItem("purchaseInvoices")) || [];

let inv = invoices.find(i=>i.invoiceNo===no);

localStorage.setItem("editPurchaseInvoice", JSON.stringify(inv));

window.location.href = "add-purchase-invoice.html";

}

function deleteInvoice(no){

if(!confirm("Delete this purchase invoice?")){
return;
}

let invoices = JSON.parse(localStorage.getItem("purchaseInvoices")) || [];

invoices = invoices.filter(inv=>inv.invoiceNo!==no);

localStorage.setItem("purchaseInvoices", JSON.stringify(invoices));

loadInvoices();

}


// Search

searchBox.addEventListener("input", function(){

let search = searchBox.value.toLowerCase();

let rows = table.querySelectorAll("tr");

rows.forEach(row=>{

let text = row.innerText.toLowerCase();

row.style.display = text.includes(search) ? "" : "none";

});

});