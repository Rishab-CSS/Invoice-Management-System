if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}

const processRows = document.getElementById("processRows");

const machines = [
"Inhouse Materials",
"CNC/01",
"Milling/01",
"Lathe/01",
"Lathe/02",
"Drilling Machine/01",
"Outsourcing",
"Inhouse"
];


// =======================
// GENERATE ROUTE CARD NO
// =======================

function generateRCNo(){

let routeCards = JSON.parse(localStorage.getItem("routeCards")) || [];

if(routeCards.length === 0){
return "RPIC/RC/01";
}

/* extract numbers */

let numbers = routeCards.map(rc => {

let parts = rc.rcNo.split("/"); // ["RPIC","RC","01"]

return parseInt(parts[2]) || 0;

});

/* find max */

let max = Math.max(...numbers);

/* next number */

let next = max + 1;

return "RPIC/RC/" + String(next).padStart(2,"0");

}


document.getElementById("rcNo").value = generateRCNo();


// =======================
// LOAD CUSTOMERS
// =======================

function loadCustomers(){

let customers = JSON.parse(localStorage.getItem("customers")) || [];

let select = document.getElementById("rcCustomer");

select.innerHTML = "<option value=''>Select Customer...</option>";

customers.forEach(c => {

let opt = document.createElement("option");
opt.value = c.name;
opt.textContent = c.name;

select.appendChild(opt);

});

}

loadCustomers();


// =======================
// LOAD PRODUCTS
// =======================

function loadProducts(){

let products = JSON.parse(localStorage.getItem("products")) || [];

let datalist = document.getElementById("productList");

datalist.innerHTML = "";

products.forEach(p => {

let opt = document.createElement("option");
opt.value = p.productName;

datalist.appendChild(opt);

});

}

loadProducts();


// =======================
// MACHINE DROPDOWN BUILDER
// =======================

function setupMachineDropdown(row){

let machineSelect = row.querySelector(".machine");
let otherInput = row.querySelector(".machine-other");

/* Default */

let defaultOpt = document.createElement("option");
defaultOpt.value = "";
defaultOpt.textContent = "Select Machine/Vendor Name";
defaultOpt.disabled = true;
defaultOpt.selected = true;

machineSelect.appendChild(defaultOpt);

/* Machine list */

machines.forEach(m => {

let opt = document.createElement("option");
opt.value = m;
opt.textContent = m;

machineSelect.appendChild(opt);

});

/* Others option */

let otherOpt = document.createElement("option");
otherOpt.value = "OTHER";
otherOpt.textContent = "Others";

machineSelect.appendChild(otherOpt);

/* Change event */

machineSelect.addEventListener("change", function(){

if(this.value === "OTHER"){
otherInput.style.display = "block";
}else{
otherInput.style.display = "none";
}

});

}


// =======================
// LOAD PROCESSES
// =======================

document.getElementById("rcProduct").addEventListener("input", function(){

let products = JSON.parse(localStorage.getItem("products")) || [];

let product = products.find(p => p.productName === this.value);

/* ONLY clear & reload if product is found */

if(product){

processRows.innerHTML = "";

product.processes.forEach((proc,i)=>{

let row = document.createElement("tr");

row.innerHTML = `

<td class="sl-no">${i+1}</td>

<td>${proc}</td>

<td>
<select class="machine"></select>
<input type="text" class="machine-other"
placeholder="Enter Machine/Vendor"
style="display:none;margin-top:4px;">
</td>

<td><input type="date" class="start"></td>

<td><input type="date" class="end"></td>

<td><input type="number" class="produced"></td>

<td><input type="number" class="accepted"></td>

<td><input type="number" class="rework"></td>

<td><input type="number" class="reject"></td>

<td><input type="text" class="operator"></td>

<td>
<button type="button" class="btn btn-danger remove-process">X</button>
</td>

`;

processRows.appendChild(row);

setupMachineDropdown(row);

});

}

});


// =======================
// SAVE ROUTE CARD
// =======================

function saveRouteCard(){

let rows = Array.from(processRows.children);

let processes = [];

rows.forEach(row=>{

let machineSelect = row.querySelector(".machine").value;
let otherMachine = row.querySelector(".machine-other")?.value;

processes.push({

process: row.querySelector(".process-name")
? row.querySelector(".process-name").value
: row.children[1].innerText,

machine: machineSelect === "OTHER" ? otherMachine : machineSelect,

startDate: formatDate(row.querySelector(".start").value),
endDate: formatDate(row.querySelector(".end").value),

producedQty: Number(row.querySelector(".produced").value),
acceptedQty: Number(row.querySelector(".accepted").value),
reworkQty: Number(row.querySelector(".rework").value),
rejectedQty: Number(row.querySelector(".reject").value),

operator: row.querySelector(".operator").value

});

});

let routeCard = {

id: Date.now(),

rcNo: document.getElementById("rcNo").value,
customer: document.getElementById("rcCustomer").value,
product: document.getElementById("rcProduct").value,
partNumber: document.getElementById("rcPartNo").value,
qty: Number(document.getElementById("rcQty").value),
poNo: document.getElementById("rcPoNo").value,

processes: processes

};

let routeCards = JSON.parse(localStorage.getItem("routeCards")) || [];

let index = routeCards.findIndex(r => r.rcNo === routeCard.rcNo);

if(index !== -1){
routeCards[index] = routeCard;
}else{
routeCards.push(routeCard);
}

localStorage.setItem("routeCards", JSON.stringify(routeCards));

alert("Route Card Saved");

location.reload();

}


// =========================
// EDIT MODE
// =========================

let editing = JSON.parse(localStorage.getItem("editRouteCard"));

if(editing){

document.getElementById("rcNo").value = editing.rcNo;
document.getElementById("rcCustomer").value = editing.customer;
document.getElementById("rcProduct").value = editing.product;
document.getElementById("rcPartNo").value = editing.partNumber || "";
document.getElementById("rcQty").value = editing.qty;
document.getElementById("rcPoNo").value = editing.poNo || "";

processRows.innerHTML = "";

editing.processes.forEach((proc,i)=>{

let row = document.createElement("tr");

row.innerHTML = `

<td class="sl-no">${i+1}</td>

<td>${proc.process}</td>

<td>
<select class="machine"></select>
<input type="text" class="machine-other"
placeholder="Enter Machine/Vendor"
style="display:none;margin-top:4px;">
</td>

<td><input type="date" class="start"></td>

<td><input type="date" class="end"></td>

<td><input type="number" class="produced" value="${proc.producedQty}"></td>

<td><input type="number" class="accepted" value="${proc.acceptedQty}"></td>

<td><input type="number" class="rework" value="${proc.reworkQty}"></td>

<td><input type="number" class="reject" value="${proc.rejectedQty}"></td>

<td><input type="text" class="operator" value="${proc.operator}"></td>

<td>
<button type="button" class="btn btn-danger remove-process">X</button>
</td>

`;

processRows.appendChild(row);

setupMachineDropdown(row);

row.querySelector(".machine").value = machines.includes(proc.machine) ? proc.machine : "OTHER";

if(!machines.includes(proc.machine)){
row.querySelector(".machine-other").style.display = "block";
row.querySelector(".machine-other").value = proc.machine;
}

});

localStorage.removeItem("editRouteCard");

}


// =======================
// REMOVE PROCESS
// =======================

processRows.addEventListener("click", function(e){

if(e.target.classList.contains("remove-process")){

let row = e.target.closest("tr");

row.remove();

renumberProcesses();

}

});


function renumberProcesses(){

Array.from(processRows.children).forEach((row,i)=>{

row.querySelector(".sl-no").textContent = i+1;

});

}


// =======================
// DATE FORMAT
// =======================

function formatDate(date){

if(!date) return "";

let [y,m,d] = date.split("-");

return `${d}-${m}-${y}`;

}


// =======================
// ADD PROCESS
// =======================

document.getElementById("addProcessBtn").addEventListener("click", addProcessRow);

function addProcessRow(){

let rowCount = processRows.children.length + 1;

let row = document.createElement("tr");

row.innerHTML = `

<td class="sl-no">${rowCount}</td>

<td><input type="text" class="process-name" placeholder="Process Name"></td>

<td>
<select class="machine"></select>
<input type="text" class="machine-other"
placeholder="Enter Machine/Vendor"
style="display:none;margin-top:4px;">
</td>

<td><input type="date" class="start"></td>

<td><input type="date" class="end"></td>

<td><input type="number" class="produced"></td>

<td><input type="number" class="accepted"></td>

<td><input type="number" class="rework"></td>

<td><input type="number" class="reject"></td>

<td><input type="text" class="operator"></td>

<td>
<button type="button" class="btn btn-danger remove-process">X</button>
</td>

`;

processRows.appendChild(row);

setupMachineDropdown(row);

}