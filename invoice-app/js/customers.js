let editIndex = -1;

// --- Default Customers (Backup) ---
const DEFAULT_CUSTOMERS = [
{
    name: "H&P",
    address: "BEML LIMITED\nHYDRAULIC AND POWERLINE DIVISION\nBEML NAGAR\nKGF-563115",
    gst: "29AAACB8433D1ZU",
    vendorCode: "703279"
},
{
    name: "EM Divison",
    address: "BEML LIMITED\nEM DIVISON\nBEML NAGAR\nKGF-563115",
    gst: "29AAACB8433D1ZU",
    vendorCode: "703279"
},
{
    name: "KGF Marketing",
    address: "BEML LIMITED\nKGF - MARKETING SPARES\nBEML NAGAR\nKGF-563115",
    gst: "29AAACB8433D1ZU",
    vendorCode: "703279"
},
{
    name: "Mysore Marketing",
    address: "BEML LIMITED\nMYSORE MARKETING SPARES\nBELVADI POST\nMYSORE-570018",
    gst: "29AAACB8433D1ZU",
    vendorCode: "703279"
},
{
    name: "Mysore Engine Divison",
    address: "BEML LIMITED\nMYSORE - ENGINE DIVISON\nBELVADI POST\nMYSORE-570018",
    gst: "29AAACB8433D1ZU",
    vendorCode: "703279"
},
{
    name: "Mysore Truck Divison",
    address: "BEML LIMITED\nMYSORE - TRUCK DIVISON\nBELVADI POST\nMYSORE-570018",
    gst: "29AAACB8433D1ZU",
    vendorCode: "703279"
},
{
    name: "AMC",
    address: "ARUN MACHINE COMPONENTS\nSB-119, 3RD CROSS, 1ST STAGE,\nPEENYA INDUSTRIAL AREA,\nBENGALURU-560058",
    gst: "29AEDPB1219F1Z2",
    vendorCode: ""
},
{
    name: "INFRA BAZAAR TECH PVT LTD",
    address: "INFRA BAZAAR TECH PVT LTD\nSURVEY NO. 27,DODDABALLAPURA-DEVANAHALLI ROAD,\nTHAMMASHETTIHALLI VILLAGE,\nKASABA HOBLI, DODDABALLAPUR,\nBANGALORE RURAL 561203.",
    gst: "29AAFCI8431B1ZO",
    vendorCode: "101721"
}
];

// Load customers
let customers = JSON.parse(localStorage.getItem("customers"));

// If nothing in storage → load defaults
if(!customers || customers.length === 0){

customers = DEFAULT_CUSTOMERS;

localStorage.setItem("customers", JSON.stringify(customers));

}


// Load Customer
function loadCustomers() {
    let table = document.querySelector("#customerTable tbody");
    table.innerHTML = "";

    customers.forEach((cust, index) => {
        table.innerHTML += `
        <tr>
        <td>${cust.name}</td>
        <td>${cust.gst}</td>
        <td>${cust.vendorCode}</td>
        <td>
            <button onclick="editCustomer(${index})">Edit</button>
            <button onclick="deleteCustomer(${index})">Delete</button>
        </td>
        </tr>
        `;
    });
}

// Add Customer
function addCustomer(){

let customer = {
name: document.getElementById("custName").value,
address: document.getElementById("custAddress").value,
gst: document.getElementById("custGST").value,
vendorCode: document.getElementById("custVendor").value
};

if(editIndex === -1){

// ADD NEW
customers.push(customer);

}else{

// UPDATE EXISTING
customers[editIndex] = customer;
editIndex = -1;

}

localStorage.setItem("customers", JSON.stringify(customers));

loadCustomers();

// Clear fields
document.getElementById("custName").value="";
document.getElementById("custAddress").value="";
document.getElementById("custGST").value="";
document.getElementById("custVendor").value="";

document.getElementById("customerBtn").innerText = "Add Customer";

}


// Customer Dropdown
function loadCustomerDropdown(){

let select = document.getElementById("customerSelect");

customers.forEach(cust=>{
let option = document.createElement("option");
option.value = cust.name;
option.textContent = cust.name;
select.appendChild(option);
})

}


// Fill Customer Address
function fillCustomerDetails(){

let name = document.getElementById("customerSelect").value;

let cust = customers.find(c => c.name === name);

document.getElementById("address").value = cust.address;
document.getElementById("gst").value = cust.gst;
document.getElementById("vendorCode").value = cust.vendorCode;

}

// Edit Customer
function editCustomer(index){

let confirmEdit = confirm("Do you want to edit this customer?");

if(!confirmEdit) return;

let cust = customers[index];

document.getElementById("custName").value = cust.name;
document.getElementById("custAddress").value = cust.address;
document.getElementById("custGST").value = cust.gst;
document.getElementById("custVendor").value = cust.vendorCode;

editIndex = index;

document.getElementById("customerBtn").innerText = "Save";

}

// Delete Customer
function deleteCustomer(index){

let confirmDelete = confirm("Are you sure you want to delete this customer ?");

if(!confirmDelete) return;

customers.splice(index,1);

localStorage.setItem("customers", JSON.stringify(customers));

loadCustomers();

}

loadCustomers();