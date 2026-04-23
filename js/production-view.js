// =========================
// AUTH CHECK
// =========================
const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

const API_URL = "http://localhost:3000/api/production";


window.addEventListener("focus", loadProductions);

function getProductionViewStatus(prod) {
  if (!prod.processes || prod.processes.length === 0) {
    return "Not Started";
  }

  const processes = prod.processes;
  let lastCompletedProcess = null;

  for (let i = 0; i < processes.length; i++) {
    const proc = processes[i];

    if (proc.startDate && !proc.endDate) {
      return `${proc.processName} Started`;
    }

    if (!proc.startDate) {
      if (i === 0) {
        return "Not Started";
      }
      const prev = processes[i - 1];
      if (prev.endDate) {
        return `${prev.processName} Ended`;
      }
      if (prev.startDate && !prev.endDate) {
        return `${prev.processName} Started`;
      }
      return "Not Started";
    }

    if (proc.startDate && proc.endDate) {
      lastCompletedProcess = proc;
    }
  }

  const lastProcess = processes[processes.length - 1];
  if (lastProcess.processName === "Inspection & Dispatch" && lastProcess.endDate) {
    return "Completed";
  }

  if (lastCompletedProcess) {
    return `${lastCompletedProcess.processName} Ended`;
  }

  return "Not Started";
}

// =========================
// LOAD ALL PRODUCTS
// =========================
async function loadProductions() {

  const res = await fetch(API_URL);
  const data = await res.json();


  const rcRes = await fetch("http://localhost:3000/api/route-cards");
  const routeCards = await rcRes.json();

  const table = document.getElementById("productionList");
  table.innerHTML = "";

data.forEach(prod => {
  const statusText = getProductionViewStatus(prod);
  const existingRC = routeCards.find(rc => rc.product === prod.productName);

  table.innerHTML += `
    <tr>
      <td>${prod.productName}</td>
      <td>${prod.totalQty}</td>
      <td>${statusText}</td>
      <td>
        <button onclick="openProduction('${prod._id}')">Open</button>
${
  existingRC
    ? `<button class="btn btn-green" disabled>
          Route Card Created: ${existingRC.rcNo}
       </button>`
    : `<button 
          ${statusText !== "Completed" ? "class=\"paid-button\" disabled" : ""}
          onclick="createRouteCard('${prod._id}', '${prod.productName}', '${prod.totalQty}')"
       >
          Create Route Card
       </button>`
}
        <button onclick="deleteProduction('${prod._id}')">Delete</button>
      </td>
    </tr>
  `;
});
}


loadProductions();

// =========================
// OPEN PRODUCTION
// =========================
function openProduction(id) {
  console.log("Opening ID:", id);

  window.location.href = `production-tracking.html?id=${id}`;
}


async function deleteProduction(id) {

  if (!confirm("Delete this production?")) return;

  await fetch(API_URL + "/" + id, {
    method: "DELETE"
  });

  alert("Deleted!");

  loadProductions(); // refresh table
}



let currentRCData = null;

async function createRouteCard(prodId, productName, qty) {

  currentRCData = {
    prodId,
    productName,
    qty
  };

  document.getElementById("rcModal").style.display = "flex";

  await loadCustomers();
  await loadPOs();
}


async function loadCustomers(){
  const res = await fetch("http://localhost:3000/api/customers");
  const data = await res.json();

  const select = document.getElementById("rcCustomer");
  select.innerHTML = "<option value=''>Select Customer</option>";

  data.forEach(c=>{
    select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
  });

  // ✅ Initialize Select2
  $('#rcCustomer').select2({
    placeholder: "Select Customer",
    width: '100%',
    dropdownParent: $('#rcModal')
  });
}

async function loadPOs(){
  const res = await fetch("http://localhost:3000/api/purchase-orders");
  const data = await res.json();

  const list = document.getElementById("poList");
  list.innerHTML = "";

  data.forEach(po=>{
    list.innerHTML += `<option value="${po.poNo}">`;
  });
}



document.getElementById("rcPoNo").addEventListener("input", async function(){

  const poNo = this.value;

  if(!poNo) return;

  // fetch all POs
  const res = await fetch("http://localhost:3000/api/purchase-orders");
  const data = await res.json();

  // find selected PO
  const po = data.find(p => p.poNo === poNo);

  if(po){
    $('#rcCustomer').val(po.customer).trigger('change');
  }

});


document.getElementById("rcInvoiceNo").addEventListener("input", fetchInvoiceDetails);

async function fetchInvoiceDetails() {

  const invoiceNo = document.getElementById("rcInvoiceNo").value;

  if(!invoiceNo) return;

  try {

    const res = await fetch(`http://localhost:3000/api/invoices`);
    const invoices = await res.json();

    const invoice = invoices.find(inv => inv.invoiceNo === invoiceNo);

    if(!invoice){
      console.log("Invoice not found");
      return;
    }

    // ✅ Fill Customer
$('#rcCustomer').val(invoice.customerName || invoice.customer).trigger('change');


    // ✅ Fill PO
    document.getElementById("rcPoNo").value = invoice.poNo;

    // ✅ Handle Part Numbers
    handleInvoiceParts(invoice.items);

  } catch(err){
    console.error(err);
  }
}


function handleInvoiceParts(items){

  const partField = document.getElementById("rcPartNo");
  partField.innerHTML = "";

  if(!items || items.length === 0) return;

  if(items.length === 1){

    const display = `${items[0].part} (${items[0].no})`;
    const value = items[0].no;

    partField.innerHTML = `<option value="${value}">${display}</option>`;
    partField.value = value;

  } 
  else {

    partField.innerHTML = `<option value="">Select Part</option>`;

    items.forEach(item => {

      const display = `${item.part} (${item.no})`;
      const value = item.no;

      partField.innerHTML += `
        <option value="${value}">${display}</option>
      `;
    });
  }
}




async function submitRC(){

  const customer = document.getElementById("rcCustomer").value;
  const poNo = document.getElementById("rcPoNo").value;
  const partNumber = document.getElementById("rcPartNo").value;
  const invoiceNo = document.getElementById("rcInvoiceNo").value;



  if(!customer || !poNo || !partNumber){
    alert("Fill all fields");
    return;
  }

  try {

    // =========================
    // GET PRODUCT
    // =========================
    const prodRes = await fetch("http://localhost:3000/api/products");
    const products = await prodRes.json();

    const product = products.find(p => p.name === currentRCData.productName);

    if(!product){
      alert("Product not found");
      return;
    }

    // =========================
    // ✅ GET FULL PRODUCTION DATA (IMPORTANT FIX)
    // =========================
    const productionRes = await fetch(`http://localhost:3000/api/production/${currentRCData.prodId}`);
    const productionData = await productionRes.json();

    // =========================
    // MAP PROCESSES (FULL DATA)
    // =========================
    const processes = productionData.processes.map(p => ({
      process: p.processName,
      machine: p.machineOrVendor || "",
      startDate: p.startDate || "",
      endDate: p.endDate || "",
      producedQty: p.producedQty || 0,
      acceptedQty: p.acceptedQty || 0,
      reworkQty: 0,
      rejectedQty: p.rejectedQty || 0,
      operator: p.operator || ""
    }));

    // =========================
    // GENERATE RC NO
    // =========================
    const rcRes = await fetch("http://localhost:3000/api/route-cards");
    const rcData = await rcRes.json();

    let max = 0;
    rcData.forEach(rc => {
      let num = parseInt(rc.rcNo?.split("/")[2]);
      if(num > max) max = num;
    });

    const rcNo = "RPIC/RC/" + String(max+1).padStart(2,"0");

    // =========================
    // CREATE ROUTE CARD
    // =========================
    await fetch("http://localhost:3000/api/route-cards/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rcNo,
        customer,
        product: currentRCData.productName,
        productId: product._id,
        partNumber,
        qty: currentRCData.qty,
        poNo,
        invoiceNo,
        processes
      })
    });

alert("Route Card Created!");

closeRCModal();      // close popup
loadProductions();   // refresh table

  } catch (err) {
    console.error(err);
    alert("Error creating route card");
  }


  console.log("SENDING DATA:", {
  customer,
  poNo,
  partNumber,
  invoiceNo
});

}



function closeRCModal(){
  document.getElementById("rcModal").style.display = "none";
}