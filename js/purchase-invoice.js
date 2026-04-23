const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

let editingInvoice = JSON.parse(localStorage.getItem("editPurchaseInvoice"));

// Load edit data
if(editingInvoice){

document.getElementById("invoiceNo").value = editingInvoice.invoiceNo;
document.getElementById("vendor").value = editingInvoice.vendorName;
document.getElementById("date").value = editingInvoice.invoiceDate;
document.getElementById("amount").value = editingInvoice.grandTotal;

}

async function savePurchaseInvoice(){

let invoiceNo = document.getElementById("invoiceNo").value;
let vendor = document.getElementById("vendor").value;
let date = document.getElementById("date").value;
let amount = document.getElementById("amount").value;

if(!invoiceNo || !vendor || !date || !amount){
alert("Please fill all fields");
return;
}

let invoiceData = {
invoiceNo: invoiceNo,
vendorName: vendor,
invoiceDate: date,
grandTotal: Number(amount),
status: "Pending"
};

try {

let url = "https://erp-system-303n.onrender.com/api/purchase-invoices";
let method = "POST";

// 🔥 IMPORTANT PART
if(editingInvoice && editingInvoice._id){
  url = `https://erp-system-303n.onrender.com/api/purchase-invoices/${editingInvoice._id}`;
  method = "PUT";
}

let res = await fetch(url, {
method: method,
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify(invoiceData)
});

await res.json();

alert(editingInvoice ? "Invoice Updated ✅" : "Purchase Invoice Saved ✅");

localStorage.removeItem("editPurchaseInvoice");

window.location.href = "view-purchase-invoice.html";

} catch (err) {
console.error(err);
alert("Error saving invoice");
}
}