const role = localStorage.getItem("role");
let editingPaymentId = null;
let currentFilter = "All";
let currentManualGroup = null;
let currentManualDescription = "";

if(!role){
  window.location.href = "login.html";
}

let invoices = [];

async function loadInvoicesFromDB() {
  const res = await fetch("https://erp-system-303n.onrender.com/api/purchase-invoices");
  invoices = await res.json();

  renderInvoices(); // call render
}

const tbody = document.getElementById("paymentBody");

let selectedIndex = null;

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

async function renderInvoices() {

  // 🔥 Fetch payments
  const payRes = await fetch("https://erp-system-303n.onrender.com/api/payments");
  const payments = await payRes.json();

  tbody.innerHTML = "";

  let totalPending = 0;
  let totalPaid = 0;

  // ================= INVOICE ROWS =================
  invoices.forEach((inv, index) => {

    let relatedPayments = payments.filter(p => p.invoiceNo === inv.invoiceNo);

    let paid = relatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let total = Number(inv.grandTotal || 0);
    let remaining = total - paid;

    let status = remaining > 0 ? "Pending" : "Paid";

if (currentFilter === "Pending" && status !== "Pending") return;
if (currentFilter === "Paid" && status !== "Paid") return;

    totalPaid += paid;

    if (remaining > 0) totalPending += remaining;

    let row = `
      <tr>
        <td>${inv.invoiceNo}</td>
        <td>${inv.vendorName}</td>
        <td>${formatDate(inv.invoiceDate)}</td>
        <td>₹${formatCurrency(total)}</td>
        <td>₹${formatCurrency(paid)}</td>
<td>${remaining === 0 ? "—" : `₹${formatCurrency(remaining)}`}</td>
<td>
          ${remaining > 0 
            ? `<button onclick="openPanel(${index})">Pay</button>` 
            : `<button disabled class="paid-button">Paid</button>`}

          <button onclick="viewPayments('${inv.invoiceNo}')">View</button>
          <button onclick="deleteInvoice('${inv._id}','${inv.invoiceNo}')">Delete</button>        </td>
      </tr>
    `;

    tbody.innerHTML += row;
  });

  // ================= MANUAL PAYMENTS =================
let manualPayments = payments.filter(p => p.isManual);

let groupedManual = {};

// group by description (or id logic)
manualPayments.forEach(p => {

let key = p.manualGroupId || p._id;

if(!groupedManual[key]){
  groupedManual[key] = {
    total: 0,
    paid: 0,
    payments: [],
    description: p.description
  };
}

// ✅ always safely set total
let totalVal = Number(p.totalAmount || 0);
if(totalVal > groupedManual[key].total){
  groupedManual[key].total = totalVal;
}

groupedManual[key].paid += Number(p.amount || 0);
groupedManual[key].payments.push(p);

});

// render grouped
Object.keys(groupedManual).forEach(key => {

  let data = groupedManual[key];

  let remaining = data.total - data.paid;


  let status = remaining > 0 ? "Pending" : "Paid";

if (currentFilter === "Pending" && status !== "Pending") return;
if (currentFilter === "Paid" && status !== "Paid") return;

  totalPaid += data.paid;

  if (remaining > 0) totalPending += remaining;

  let row = `
    <tr>
      <td>Manual</td>
<td>${data.payments[0].description}</td>
      <td>${formatDate(data.payments[0].createdAt)}</td>
      <td>₹${formatCurrency(data.total)}</td>
      <td>₹${formatCurrency(data.paid)}</td>
      <td>${remaining === 0 ? "—" : `₹${formatCurrency(remaining)}`}</td>
<td>
  ${remaining > 0 
    ? `<button onclick="openManualPay('${key}')">Pay</button>` 
    : `<button disabled class="paid-button">Paid</button>`}

  <button onclick="viewPayments('${key}')">View</button>
  <button onclick="deleteManualGroup('${key}')">Delete</button>
</td>
    </tr>
  `;

  tbody.innerHTML += row;
});


  // ================= KPI UPDATE =================
  document.getElementById("totalPending").innerText = `₹${formatCurrency(totalPending)}`;
  document.getElementById("totalPaid").innerText = `₹${formatCurrency(totalPaid)}`;
}

async function loadPayments() {
  const res = await fetch("https://erp-system-303n.onrender.com/api/payments");
  const data = await res.json();

  tbody.innerHTML = "";

  data.forEach((pay) => {
    let row = `
      <tr>
<td>${pay.invoiceNo || "Manual"}</td>
<td>${pay.description || pay.partyName}</td>
        <td>${formatDate(pay.paymentDate)}</td>
        <td>₹${formatCurrency(pay.amount)}</td>
        <td>${pay.method || "-"}</td>
        <td>${pay.status}</td>
        <td>
          <button onclick="deletePayment('${pay._id}')">Delete</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}



function openPanel(index){

  selectedIndex = index;

  clearPanel();

  // ❌ hide manual fields
  document.getElementById("manualFields").style.display = "none";

  // ✅ show payment fields
  document.getElementById("paymentFields").style.display = "block";

  document.getElementById("paymentPanel").style.display="block";
}


function closePanel(){

document.getElementById("paymentPanel").style.display="none";

}

async function confirmPayment() {

  let amount = Number(document.getElementById("payAmount").value);
  let mode = document.getElementById("payMode").value;
  let date = document.getElementById("payDate").value;
  let description = document.getElementById("payDescription").value;
  let totalManual = Number(document.getElementById("manualTotal").value || 0);

  if (currentManualGroup && !description) {
    description = currentManualDescription || "";
  }

  // ✅ Only require date when doing payment
  if ((selectedIndex !== null || currentManualGroup) && !date) {
  alert("Enter date");
  return;
}

  try {

    // ================= UPDATE PAYMENT =================
    if (editingPaymentId) {

      await fetch(`https://erp-system-303n.onrender.com/api/payments/${editingPaymentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amount,
          paymentDate: date,
          method: mode
        })
      });

      editingPaymentId = null;
    }

    // ================= CREATE =================
    else {

      let newPayment;

      // ================= INVOICE PAYMENT =================
      if (selectedIndex !== null) {

        let invoice = invoices[selectedIndex];

        if (!amount) {
          alert("Enter payment amount");
          return;
        }

        newPayment = {
          type: "outgoing",
          partyName: invoice.vendorName,
          invoiceNo: invoice.invoiceNo,
          amount: amount,
          paymentDate: date,
          method: mode,
          status: "paid",
          isManual: false
        };

      }

      // ================= MANUAL =================
      else {

        // 🔥 Paying existing manual
        if (currentManualGroup) {

          if (!amount) {
            alert("Enter payment amount");
            return;
          }

          newPayment = {
            type: "outgoing",
            partyName: description || "Manual Entry",
            description: description,
            isManual: true,
            manualGroupId: currentManualGroup,
            amount: amount,
            paymentDate: date,
            method: mode,
            status: "paid"
          };

          currentManualGroup = null;
        }

        // 🔥 Creating new manual entry
        else {

          if (!totalManual) {
            alert("Enter total amount");
            return;
          }

          let manualGroupId = "M-" + Date.now();

          newPayment = {
            type: "outgoing",
            partyName: description || "Manual Entry",
            description: description,
            isManual: true,
            manualGroupId: manualGroupId,
            totalAmount: totalManual,

            amount: 0,            // ❗ nothing paid yet
            paymentDate: new Date(),
            method: "-",
            status: "pending"
          };
        }
      }

      await fetch("https://erp-system-303n.onrender.com/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPayment)
      });
    }

    // ================= AFTER SAVE =================
    closePanel();
    clearPanel();

    selectedIndex = null;

    loadInvoicesFromDB();

  } catch (err) {
    console.error(err);
    alert("Error saving payment");
  }
}

function formatDate(dateString){

let d = new Date(dateString);

let day = String(d.getDate()).padStart(2,'0');
let month = String(d.getMonth()+1).padStart(2,'0');
let year = d.getFullYear();

return `${day}-${month}-${year}`;

}

loadInvoicesFromDB();


// Search

document.getElementById("searchInput").addEventListener("input", function(){

let search = this.value.toLowerCase();

let rows = document.querySelectorAll("#paymentBody tr");

rows.forEach(row => {

let text = row.innerText.toLowerCase();

row.style.display = text.includes(search) ? "" : "none";

});

});




// Filters

function filterInvoices(type){
  currentFilter = type;
  renderInvoices();
}



function clearPanel(){

  document.getElementById("payAmount").value="";
  document.getElementById("payDate").value="";
  document.getElementById("payMode").selectedIndex=0;
  document.getElementById("payDescription").value="";
  document.getElementById("manualTotal").value="";
  currentManualDescription = "";

}



async function viewPayments(invoiceNo){

  let res = await fetch("https://erp-system-303n.onrender.com/api/payments");
  let data = await res.json();

let payments;

if(invoiceNo.startsWith("M-")){
payments = data.filter(p => 
  p.manualGroupId === invoiceNo && p.amount > 0
);
} else {
payments = data.filter(p => 
  p.invoiceNo === invoiceNo && p.amount > 0
);
}

  let html = "";

  if(payments.length === 0){
    html = `<tr><td colspan="5" style="text-align:center;">No payments</td></tr>`;
  } else {
    payments.forEach((p,i)=>{
      html += `
        <tr>
          <td>${i+1}</td>
          <td>₹${formatCurrency(p.amount)}</td>
          <td>${p.method}</td>
          <td>${formatDate(p.paymentDate)}</td>
          <td>
            <button onclick="editPayment('${p._id}')">Edit</button>
            <button onclick="deletePayment('${p._id}','${invoiceNo}')">Delete</button>
          </td>
        </tr>
      `;
    });
  }

  document.getElementById("historyList").innerHTML = html;
  document.getElementById("historyPanel").style.display="block";
}




function closeHistory(){

document.getElementById("historyPanel").style.display="none";

}



async function deletePayment(id, invoiceNo){

  if (!confirm("Delete this payment?")) return;

  await fetch(`https://erp-system-303n.onrender.com/api/payments/${id}`, {
    method: "DELETE"
  });

  if(invoiceNo !== "manual"){
    viewPayments(invoiceNo);
  }

  loadInvoicesFromDB();
}



async function editPayment(id){

  let res = await fetch("https://erp-system-303n.onrender.com/api/payments");
  let data = await res.json();

  let payment = data.find(p => p._id === id);

  if(!payment){
    alert("Payment not found");
    return;
  }

  document.getElementById("payAmount").value = payment.amount;
  document.getElementById("payMode").value = payment.method;
  document.getElementById("payDate").value = payment.paymentDate.split("T")[0];

  editingPaymentId = id;
  selectedIndex = null;
  currentManualGroup = null;

  document.getElementById("manualFields").style.display = "none";
  document.getElementById("paymentFields").style.display = "block";

  closeHistory();
  document.getElementById("paymentPanel").style.display="block";
}


async function openManualPay(groupId){

  selectedIndex = null;
  editingPaymentId = null;

  currentManualGroup = groupId;
  currentManualDescription = "";

  clearPanel();

  // fetch existing manual group description so it stays with subsequent payments
  try {
    const res = await fetch("https://erp-system-303n.onrender.com/api/payments");
    const data = await res.json();
    const groupPayment = data.find(p => String(p.manualGroupId) === String(groupId) || String(p._id) === String(groupId));
    currentManualDescription = groupPayment?.description || "";
    document.getElementById("payDescription").value = currentManualDescription;
  } catch (err) {
    console.error("Unable to load manual payment description:", err);
  }

  // ❌ hide manual fields
  document.getElementById("manualFields").style.display = "none";

  // ✅ show payment fields
  document.getElementById("paymentFields").style.display = "block";

  document.getElementById("paymentPanel").style.display = "block";
}



async function deleteInvoice(id, invoiceNo){

  if(!confirm("Delete this invoice and all its payments?")) return;

  try {

    // 1. delete invoice
    await fetch(`https://erp-system-303n.onrender.com/api/purchase-invoices/${id}`, {
      method: "DELETE"
    });

    // 2. delete related payments
    let res = await fetch("https://erp-system-303n.onrender.com/api/payments");
    let payments = await res.json();

    let related = payments.filter(p => p.invoiceNo === invoiceNo);

    for(let p of related){
      await fetch(`https://erp-system-303n.onrender.com/api/payments/${p._id}`, {
        method: "DELETE"
      });
    }

    loadInvoicesFromDB();

  } catch(err){
    console.error(err);
    alert("Error deleting invoice");
  }
}


async function deleteManualGroup(groupId){

  if(!confirm("Delete this manual entry?")) return;

  try {

    let res = await fetch("https://erp-system-303n.onrender.com/api/payments");
    let data = await res.json();

    console.log("Group ID:", groupId);

let related = data.filter(p => 
  p.isManual && (
    String(p.manualGroupId) === String(groupId) ||
    String(p._id) === String(groupId)
  )
);

    console.log("To delete:", related);

    for(let p of related){
      await fetch(`https://erp-system-303n.onrender.com/api/payments/${p._id}`, {
        method: "DELETE"
      });
    }

    loadInvoicesFromDB();

  } catch(err){
    console.error(err);
    alert("Error deleting manual entry");
  }
}


function openManualPayment(){

  selectedIndex = null;
  editingPaymentId = null;
  currentManualGroup = null;

  clearPanel();

  // ✅ show manual fields
  document.getElementById("manualFields").style.display = "block";

  // ❌ hide payment fields
  document.getElementById("paymentFields").style.display = "none";

  document.getElementById("paymentPanel").style.display = "block";
}


