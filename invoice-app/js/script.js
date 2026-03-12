if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}

// Load customers from storage
function getCustomers(){
return JSON.parse(localStorage.getItem("customers")) || [];
}

// --- Init ---
const itemsBody = document.getElementById('itemsBody');
const customerSelect = document.getElementById('customerSelect');
const gstTypeSelect = document.getElementById('gstType');

let currentExcelBlob = null;
let currentFileName = '';

(function init() {

    // Auto Invoice Number
    document.querySelector('[name="invoiceNo"]').value = getNextInvoiceNumber();

    // Load customers into dropdown
    loadCustomerDropdown();

    // Load PO List
    loadPOList();

    // Activate Select 2 for searchable dropdown
$('#poSelect').select2({
placeholder: "Search or Select Purchase Order",
width: '100%'
});

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

    $('#poSelect').on('change', loadPOItems);

    // Check edit mode
    let editing = JSON.parse(localStorage.getItem("editInvoice"));

    if(editing){

        localStorage.setItem("editInvoiceBackup","true");

        document.getElementById("pageTitle").innerText = "Edit Invoice";

        document.querySelector('[name="invoiceNo"]').value = editing.invoiceNo;
        document.querySelector('[name="date"]').value = editing.date;

        customerSelect.value = editing.customer;
        loadCustomer();

        $('#poSelect').val(editing.poNo).trigger('change');
document.querySelector('[name="poDate"]').value = editing.poDate || "";

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
function loadCustomerDropdown(){

let customers = getCustomers();

customerSelect.innerHTML = '<option value="">Select Customer...</option>';

customers.forEach(c => {

const opt = document.createElement("option");

opt.value = c.name;
opt.textContent = c.name;

customerSelect.appendChild(opt);

});

}

// Load PO List
function loadPOList(){

let pos = JSON.parse(localStorage.getItem("purchaseOrders")) || [];

const select = document.getElementById("poSelect");

pos.forEach(po => {

let option = document.createElement("option");

option.value = po.poNo;
option.textContent = po.poNo + " - " + po.customer;

select.appendChild(option);

});

}



// Load PO Items
function loadPOItems(){

let poNo = $('#poSelect').val();

let pos = JSON.parse(localStorage.getItem("purchaseOrders")) || [];

let po = pos.find(p => p.poNo === poNo);

if(!po){
document.getElementById("poItemPanel").style.display="none";
return;
}

// fill PO fields
document.querySelector('[name="poDate"]').value = po.poDate;

// set customer automatically
document.getElementById("customerSelect").value = po.customer;
loadCustomer();

// show item panel
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

let customers = getCustomers();

const cName = customerSelect.value;

const c = customers.find(x => x.name === cName);

if(c){

document.getElementById("address").value = c.address;
document.getElementById("gstin").value = c.gst;

}else{

document.getElementById("address").value = "";
document.getElementById("gstin").value = "";

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
    if (typeof ENCODED_TEMPLATE === 'undefined') {
        alert("Error: Template not loaded properly.");
        return;
    }

    const invNo = document.querySelector('[name="invoiceNo"]').value;
    const custName = customerSelect.value;
    // Collect items
let items = [];

Array.from(itemsBody.children).forEach(row => {

items.push({
part: row.querySelector('.inp-part').value,
no: row.querySelector('.inp-no').value,
hsn: row.querySelector('.inp-hsn').value,
qty: row.querySelector('.inp-qty').value,
rate: row.querySelector('.inp-rate').value,
total: row.querySelector('.inp-total').value
});

});


const invoiceData = {
invoiceNo: invNo,
customer: custName,
date: document.querySelector('[name="date"]').value,
poNo: $('#poSelect').val(),
poDate: document.querySelector('[name="poDate"]').value,
items: items,
total: Number(document.getElementById("grandTotal").textContent)    ,  
status: "Pending"
};



let isEditing = JSON.parse(localStorage.getItem("editInvoiceBackup"));


// UPDATE PO PENDING QTY
let poNo = $('#poSelect').val();

let pos = JSON.parse(localStorage.getItem("purchaseOrders")) || [];

let po = pos.find(p => p.poNo === poNo);

if(po && !isEditing){

items.forEach(invItem => {

let poItem = po.items.find(i => i.partNo === invItem.no);

if(poItem){
poItem.pendingQty -= Number(invItem.qty);
}

});

localStorage.setItem("purchaseOrders", JSON.stringify(pos));

}


// CHECK IF EDIT MODE
let invoices = getInvoices();

let index = invoices.findIndex(i => i.invoiceNo === invNo);

if(index !== -1){
invoices[index] = invoiceData;
localStorage.setItem("invoices", JSON.stringify(invoices));
}
else{
saveInvoice(invoiceData);
}


   if (!invNo || !custName || !document.querySelector('[name="date"]').value) {
alert("Please fill Invoice Number, Date and Customer.");
return;
}

    const selectedCustomer = getCustomers().find(c => c.name === custName);

    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';

    try {
        // 1. Decode Base64 to ArrayBuffer
        const binaryString = window.atob(ENCODED_TEMPLATE.replace(/\s/g, ''));
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. Load Workbook
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(bytes.buffer);
        const sheet = workbook.worksheets[0];

        // 3. Map Data
        const val = (cellAddress, v, append = false, bufferChar = ' ') => {
            const c = sheet.getCell(cellAddress);
            // Force Uppercase for all string inputs
            let finalVal = v;
            if (typeof v === 'string') {
                finalVal = v.toUpperCase();
            }

            if (append && c.value) {
                let existing = '';
                if (typeof c.value === 'object' && c.value.richText) {
                    existing = c.value.richText.map(r => r.text).join('');
                } else {
                    existing = c.value.toString();
                }
                c.value = existing + bufferChar + finalVal;
            } else {
                c.value = finalVal;
            }
        };

        // Headers - Append to preserve labels
        val('B9', invNo, true);

        const formatDate = (dStr) => {
            if (!dStr) return "";
            const [y, m, d] = dStr.split('-');
            return `${d}-${m}-${y}`;
        };

        val('E9', formatDate(document.querySelector('[name="date"]').value), true);

        // Address: Name \n Address
        const fullAddress = document.getElementById('address').value;
        const addrCell = sheet.getCell('B11');
        val('B11', fullAddress, true, '\n');
        addrCell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

        val('B15', document.getElementById('gstin').value, true);

        // Vendor Code Logic (I15)
        if (selectedCustomer && selectedCustomer.vendorCode) {
            val('I15', " " + selectedCustomer.vendorCode, true);
        }

        val('I11', $('#poSelect').val(), true);
        val('I12', formatDate(document.querySelector('[name="poDate"]').value), true);

        // Items (Row 19)
        let r = 19;
        Array.from(itemsBody.children).forEach(row => {
            // FIX: Skip hidden rows 29-30 (Template Issue)
            // If we land on Row 28, jump to 31 to avoid the hidden section
            if (r === 28) {
                r = 31;
            }

            const sl = parseInt(row.querySelector('.sl-no').textContent);
            const name = row.querySelector('.inp-part').value;
            const no = row.querySelector('.inp-no').value;
            const hsn = row.querySelector('.inp-hsn').value;
            let qty = row.querySelector('.inp-qty').value; // Keep as string to append " nos"
            const rate = parseFloat(row.querySelector('.inp-rate').value);
            const tot = parseFloat(row.querySelector('.inp-total').value);

            val(`B${r}`, sl);
            val(`C${r}`, no);
            val(`I${r}`, hsn);

            // Append " nos" if qty exists
            if (qty) {
                val(`J${r}`, qty + " nos");
            } else {
                val(`J${r}`, "");
            }

            val(`K${r}`, rate);
            val(`L${r}`, tot);
            val(`C${r + 1}`, name); // Name on next row

            r += 3; // Gap of 1 line between items (Row N, N+1(Name), N+2(Gap))
        });

        // Footer
        const sub = parseFloat(document.getElementById('subTotal').textContent);
        const grand = parseFloat(document.getElementById('grandTotal').textContent);
        const taxTotalElem = document.getElementById('taxTotal');
        const tax = parseFloat(taxTotalElem.textContent);
        const cgst = parseFloat(taxTotalElem.dataset.cgst || 0);
        const sgst = parseFloat(taxTotalElem.dataset.sgst || 0);
        const gType = parseInt(gstTypeSelect.value);

        val('L40', sub);
        if (gType === 18) {
            val('L43', tax); // IGST
            val('L41', 0); val('L42', 0);
        } else {
            val('L41', cgst); // CGST
            val('L42', sgst); // SGST
            val('L43', 0);
        }
        val('L44', tax);
        val('L45', parseFloat(document.getElementById('rounding').textContent));
        val('L46', grand);
        val('D45', document.getElementById('amountWords').textContent);

        // 4. Create Blob and Auto-Download
        const buffer = await workbook.xlsx.writeBuffer();
        currentExcelBlob = new Blob([buffer], {
            type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        currentFileName = `${invNo}_${custName.replace(/\s+/g, '_')}.xlsx`;

        // Auto Trigger Download
        downloadExcel();

    } catch (err) {
        console.error(err);
        alert("Error creating file: " + err.message);
    } finally {
        overlay.style.display = 'none';
    }

    localStorage.removeItem("editInvoiceBackup");
    localStorage.removeItem("editInvoice");
}

function downloadExcel() {
    if (!currentExcelBlob) return;
    const url = window.URL.createObjectURL(currentExcelBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Helper: Number to Words (Indian Format approximation)
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



