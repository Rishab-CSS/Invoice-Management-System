if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}




const table = document.querySelector("#invoiceTable tbody");
const searchBox = document.getElementById("searchBox");

function loadInvoices(){

table.innerHTML = "";

let invoices = getInvoices();

invoices.forEach(inv => {

let row = document.createElement("tr");

row.innerHTML = `
<td>${inv.invoiceNo}</td>
<td>${inv.customer}</td>
<td>${inv.date}</td>
<td>₹ ${Number(inv.total).toLocaleString("en-IN")}</td>
<td>
<button onclick="editInvoice('${inv.invoiceNo}')">Edit</button>
<button onclick="downloadInvoice('${inv.invoiceNo}')">Download</button>
<button onclick="deleteInvoice('${inv.invoiceNo}')">Delete</button>
</td>
`;

table.appendChild(row);

});

}

loadInvoices();

// Edit Invoice
function editInvoice(no){

let invoices = getInvoices();

let inv = invoices.find(i => i.invoiceNo === no);

localStorage.setItem("editInvoice", JSON.stringify(inv));

window.location.href = "create.html";

}

// Delete Invoice
function deleteInvoice(no){

if(!confirm("Are you sure you want to delete this invoice?")){
return;
}

let invoices = getInvoices();

invoices = invoices.filter(inv => inv.invoiceNo !== no);

localStorage.setItem("invoices", JSON.stringify(invoices));

loadInvoices();

}

// Download Invoice
async function downloadInvoice(no){

let invoices = getInvoices();
let inv = invoices.find(i => i.invoiceNo === no);

if(!inv){
alert("Invoice not found");
return;
}

try{

// Decode template
const binaryString = window.atob(ENCODED_TEMPLATE.replace(/\s/g,''));
const len = binaryString.length;
const bytes = new Uint8Array(len);

for(let i=0;i<len;i++){
bytes[i] = binaryString.charCodeAt(i);
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(bytes.buffer);

const sheet = workbook.worksheets[0];

// Basic fields
sheet.getCell('B9').value += " " + inv.invoiceNo;

let [y,m,d] = inv.date.split("-");
sheet.getCell('E9').value += " " + `${d}-${m}-${y}`;

sheet.getCell('I11').value += " " + (inv.poNo || "");

if(inv.poDate){
let [py,pm,pd] = inv.poDate.split("-");
sheet.getCell('I12').value += " " + `${pd}-${pm}-${py}`;
}

// Items
let r = 19;

inv.items.forEach(item=>{

sheet.getCell(`B${r}`).value = r-18;
sheet.getCell(`C${r}`).value = item.no;
sheet.getCell(`I${r}`).value = item.hsn;
sheet.getCell(`J${r}`).value = item.qty + " nos";
sheet.getCell(`K${r}`).value = Number(item.rate);
sheet.getCell(`L${r}`).value = Number(item.total);

sheet.getCell(`C${r+1}`).value = item.part;

r += 3;

});

// totals
sheet.getCell('L46').value = Number(inv.total);

// create file
const buffer = await workbook.xlsx.writeBuffer();

const blob = new Blob([buffer],{
type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
});

let fileName = `${inv.invoiceNo}_${inv.customer.replace(/\s+/g,'_')}.xlsx`;

const url = window.URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = fileName;

document.body.appendChild(a);
a.click();

window.URL.revokeObjectURL(url);
document.body.removeChild(a);

}
catch(err){
console.error(err);
alert("Error generating invoice");
}

}

// Search
// Search
searchBox.addEventListener("input", function(){

let search = searchBox.value.toLowerCase();

let rows = table.querySelectorAll("tr");

const months = {
january:"01", jan:"01",
february:"02", feb:"02",
march:"03", mar:"03",
april:"04", apr:"04",
may:"05",
june:"06", jun:"06",
july:"07", jul:"07",
august:"08", aug:"08",
september:"09", sep:"09", sept:"09",
october:"10", oct:"10",
november:"11", nov:"11",
december:"12", dec:"12"
};

rows.forEach(row => {

let text = row.textContent.toLowerCase();
let dateText = row.children[2].innerText; // invoice date

let month = dateText.split("-")[1]; // extract month

let show = text.includes(search);

// month search
if(months[search]){
show = month === months[search];
}

row.style.display = show ? "" : "none";

});

});