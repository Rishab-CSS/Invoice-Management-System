if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}

let editingInvoice = JSON.parse(localStorage.getItem("editPurchaseInvoice"));

// Load edit data
if(editingInvoice){

document.getElementById("invoiceNo").value = editingInvoice.invoiceNo;
document.getElementById("vendor").value = editingInvoice.vendor;
document.getElementById("date").value = editingInvoice.date;
document.getElementById("amount").value = editingInvoice.total;

}

function savePurchaseInvoice(){

let invoiceNo = document.getElementById("invoiceNo").value;
let vendor = document.getElementById("vendor").value;
let date = document.getElementById("date").value;
let amount = document.getElementById("amount").value;

if(!invoiceNo || !vendor || !date || !amount){
alert("Please fill all fields");
return;
}

let invoices = JSON.parse(localStorage.getItem("purchaseInvoices")) || [];

let invoiceData = {

invoiceNo:invoiceNo,
vendor:vendor,
date:date,
total:Number(amount),
status:"Pending"

};

// Check edit mode
let index = invoices.findIndex(i => i.invoiceNo === invoiceNo);

if(index !== -1){

let oldPayments = invoices[index].payments || [];

invoiceData.payments = oldPayments;

invoices[index] = invoiceData;

}

else{
invoices.push(invoiceData);
}

localStorage.setItem("purchaseInvoices", JSON.stringify(invoices));

localStorage.removeItem("editPurchaseInvoice");

alert("Purchase Invoice Saved");

window.location.href = "view-purchase-invoice.html";

}