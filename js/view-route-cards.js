// =========================
// AUTH CHECK
// =========================
const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

const tableBody = document.querySelector("#rcTable tbody");

const API = "http://localhost:3000/api/route-cards";

let routeCards = []; // now from MongoDB

// =======================
// LOAD FROM MONGODB
// =======================
async function loadRouteCards(){

    const res = await fetch(API);
    routeCards = await res.json();

    tableBody.innerHTML = "";

    if(routeCards.length === 0){
        tableBody.innerHTML = `
        <tr>
        <td colspan="6" style="text-align:center;">No Route Cards Created</td>
        </tr>
        `;
        return;
    }

    routeCards.forEach((rc,index)=>{

        let row = document.createElement("tr");

        row.innerHTML = `
        <td>${rc.rcNo}</td>
        <td>${rc.invoiceNo || "-"}</td>   <!-- ✅ ADD THIS -->
        <td>${rc.customer}</td>
        <td>${rc.product}</td>
        <td>${rc.qty}</td>

        <td class="rc-actions">

        <button class="btn" onclick="viewRC('${rc._id}')">View</button>

        <button class="btn" onclick="downloadRC(${index})">Download</button>

        <button class="btn btn-danger" onclick="deleteRC('${rc._id}')">Delete</button>

        </td>
        `;

        tableBody.appendChild(row);

    });

}

loadRouteCards();


// =======================
// VIEW (EDIT MODE)
// =======================
window.viewRC = async function(id){

    const res = await fetch(`${API}/${id}`);
    const rc = await res.json();

    localStorage.setItem("editRouteCard", JSON.stringify(rc));

    window.location.href = "create-route-card.html";
};


// =======================
// DELETE
// =======================
window.deleteRC = async function(id){

    if(!confirm("Delete this Route Card?")) return;

    await fetch(`${API}/${id}`,{
        method:"DELETE"
    });

    loadRouteCards();
};


// =======================
// DOWNLOAD (UNCHANGED)
// =======================
window.downloadRC = async function(index){

let rc = routeCards[index];

if(!rc){
alert("Route Card not found");
return;
}

const binaryString = window.atob(routeCardTemplate.replace(/\s/g,''));

const len = binaryString.length;
const bytes = new Uint8Array(len);

for(let i=0;i<len;i++){
bytes[i] = binaryString.charCodeAt(i);
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(bytes.buffer);

const sheet = workbook.worksheets[0];

function val(cellAddress, value){

const cell = sheet.getCell(cellAddress);

let existing = "";

if(cell.value){
existing = cell.value.toString();
}

cell.value = existing + " " + value;
}

/* HEADER */

val("B4", rc.customer);
val("B5", rc.qty);
val("B6", rc.partNumber || "");
val("B7", rc.product);
val("H5", rc.poNo);
val("H4", rc.rcNo);

/* PROCESS TABLE */

let startRow = 9;

rc.processes.forEach((p,i)=>{

let r = startRow + i;

sheet.getCell(`A${r}`).value = i+1;
sheet.getCell(`B${r}`).value = p.process;
sheet.getCell(`C${r}`).value = p.machine;
sheet.getCell(`D${r}`).value = p.startDate;
sheet.getCell(`E${r}`).value = p.endDate;
sheet.getCell(`F${r}`).value = p.producedQty;
sheet.getCell(`G${r}`).value = p.acceptedQty;
sheet.getCell(`H${r}`).value = p.reworkQty;
sheet.getCell(`I${r}`).value = p.rejectedQty;
sheet.getCell(`J${r}`).value = p.operator;

});

const buffer = await workbook.xlsx.writeBuffer();

const blob = new Blob([buffer],{
type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
});

const link = document.createElement("a");

link.href = URL.createObjectURL(blob);
link.download = rc.rcNo + ".xlsx";
link.click();

};