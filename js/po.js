// =========================
// AUTH CHECK
// =========================
const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

console.log("CORRECT PO.JS LOADED");

// =========================
// ELEMENTS
// =========================
const poNoInput = document.getElementById("poNo");
const customerSelect = document.getElementById("poCustomer");
const poDateInput = document.getElementById("poDate");
const itemsBody = document.getElementById("poItems");

// =========================
// FETCH CUSTOMERS
// =========================
async function getCustomers(){
    let res = await fetch("https://erp-system-303n.onrender.com/api/customers");
    return await res.json();
}

// =========================
// LOAD CUSTOMER DROPDOWN
// =========================
async function loadCustomers(){
    let customers = await getCustomers();

    customerSelect.innerHTML = `<option value="">Select Customer</option>`;

    customers.forEach(c => {
        let option = document.createElement("option");
        option.value = c.name;
        option.textContent = c.name;
        customerSelect.appendChild(option);
    });
}

// =========================
// ADD ITEM ROW
// =========================
function addPOItem(item = {}){

    let row = document.createElement("tr");

    row.innerHTML = `
        <td class="sl-no" style="text-align:center;"></td>
        <td><input class="part" value="${item.part || ""}"></td>
        <td><input class="partNo" value="${item.partNo || ""}"></td>
        <td><input class="hsn" value="${item.hsn || ""}"></td>
        <td><input type="number" class="qty" value="${item.orderedQty || ""}"></td>
        <td><input type="number" class="rate" value="${item.rate || ""}"></td>
        <td><button type="button" onclick="removePOItem(this)" class="btn btn-danger">X</button></td>
    `;

    let qtyInput = row.querySelector(".qty");

    // Preserve pending qty
    qtyInput.dataset.pending = item.pendingQty ?? item.orderedQty ?? 0;

    // Store old ordered qty
    qtyInput.dataset.oldordered = item.orderedQty ?? 0;

    itemsBody.appendChild(row);
    refreshPOItemNumbers();
}

function refreshPOItemNumbers(){
    Array.from(itemsBody.querySelectorAll('tr')).forEach((row, index) => {
        let cell = row.querySelector('.sl-no');
        if(cell) cell.textContent = index + 1;
    });
}

function removePOItem(button){
    let row = button.closest('tr');
    if(row) row.remove();
    refreshPOItemNumbers();
}

// =========================
// LOAD EDIT DATA
// =========================
function loadPOForEdit(){

    let editData = JSON.parse(localStorage.getItem("editPO"));

    if(!editData) return;

    console.log("Loaded Edit Data:", editData);

    poNoInput.value = editData.poNo;
    poNoInput.disabled = true;

    customerSelect.value = editData.customer;

    // Load PO Date
    poDateInput.value = editData.poDate || "";

    itemsBody.innerHTML = "";

    editData.items.forEach(item => {
        addPOItem(item);
    });
}

// =========================
// INIT
// =========================
async function init(){
    await loadCustomers();
    loadPOForEdit();
}

init();

// =========================
// SAVE FUNCTION
// =========================
async function savePO(){

    let poNo = poNoInput.value.trim();
    let customer = customerSelect.value;
    let poDate = poDateInput.value;

    if(!poNo || !customer || !poDate){
        alert("Fill all fields");
        return;
    }

    let rows = document.querySelectorAll("#poItems tr");
    let items = [];

    for(let row of rows){

        let qtyInput = row.querySelector(".qty");

        // ✅ FIXED: Properly get orderedQty
        let orderedQty = Number(qtyInput.value);

        let oldPending = Number(qtyInput.dataset.pending || 0);
        let oldOrdered = Number(qtyInput.dataset.oldordered || 0);

        // Calculate used qty
        let usedQty = oldOrdered - oldPending;

        if(usedQty < 0) usedQty = 0;

        // Prevent invalid edit
        if(orderedQty < usedQty){
            alert("Cannot reduce below already used quantity!");
            return;
        }

        // Calculate new pending safely
        let newPending = orderedQty - usedQty;

        if(newPending < 0) newPending = 0;

        items.push({
            part: row.querySelector(".part").value,
            partNo: row.querySelector(".partNo").value,
            hsn: row.querySelector(".hsn").value,
            orderedQty,
            pendingQty: newPending,
            rate: Number(row.querySelector(".rate").value)
        });
    }

    let editingPO = JSON.parse(localStorage.getItem("editPO"));

    if(editingPO){
        // UPDATE
        await fetch(`https://erp-system-303n.onrender.com/api/purchase-orders/${editingPO._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poNo,
                customer,
                poDate,
                items
            })
        });
    }
    else{
        // CREATE
        await fetch("https://erp-system-303n.onrender.com/api/purchase-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poNo,
                customer,
                poDate,
                items
            })
        });
    }

    localStorage.removeItem("editPO");

    window.location.href = "view-po.html";
}