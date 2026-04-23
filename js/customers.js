const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}


let customers = [];
let editId = null;

// Base API URL
const API_URL = "http://localhost:3000/api/customers";

// Load Customers
async function loadCustomers() {

let res = await fetch(API_URL);
customers = await res.json();

let table = document.querySelector("#customerTable tbody");
table.innerHTML = "";

customers.forEach((cust) => {
    table.innerHTML += `
    <tr>
    <td>${cust.name}</td>
    <td>${cust.gst}</td>
    <td>${cust.vendorCode}</td>
    <td>
    <button onclick="viewCustomer('${cust._id}')">View</button>
        <button onclick="editCustomer('${cust._id}')">Edit</button>
        <button onclick="deleteCustomer('${cust._id}')">Delete</button>
    </td>
    </tr>
    `;
});

}

// Add / Update Customer
async function addCustomer(){

let customer = {
name: document.getElementById("custName").value,
address: document.getElementById("custAddress").value,
gst: document.getElementById("custGST").value,
vendorCode: document.getElementById("custVendor").value,
paymentTerms: Number(document.getElementById("paymentTerms").value)
};

// 👉 UPDATE
if(editId){

await fetch(`${API_URL}/${editId}`, {
method: "PUT",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(customer)
});

editId = null;
document.getElementById("customerBtn").innerText = "Add Customer";

}else{

// 👉 ADD
await fetch(API_URL, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(customer)
});

}

loadCustomers();

// Clear fields
document.getElementById("custName").value="";
document.getElementById("custAddress").value="";
document.getElementById("custGST").value="";
document.getElementById("custVendor").value="";
document.getElementById("paymentTerms").value="";

}

// Edit Customer
function editCustomer(id){

let confirmEdit = confirm("Do you want to edit this customer?");
if(!confirmEdit) return;

let cust = customers.find(c => c._id === id);

document.getElementById("custName").value = cust.name;
document.getElementById("custAddress").value = cust.address;
document.getElementById("custGST").value = cust.gst;
document.getElementById("custVendor").value = cust.vendorCode;
document.getElementById("paymentTerms").value = cust.paymentTerms || "";

editId = id;

document.getElementById("customerBtn").innerText = "Save";

}

// Delete Customer
async function deleteCustomer(id){

let confirmDelete = confirm("Are you sure?");
if(!confirmDelete) return;

await fetch(`${API_URL}/${id}`, {
method: "DELETE"
});

loadCustomers();

}

// Initial load
loadCustomers();


function viewCustomer(id){

let c = customers.find(x => x._id === id);

if(!c) return;

document.getElementById("v_name").innerText = c.name;
document.getElementById("v_address").innerText = c.address;
document.getElementById("v_gst").innerText = c.gst;
document.getElementById("v_vendor").innerText = c.vendorCode;
document.getElementById("v_terms").innerText = c.paymentTerms || 45;

document.getElementById("viewPanel").style.display = "block";

}

function closeViewPanel(){
document.getElementById("viewPanel").style.display = "none";
}