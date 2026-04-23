const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

const table = document.querySelector("#invoiceTable tbody");
const searchBox = document.getElementById("searchBox");

async function loadInvoices(){

table.innerHTML = "";

try {

let res = await fetch("https://erp-system-303n.onrender.com/api/purchase-invoices");
let invoices = await res.json();

invoices.forEach(inv => {

let row = document.createElement("tr");

row.innerHTML = `
<td>${inv.invoiceNo}</td>
<td>${inv.vendorName}</td>
<td>${inv.invoiceDate}</td>
<td>₹ ${Number(inv.grandTotal).toLocaleString("en-IN")}</td>

<td>
<button onclick="editInvoice('${inv._id}')">Edit</button>
<button onclick="deleteInvoice('${inv._id}')">Delete</button>
</td>
`;

table.appendChild(row);

});

} catch (err) {
console.error(err);
alert("Error loading invoices");
}

}


loadInvoices();



async function editInvoice(id){

try {

let res = await fetch(`https://erp-system-303n.onrender.com/api/purchase-invoices/${id}`);
let inv = await res.json();

localStorage.setItem("editPurchaseInvoice", JSON.stringify(inv));

window.location.href = "add-purchase-invoice.html";

} catch (err) {
console.error(err);
alert("Error fetching invoice");
}

}




async function deleteInvoice(id){

if(!confirm("Delete this purchase invoice?")){
return;
}

try {

await fetch(`https://erp-system-303n.onrender.com/api/purchase-invoices/${id}`, {
method: "DELETE"
});

loadInvoices();

} catch (err) {
console.error(err);
alert("Error deleting invoice");
}

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