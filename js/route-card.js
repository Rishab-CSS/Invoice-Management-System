document.addEventListener("DOMContentLoaded", function(){

// =========================
// AUTH CHECK
// =========================
const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

const processRows = document.getElementById("processRows");

// =======================
// API URLS
// =======================
const PRODUCT_API = "http://localhost:3000/api/products";
const PROCESS_API = "http://localhost:3000/api/processes";
const ROUTE_API = "http://localhost:3000/api/route-cards";
const PO_API = "http://localhost:3000/api/purchase-orders";
const CUSTOMER_API = "http://localhost:3000/api/customers";

// =======================
// DATA
// =======================
let productMap = {};
let poMap = {};
let operators = [];
let editId = null;

// =======================
// MACHINE LIST
// =======================
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

const routeProcesses = [
    "Raw Material Inspection",
    "Cutting",
    "Machining (Roughing)",
    "Milling",
    "Heat Treatment",
    "Machining (Finishing)",
    "Blackening",
    "Plating",
    "Assembly",
    "Drilling",
    "Turning",
    "Grinding & Rolling",
    "Inspection & Dispatch"
];

// =======================
// RC NUMBER
// =======================
async function generateRCNo(){
    const res = await fetch(ROUTE_API);
    const data = await res.json();

    if(data.length === 0) return "RPIC/RC/01";

    let max = 0;

    data.forEach(rc=>{
        let num = parseInt(rc.rcNo?.split("/")[2]);
        if(num > max) max = num;
    });

    return "RPIC/RC/" + String(max+1).padStart(2,"0");
}

// =======================
// LOAD CUSTOMERS
// =======================
async function loadCustomers(){
    const res = await fetch(CUSTOMER_API);
    const customers = await res.json();

    const select = document.getElementById("rcCustomer");
    select.innerHTML = "<option value=''>Select Customer...</option>";

    customers.forEach(c=>{
        let opt = document.createElement("option");
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

// =======================
// LOAD PRODUCTS
// =======================
async function loadProducts(){
    const res = await fetch(PRODUCT_API);
    const data = await res.json();

    const datalist = document.getElementById("productList");
    datalist.innerHTML = "";

    data.forEach(p=>{
        let opt = document.createElement("option");
        opt.value = p.name;
        datalist.appendChild(opt);

        productMap[p.name] = p._id;
    });
}

async function loadOperators(){
    const res = await fetch("http://localhost:3000/api/employees");
    operators = await res.json();
}

// =======================
// LOAD POs
// =======================
async function loadPOs(){
    const res = await fetch(PO_API);
    const data = await res.json();

    const datalist = document.getElementById("poList");
    datalist.innerHTML = "";

    data.forEach(po=>{
        let opt = document.createElement("option");
        opt.value = po.poNo;
        datalist.appendChild(opt);

        poMap[po.poNo] = po;
    });
}

// =======================
// PRODUCT SELECT
// =======================
document.getElementById("rcProduct").addEventListener("input", async function(){

    let productName = this.value;
    let productId = productMap[productName];

    document.getElementById("productId").value = productId || "";

    if(!productId) return;

    const res = await fetch(`${PROCESS_API}/${productId}`);
    const data = await res.json();

    processRows.innerHTML = "";

    data.processes.forEach((proc,i)=>{
        processRows.appendChild(createProcessRow(proc.name, i+1));
    });

});

// =======================
// PO SELECT
// =======================
document.getElementById("rcPoNo").addEventListener("input", function(){

    let po = poMap[this.value];
    if(!po) return;

    document.getElementById("rcCustomer").value = po.customer;
    document.getElementById("poId").value = po._id;
});



document.getElementById("rcinvoiceNo").addEventListener("input", fetchInvoiceDetails);


async function fetchInvoiceDetails(){

    const invoiceNo = document.getElementById("rcinvoiceNo").value;

    if(!invoiceNo) return;

    try{

        const res = await fetch("http://localhost:3000/api/invoices");
        const invoices = await res.json();

        const invoice = invoices.find(inv => inv.invoiceNo === invoiceNo);

        if(!invoice){
            console.log("Invoice not found");
            return;
        }

        // ✅ CUSTOMER
        document.getElementById("rcCustomer").value = invoice.customerName || invoice.customer;

        // ✅ PO
        document.getElementById("rcPoNo").value = invoice.poNo;

        // trigger PO logic (important for poId)
        document.getElementById("rcPoNo").dispatchEvent(new Event("input"));

        // ✅ PART NUMBER
        handleInvoiceParts(invoice.items);
    

    }catch(err){
        console.error(err);
    }
}



function handleInvoiceParts(items){

    if(!items || items.length === 0) return;

    // take first item
    const part = items[0].no;

    document.getElementById("rcPartNo").value = part;
}


// =======================
// MACHINE DROPDOWN
// =======================
function setupMachineDropdown(row, selectedValue = ""){

    let machineSelect = row.querySelector(".machine");
    let otherInput = row.querySelector(".machine-other");

    machineSelect.innerHTML = "";

    let defaultOpt = new Option("Select Machine/Vendor", "", true, true);
    defaultOpt.disabled = true;
    machineSelect.appendChild(defaultOpt);

    machines.forEach(m=>{
        machineSelect.appendChild(new Option(m, m));
    });

    machineSelect.appendChild(new Option("Others", "OTHER"));

    if(machines.includes(selectedValue)){
        machineSelect.value = selectedValue;
    }else if(selectedValue){
        machineSelect.value = "OTHER";
        otherInput.style.display = "block";
        otherInput.value = selectedValue;
    }

    machineSelect.addEventListener("change", function(){
        otherInput.style.display = this.value === "OTHER" ? "block" : "none";
    });
}

function setupProcessDropdown(row, selectedValue = "") {
    const select = row.querySelector(".process-name");
    const otherInput = row.querySelector(".process-name-other");

    select.innerHTML = "";
    const placeholder = new Option("Select Process", "", true, true);
    placeholder.disabled = true;
    select.appendChild(placeholder);

    routeProcesses.forEach(proc => {
        select.appendChild(new Option(proc, proc));
    });
    select.appendChild(new Option("Others", "OTHER"));

    if (routeProcesses.includes(selectedValue)) {
        select.value = selectedValue;
    } else if (selectedValue) {
        select.value = "OTHER";
        otherInput.style.display = "block";
        otherInput.value = selectedValue;
    }

    select.addEventListener("change", function() {
        if (this.value === "OTHER") {
            otherInput.style.display = "block";
            otherInput.value = "";
        } else {
            otherInput.style.display = "none";
            otherInput.value = "";
        }
    });
}

function setupOperatorDropdown(row, selectedValue = "") {
    const select = row.querySelector(".operator");
    select.innerHTML = "";

    const placeholder = new Option("Select Operator", "", true, true);
    placeholder.disabled = true;
    select.appendChild(placeholder);

    operators.forEach(op => {
        select.appendChild(new Option(op.name, op.name));
    });

    if (operators.some(op => op.name === selectedValue)) {
        select.value = selectedValue;
    }
}

// =======================
// CREATE PROCESS ROW
// =======================
function createProcessRow(name="", index){

    let row = document.createElement("tr");

    row.innerHTML = `
    <td class="sl">${index}</td>
    <td>
        <select class="process-name"></select>
        <input type="text" class="process-name-other" placeholder="Enter process name" style="display:none;margin-top:4px;">
    </td>

    <td>
        <select class="machine"></select>
        <input type="text" class="machine-other" style="display:none;margin-top:4px;">
    </td>

    <td><input type="date" class="start"></td>
    <td><input type="date" class="end"></td>

    <td><input type="number" class="produced"></td>
    <td><input type="number" class="accepted"></td>
    <td><input type="number" class="rework"></td>
    <td><input type="number" class="reject"></td>

    <td><select class="operator"></select></td>

    <td><button class="btn btn-danger remove-process">X</button></td>
    `;

    setupProcessDropdown(row, name);
    setupMachineDropdown(row);
    setupOperatorDropdown(row);

    return row;
}

// =======================
// ADD PROCESS
// =======================
document.getElementById("addProcessBtn").addEventListener("click", ()=>{
    processRows.appendChild(createProcessRow("", processRows.children.length + 1));
});

// =======================
// REMOVE PROCESS
// =======================
processRows.addEventListener("click", function(e){
    if(e.target.classList.contains("remove-process")){
        e.target.closest("tr").remove();
        updateSerial();
    }
});

function updateSerial(){
    Array.from(processRows.children).forEach((row,i)=>{
        row.querySelector(".sl").innerText = i+1;
    });
}

// =======================
// SAVE / UPDATE
// =======================
async function saveRouteCard(){

    let processes = [];

    Array.from(processRows.children).forEach(row=>{
        let machine = row.querySelector(".machine").value;
        let other = row.querySelector(".machine-other").value;

        const processSelect = row.querySelector(".process-name");
    const processOther = row.querySelector(".process-name-other");
    const selectedProcess = processSelect.value === "OTHER" ? processOther.value : processSelect.value;

    processes.push({
            process: selectedProcess,
            machine: machine === "OTHER" ? other : machine,
            startDate: row.querySelector(".start").value,
            endDate: row.querySelector(".end").value,
            producedQty: Number(row.querySelector(".produced").value),
            acceptedQty: Number(row.querySelector(".accepted").value),
            reworkQty: Number(row.querySelector(".rework").value),
            rejectedQty: Number(row.querySelector(".reject").value),
            operator: row.querySelector(".operator").value
        });
    });

    let productName = document.getElementById("rcProduct").value;
    let productId = document.getElementById("productId").value;

    if(!productName || !productId){
        alert("Please select product properly");
        return;
    }

    let poId = document.getElementById("poId").value || null;

let routeCard = {
    rcNo: document.getElementById("rcNo").value,
    customer: document.getElementById("rcCustomer").value,
    product: productName,
    productId: productId,
    partNumber: document.getElementById("rcPartNo").value,
    qty: Number(document.getElementById("rcQty").value),
    poNo: document.getElementById("rcPoNo").value,
    poId: poId,
    invoiceNo: document.getElementById("rcinvoiceNo").value, // ✅ ADD THIS
    processes
};


    let res;

    if(editId){
        res = await fetch(`${ROUTE_API}/${editId}`,{
            method:"PUT",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(routeCard)
        });
    }else{
        res = await fetch(`${ROUTE_API}/add`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(routeCard)
        });
    }

    if(!res.ok){
        const err = await res.json();
        alert("Error: " + err.error);
        return;
    }

    localStorage.removeItem("editRouteCard");

    alert("Route Card Saved");
    window.location.href = "view-route-cards.html";
}

// =======================
// INIT
// =======================
async function init(){

    await loadCustomers();
    await loadProducts();
    await loadPOs();
    await loadOperators();

    const editData = JSON.parse(localStorage.getItem("editRouteCard"));

    if(editData){

        editId = editData._id;

        document.getElementById("rcNo").value = editData.rcNo;
        document.getElementById("rcCustomer").value = editData.customer;
        document.getElementById("rcProduct").value = editData.product;
        document.getElementById("productId").value = editData.productId || ""; // 🔥 FIX
        document.getElementById("rcPartNo").value = editData.partNumber;
        document.getElementById("rcQty").value = editData.qty;
        document.getElementById("rcPoNo").value = editData.poNo;
        document.getElementById("poId").value = editData.poId || "";

        processRows.innerHTML = "";

        editData.processes.forEach((p,i)=>{
            let row = createProcessRow(p.process, i+1);
            setupMachineDropdown(row, p.machine);
            setupOperatorDropdown(row, p.operator);

            row.querySelector(".start").value = p.startDate || "";
            row.querySelector(".end").value = p.endDate || "";
            row.querySelector(".produced").value = p.producedQty || "";
            row.querySelector(".accepted").value = p.acceptedQty || "";
            row.querySelector(".rework").value = p.reworkQty || "";
            row.querySelector(".reject").value = p.rejectedQty || "";

            processRows.appendChild(row);
        });

    }else{
        document.getElementById("rcNo").value = await generateRCNo();
    }

    const navigationEntries = performance.getEntriesByType("navigation");
    const navigationType = navigationEntries.length ? navigationEntries[0].type : (performance.navigation && performance.navigation.type === 1 ? "reload" : "");

    if (navigationType === "reload" && editId) {
        localStorage.removeItem("editRouteCard");
        window.location.href = "create-route-card.html";
        return;
    }

}

window.saveRouteCard = saveRouteCard;

init();

});