const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}



const API_URL = "https://erp-system-303n.onrender.com/api/customers";

async function getCustomers(){
    let res = await fetch(API_URL);
    return await res.json();
}




// --- Init ---
let customersList = [];
let currentPaymentTerms = 45; // default
const itemsBody = document.getElementById('itemsBody');
const customerSelect = document.getElementById('customerSelect');
customerSelect.addEventListener("change", loadCustomer);
const gstTypeSelect = document.getElementById('gstType');

let currentExcelBlob = null;
let currentFileName = '';
let nextNo = 1;


(async function init() {


    // Clear stale edit mode
if (!localStorage.getItem("editInvoice")) {
    localStorage.removeItem("editInvoiceId");
}


    try{

try {
    let res = await fetch("https://erp-system-303n.onrender.com/api/invoices/next-number");
    let data = await res.json();

    if(data && data.invoiceNo){
        document.querySelector('[name="invoiceNo"]').value = data.invoiceNo;
    }
} catch(err){
    console.error(err);
}

    }catch(err){
        console.error(err);
    }

    // ✅ load dropdowns
    await loadCustomerDropdown();
    await loadPOList();


// 🔥 INIT SELECT2 AFTER DATA LOAD


// 🔥 SINGLE EVENT BIND
$('#poSelect').off('change').on('change', loadPOItems);



    // Add first item row
    addItem();

    // Listeners
    document.getElementById('addItemBtn').addEventListener('click', addItem);
    document.getElementById('generateBtn').addEventListener('click', generateInvoice);
    itemsBody.addEventListener('input', calc);
    gstTypeSelect.addEventListener('change', calc);

    document.getElementById('itemsBody').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-danger')) {
            e.target.closest('tr').remove();
            renumberRows();
        }
    });


    // Check edit mode
    let editing = JSON.parse(localStorage.getItem("editInvoice"));

    

    const generateBtn = document.getElementById("generateBtn");

if(editing){
    generateBtn.textContent = "Save Invoice";
}else{
    generateBtn.textContent = "Generate Invoice";
}

    if(editing){


        localStorage.setItem("editInvoiceBackup","true");

        document.getElementById("pageTitle").innerText = "Edit Invoice";

        document.querySelector('[name="invoiceNo"]').value = editing.invoiceNo;
        document.querySelector('[name="date"]').value = editing.date;

        // 🔥 FIX CUSTOMER (name → id)
let cust = customersList.find(c => c.name === editing.customer);

if(cust){
    customerSelect.value = cust._id;
    loadCustomer();
}



// 🔥 FIX PO (poNo → poId)
if(editing.poNo){

    let options = document.querySelectorAll("#poSelect option");

    options.forEach(opt => {
        if(opt.dataset.pono === editing.poNo){
$('#poSelect').val(opt.value).trigger('change');

// 🔥 WAIT FOR PO LOAD THEN SET GST
setTimeout(() => {

    let gst = editing.gstType;

    // 🔥 mapping logic
    if (gst === "IGST") {
        gstTypeSelect.value = "18";
    } 
    else if (gst === "CGST+SGST" || gst === "CGST") {
        gstTypeSelect.value = "9";
    } 
    else if (gst === 18 || gst === "18") {
        gstTypeSelect.value = "18";
    } 
    else if (gst === 9 || gst === "9") {
        gstTypeSelect.value = "9";
    } 
    else {
        // fallback
        gstTypeSelect.value = "9";
    }

    gstTypeSelect.dispatchEvent(new Event('change'));

}, 300);

        }
    });

}



document.querySelector('[name="poDate"]').value =
    formatDateForInput(editing.poDate);


        itemsBody.innerHTML = "";

        editing.items.forEach(item => {

            addItem();

            let row = itemsBody.lastElementChild;

            row.querySelector('.inp-part').value = item.part;
            row.querySelector('.inp-no').value = item.no;
            row.querySelector('.inp-hsn').value = item.hsn;
            row.querySelector('.inp-qty').value = item.qty;
            row.querySelector('.inp-rate').value = item.rate;
            row.querySelector('.inp-total').value = item.total;

        });

        renumberRows();
        calc();


        localStorage.removeItem("editInvoice");

        let downloadMode = localStorage.getItem("downloadMode");

        if(downloadMode === "true"){

            localStorage.removeItem("downloadMode");

            setTimeout(() => {
                generateInvoice();
            }, 500);    

        }
    }

})();


// Load customer dropdown


async function loadCustomerDropdown(){

customersList = await getCustomers();

customerSelect.innerHTML = '<option value="">Select Customer...</option>';

customersList.forEach(c => {

const opt = document.createElement("option");

opt.value = c._id;   // 🔥 IMPORTANT CHANGE
opt.textContent = c.name;

customerSelect.appendChild(opt);

});

}


//====================
// Load PO List
//====================

async function loadPOList(){

let res = await fetch("https://erp-system-303n.onrender.com/api/purchase-orders");
let pos = await res.json();

const select = document.getElementById("poSelect");

select.innerHTML = '<option value="">Select Purchase Order...</option>';

pos.forEach(po => {

let option = document.createElement("option");

option.value = po._id;
option.textContent = po.poNo + " - " + po.customer;

option.dataset.pono = po.poNo;

select.appendChild(option);

});

}

function formatDateForInput(date){

if(!date) return "";

let d = new Date(date);

if(isNaN(d)) return "";

return d.toISOString().split("T")[0];

}

//====================
// Load PO Items
//====================
async function loadPOItems(){


    let id = $('#poSelect').val();




if(!id){
document.getElementById("poItemPanel").style.display="none";
return;
}

let res = await fetch(`https://erp-system-303n.onrender.com/api/purchase-orders/${id}`);
let po = await res.json();

// fill PO fields
document.querySelector('[name="poDate"]').value = formatDateForInput(po.poDate);

// set customer automatically
let cust = customersList.find(c => c.name === po.customer);

if(cust){
    document.getElementById("customerSelect").value = cust._id;
    loadCustomer();
}

document.getElementById("poItemPanel").style.display="block";

let tbody = document.querySelector("#poItemTable tbody");
tbody.innerHTML = "";

// load items
po.items.forEach(item => {

if(item.pendingQty <= 0) return;

let row = document.createElement("tr");

row.innerHTML = `
<td><input type="checkbox" class="po-check"></td>
<td>${item.part}</td>
<td>${item.partNo}</td>
<td>${item.hsn}</td>
<td>${item.orderedQty}</td>
<td>${item.pendingQty}</td>
<td>${item.rate}</td>
`;

tbody.appendChild(row);

});





}

// Add Selected Items Of PO
function addSelectedPOItems(){

// CLEAR EXISTING ROWS
itemsBody.innerHTML = "";

let rows = document.querySelectorAll("#poItemTable tbody tr");

rows.forEach(row=>{

let checked = row.querySelector(".po-check").checked;

if(!checked) return;

addItem();

let invoiceRow = itemsBody.lastElementChild;

invoiceRow.querySelector(".inp-part").value =
row.children[1].innerText;

invoiceRow.querySelector(".inp-no").value =
row.children[2].innerText;

invoiceRow.querySelector(".inp-hsn").value =
row.children[3].innerText;

invoiceRow.querySelector(".inp-qty").value =
row.children[5].innerText;

invoiceRow.querySelector(".inp-rate").value =
row.children[6].innerText;

});

renumberRows();
calc();

}


// Load selected customer details
function loadCustomer(){

const id = customerSelect.value;

const c = customersList.find(x => x._id === id);

if(c){

document.getElementById("address").value = c.address;
document.getElementById("gstin").value = c.gst;

// ✅ ADD THIS LINE
currentPaymentTerms = c.paymentTerms || 45;

}else{

document.getElementById("address").value = "";
document.getElementById("gstin").value = "";

// fallback
currentPaymentTerms = 45;

}

}



function addItem() {
    const row = document.createElement('tr');
    row.innerHTML = `
<td class="sl-no" style="text-align: center;"></td>
<td><input type="text" class="inp-part" placeholder="Part Name"></td>
<td><input type="text" class="inp-no" placeholder="No"></td>
<td><input type="text" class="inp-hsn" placeholder="HSN"></td>
<td><input type="number" class="inp-qty" placeholder="Qty" min="1"></td>
<td><input type="number" class="inp-rate" placeholder="Rate" min="0"></td>
<td><input type="text" class="inp-total" readonly style="background: #f8fafc; text-align: right;"></td>
<td><button type="button" class="btn btn-danger">X</button></td>
`;
    itemsBody.appendChild(row);
    renumberRows();
}

function renumberRows() {
    if (itemsBody.children.length === 0) {
        addItem();
    } else {
        // Renumber
        Array.from(itemsBody.children).forEach((r, i) => r.querySelector('.sl-no').textContent = i + 1);
        calc();
    }
};

function calc() {
    let sub = 0;
    Array.from(itemsBody.children).forEach(r => {
        const q = parseFloat(r.querySelector('.inp-qty').value) || 0;
        const rt = parseFloat(r.querySelector('.inp-rate').value) || 0;
        const t = parseFloat((q * rt).toFixed(2)); // Round item total to 2 decimals
        r.querySelector('.inp-total').value = t.toFixed(2);
        sub += t;
    });
    sub = parseFloat(sub.toFixed(2)); // Ensure subtotal is clean

    const gstRate = parseInt(gstTypeSelect.value);
    let tax = 0;
    let cgst = 0, sgst = 0;

    if (gstRate === 18) {
        // IGST
        tax = parseFloat((sub * 0.18).toFixed(2));
        document.getElementById('gstLabel').firstElementChild.textContent = "IGST (18%):";
    } else {
        // CGST + SGST (9% each)
        cgst = parseFloat((sub * 0.09).toFixed(2));
        sgst = parseFloat((sub * 0.09).toFixed(2));
        tax = parseFloat((cgst + sgst).toFixed(2));
        document.getElementById('gstLabel').firstElementChild.textContent = "CGST+SGST (18%):";
    }

    const total = parseFloat((sub + tax).toFixed(2));
    const grand = Math.round(total);
    const roundErr = parseFloat((grand - total).toFixed(2));

    document.getElementById('subTotal').textContent = sub.toFixed(2);
    document.getElementById('taxTotal').textContent = tax.toFixed(2);
    // Store split values for Excel generation if needed
    document.getElementById('taxTotal').dataset.cgst = cgst;
    document.getElementById('taxTotal').dataset.sgst = sgst;

    document.getElementById('rounding').textContent = roundErr.toFixed(2);
    document.getElementById('grandTotal').textContent = grand.toFixed(2);
    document.getElementById('amountWords').textContent = numberToWords(grand) + " Only";
}

// --- EXCEL GENERATION ---
async function generateInvoice() {
const invNo = document.querySelector('[name="invoiceNo"]').value;
const custId = customerSelect.value;
const selectedCustomer = customersList.find(c => c._id === custId);
const custNameText = selectedCustomer ? selectedCustomer.name : "";
const dateVal = document.querySelector('[name="date"]').value;

if (!custId || !dateVal) {
    alert("Fill all required fields");
    return;
}

// 🔥 Collect items
let items = [];

Array.from(itemsBody.children).forEach(row => {

    const part = row.querySelector('.inp-part').value.trim();
    const qty = row.querySelector('.inp-qty').value;

    if (!part || !qty || Number(qty) === 0) return;

    items.push({
        part,
        no: row.querySelector('.inp-no').value,
        hsn: row.querySelector('.inp-hsn').value,
        qty: Number(qty),
        rate: Number(row.querySelector('.inp-rate').value),
        total: Number(row.querySelector('.inp-total').value)
    });
});

let editId = localStorage.getItem("editInvoiceId");

let url = "https://erp-system-303n.onrender.com/api/invoices";
let method = "POST";

let poId = $('#poSelect').val();

let poNo = "";

if(poId){
    let option = document.querySelector(`#poSelect option[value="${poId}"]`);
    poNo = option ? option.dataset.pono : "";
}

if (editId) {
    url = `https://erp-system-303n.onrender.com/api/invoices/${editId}`;
    method = "PUT";
}

try {

    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            // ❌ REMOVE invoiceNo from frontend
            customerName: custNameText,
            amount: Number(document.getElementById("grandTotal").textContent),
            invoiceDate: dateVal,
            paymentTerms: currentPaymentTerms,
            poId,
            poNo,
            poDate: document.querySelector('[name="poDate"]').value,
            gstType: gstTypeSelect.value,
            items
        })
    });

    const result = await response.json();

    console.log("Invoice saved:", result);

    // 🔥 SHOW GENERATED NUMBER
    if(result.invoiceNo){
        alert("Invoice Created: " + result.invoiceNo);
    }

    localStorage.removeItem("editInvoiceId");

    window.location.href = "history.html";
    return;

} catch (err) {
    console.error(err);
    alert("Error saving invoice");
    return;
}

}

function numberToWords(n) {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if (n === 0) return 'zero';

    const num = n.toString();
    if (num.length > 9) return 'overflow';

    const n_array = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return;

    let str = '';
    str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'crore ' : '';
    str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'lakh ' : '';
    str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'thousand ' : '';
    str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'hundred ' : '';
    str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';

    return str.toUpperCase(); // Ensure Uppercase
}
