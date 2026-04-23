if(localStorage.getItem("adminLoggedIn") !== "true"){
window.location.href = "login.html";
}




const table = document.querySelector("#invoiceTable tbody");
const searchBox = document.getElementById("searchBox");

function loadInvoices(){

table.innerHTML = "";

fetch("https://erp-system-303n.onrender.com/api/invoices")
  .then(res => res.json())
  .then(invoices => {

    invoices.forEach(inv => {

      let row = document.createElement("tr");

      row.innerHTML = `
      <td>${inv.invoiceNo || "-"}</td>
      <td>${inv.customerName}</td>
      <td>${inv.invoiceDate}</td>
      <td>₹ ${Number(inv.amount).toLocaleString("en-IN")}</td>
      <td>
      <button onclick="editInvoice('${inv._id}')">Edit</button>
<button onclick="downloadInvoice('${inv._id}')">Download</button>
<button onclick="deleteInvoice('${inv._id}')">Delete</button>
      </td>
      `;

      table.appendChild(row);

    });

  })
  .catch(err => console.error(err));

}

loadInvoices();



// Edit Invoice
function editInvoice(id){

  fetch(`https://erp-system-303n.onrender.com/api/invoices/${id}`)
    .then(res => res.json())
    .then(data => {

      console.log("EDIT DATA:", data); // 👈 DEBUG

      const formatted = {
        invoiceNo: data.invoiceNo || "",
        customer: data.customerName || "",
        date: data.invoiceDate || "",
        poNo: data.poNo || "",
        poDate: data.poDate || "",
        items: data.items || [],   // 🔥 SAFE FIX
        total: data.amount || 0
      };

      localStorage.setItem("editInvoice", JSON.stringify(formatted));

      window.location.href = "create.html";

    })
    .catch(err => console.error(err));

}




// Delete Invoice
function deleteInvoice(id){

  if(!confirm("Are you sure you want to delete this invoice?")){
    return;
  }

  fetch(`https://erp-system-303n.onrender.com/api/invoices/${id}`, {
    method: "DELETE"
  })
  .then(res => res.json())
  .then(data => {
    console.log(data);
    loadInvoices(); // 🔥 refresh table
  })
  .catch(err => console.error(err));

}



// Download Invoice
async function downloadInvoice(id){

  try{

    // 🔥 FETCH FROM DB
    const res = await fetch(`https://erp-system-303n.onrender.com/api/invoices/${id}`);
    const inv = await res.json();

    if(!inv){
      alert("Invoice not found");
      return;
    }

    // 🔥 Decode template
    const binaryString = window.atob(ENCODED_TEMPLATE.replace(/\s/g,''));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for(let i=0;i<len;i++){
      bytes[i] = binaryString.charCodeAt(i);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer);

    const sheet = workbook.worksheets[0];

    // 🔥 Basic details
    sheet.getCell('B9').value += " " + inv.invoiceNo;

    let [y,m,d] = inv.invoiceDate.split("-");
    sheet.getCell('E9').value += " " + `${d}-${m}-${y}`;

    sheet.getCell('I11').value += " " + (inv.poNo || "");

 // 🔥 GET CUSTOMER DETAILS FROM localStorage
let customers = JSON.parse(localStorage.getItem("customers")) || [];

let customer = customers.find(c => c.name === inv.customerName);

// 🔥 Fill properly
if(customer){
  sheet.getCell('B11').value = customer.name + "\n" + customer.address;
  sheet.getCell('B15').value += "" + customer.gst || "";
  sheet.getCell('I15').value += "" + customer.vendorCode || "";
}else{
  sheet.getCell('B11').value = inv.customerName || "";
}




    if(inv.poDate){
      let [py,pm,pd] = inv.poDate.split("-");
      sheet.getCell('I12').value += " " + `${pd}-${pm}-${py}`;
    }

    // 🔥 ITEMS
    let r = 19;

    (inv.items || []).forEach(item => {

      sheet.getCell(`B${r}`).value = r-18;
      sheet.getCell(`C${r}`).value = item.no;
      sheet.getCell(`I${r}`).value = item.hsn;
      sheet.getCell(`J${r}`).value = item.qty + " nos";
      sheet.getCell(`K${r}`).value = Number(item.rate);
      sheet.getCell(`L${r}`).value = Number(item.total);

      sheet.getCell(`C${r+1}`).value = item.part;

      r += 3;

    });

    // 🔥 TOTAL

    let subTotal = 0;

(inv.items || []).forEach(item => {
  subTotal += Number(item.total || 0);
});

// GST
let gstType = Number(inv.gstType || 18);

let cgst = 0, sgst = 0, igst = 0;

if(gstType == 18){
  igst = subTotal * 0.18;
}else{
  cgst = subTotal * 0.09;
  sgst = subTotal * 0.09;
}

let tax = igst || (cgst + sgst);

let total = subTotal + tax;
let grand = Math.round(total);


sheet.getCell('D45').value = numberToWords(grand) + " ONLY";


let roundOff = grand - total;

// Subtotal
sheet.getCell('L40').value = subTotal;

// CGST / SGST / IGST
sheet.getCell('L41').value = cgst;
sheet.getCell('L42').value = sgst;
sheet.getCell('L43').value = igst;

// Total tax
sheet.getCell('L44').value = tax;

// Rounding
sheet.getCell('L45').value = roundOff;

// Grand total
sheet.getCell('L46').value = grand;



    // 🔥 CREATE FILE
    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer],{
      type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    let fileName = `${inv.invoiceNo}_${inv.customerName.replace(/\s+/g,'_')}.xlsx`;

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