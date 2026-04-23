const role = localStorage.getItem("role");

if(!role){
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
        total: data.amount || 0,
        gstType: data.gstType
      };

      localStorage.setItem("editInvoice", JSON.stringify(formatted));

      localStorage.setItem("editInvoiceId", id);

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

    const res = await fetch(`https://erp-system-303n.onrender.com/api/invoices/${id}`);
    const inv = await res.json();

    if(!inv){
      alert("Invoice not found");
      return;
    }

  let customer = null;

try {
    const resCust = await fetch("https://erp-system-303n.onrender.com/api/customers");
    const allCustomers = await resCust.json();

    customer = allCustomers.find(c => c.name === inv.customerName);
} catch (err) {
    console.error("Customer fetch failed", err);
}


    // Decode template
    const binaryString = window.atob(ENCODED_TEMPLATE.replace(/\s/g,''));
    const bytes = new Uint8Array(binaryString.length);

    for(let i=0;i<binaryString.length;i++){
      bytes[i] = binaryString.charCodeAt(i);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer);

    const sheet = workbook.worksheets[0];

    // 🔥 FIXED val function (same as create page)
    const val = (cell, value, append = false) => {
      const c = sheet.getCell(cell);

      let newVal = (typeof value === 'string') ? value.toUpperCase() : value;

      if(append){
        let existing = "";

        if(c.value){
          if(typeof c.value === 'object' && c.value.richText){
            existing = c.value.richText.map(r => r.text).join('');
          }else{
            existing = c.value.toString();
          }
        }

        c.value = existing + newVal;
      }else{
        c.value = newVal;
      }
    };

    // =========================
    // HEADER
    // =========================

    val('B9', " " + inv.invoiceNo, true);

    let [y,m,d] = inv.invoiceDate.split("-");
    val('E9', " " + `${d}-${m}-${y}`, true);

    val('I11', " " + (inv.poNo || ""), true);

    if(inv.poDate){
      let [py,pm,pd] = inv.poDate.split("-");
      val('I12', " " + `${pd}-${pm}-${py}`, true);
    }

    // =========================
    // 🔥 CUSTOMER FIX (IMPORTANT)
    // =========================

    if(customer){

      // Address (append below name)
      if(customer.address){
        val('B11',customer.address, true);
      }

      // GST
      if(customer.gst){
        val('B15', " " + customer.gst, true);
      }

      // Vendor Code
      if(customer.vendorCode){
        val('I15', " " + customer.vendorCode, true);
      }

    }else{
      // fallback
      val('B11',inv.customerName, true);
    }

    // =========================
    // ITEMS
    // =========================

    let r = 19;

    (inv.items || []).forEach((item, index) => {

      if(r === 28) r = 31;

      val(`B${r}`, index + 1);
      val(`C${r}`, item.no);
      val(`I${r}`, item.hsn);
      val(`J${r}`, item.qty + " nos");
      val(`K${r}`, Number(item.rate));
      val(`L${r}`, Number(item.total));

      val(`C${r+1}`, item.part);

      r += 3;
    });

    // =========================
    // TOTALS
    // =========================

    let subTotal = 0;

    (inv.items || []).forEach(item => {
      subTotal += Number(item.total || 0);
    });

    let gstType = Number(inv.gstType || 18);

    let cgst = 0, sgst = 0, igst = 0;

    if(gstType === 18){
      igst = subTotal * 0.18;
    }else{
      cgst = subTotal * 0.09;
      sgst = subTotal * 0.09;
    }

    let tax = igst || (cgst + sgst);
    let total = subTotal + tax;
    let grand = Math.round(total);
    let roundOff = grand - total;

    val('L40', subTotal);
    val('L41', cgst);
    val('L42', sgst);
    val('L43', igst);
    val('L44', tax);
    val('L45', roundOff);
    val('L46', grand);

    val('D45', numberToWords(grand) + " ONLY");

    // =========================
    // DOWNLOAD
    // =========================

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


function numberToWords(n) {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ',
        'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ',
        'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];

    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty',
        'sixty', 'seventy', 'eighty', 'ninety'];

    if (n === 0) return 'ZERO';

    const num = n.toString();

    const n_array = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);

    let str = '';

    str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'CRORE ' : '';
    str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'LAKH ' : '';
    str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'THOUSAND ' : '';
    str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'HUNDRED ' : '';
    str += (n_array[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';

    return str.trim();
}