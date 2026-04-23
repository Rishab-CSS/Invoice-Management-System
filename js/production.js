const predefined = [
  "Inhouse Materials",
  "CNC/01",
  "Milling/01",
  "Lathe/01",
  "Lathe/02",
  "Drilling Machine/01",
  "Outsourcing",
  "Inhouse"
];



// =========================
// AUTH CHECK
// =========================
const role = localStorage.getItem("role");

if (!role) {
  window.location.href = "login.html";
}

console.log("TRACKING PAGE JS LOADED");

const API_URL = "https://erp-system-303n.onrender.com/api/production";

let currentProductionId = null;

// =========================
// LOAD EXISTING
// =========================
window.onload = async function () {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  // Reset UI
  document.getElementById("processTable").innerHTML = "";
  document.getElementById("productInput").value = "";
  document.getElementById("qtyInput").value = "";

  if (id) {
    currentProductionId = id;
    await loadExistingProduction(id);

    // ⭐ REMOVE ID FROM URL AFTER LOAD
    window.history.replaceState({}, document.title, "production-tracking.html");
  }
};

// =========================
// CREATE PRODUCT
// =========================
async function createProduction() {


  const btn = document.getElementById("createBtn");

  if (btn.disabled) {
    return;
  }

  btn.disabled = true;
  btn.innerText = "Saving...";

  const productName = document.getElementById("productInput").value;
  const qty = document.getElementById("qtyInput").value;

  if (!productName || !qty) {
    alert("Enter product name and qty");
    return;
  }

  const product = await getOrCreateProduct(productName);

  const res = await fetch(API_URL + "/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productName: product.name,
      productId: product._id,
      totalQty: qty
    })
  });

  const data = await res.json();

  currentProductionId = data._id;

  document.getElementById("processSection").style.display = "block";

  btn.disabled = false;
  btn.innerText = "Save";

  alert("Product Saved!");
  window.location.href = "production-view.html";
}



// =========================
// ADD PROCESS ROW
// =========================
function addRow() {



  const table = document.getElementById("processTable");

  const row = document.createElement("tr");

  row.innerHTML = `
<td>
<select class="process" onchange="handleProcessChange(this)">
  <option value="">Select Process</option>
  <option>Raw Material Inspection</option>
  <option>Cutting</option>
  <option>Machining (Roughing)</option>
  <option>Milling</option>
  <option>Heat Treatment</option>
  <option>Machining (Finishing)</option>
  <option>Blackening</option>
  <option>Plating</option>
  <option>Assembly</option>
  <option>Drilling</option>
  <option>Turning</option>
  <option>Grinding & Rolling</option>
  <option>Inspection & Dispatch</option>
  <option value="OTHER">Others</option>
</select>

<!-- 👇 NEW INPUT -->
<input type="text" class="processOther" placeholder="Enter process name"
       style="display:none; margin-top:5px;">
</td>

<td>
  <select class="machineSelect" onchange="handleMachineChange(this)">
    <option value="">Select Machine/Vendor</option>
    <option>Inhouse Materials</option>
    <option>CNC/01</option>
    <option>Milling/01</option>
    <option>Lathe/01</option>
    <option>Lathe/02</option>
    <option>Drilling Machine/01</option>
    <option>Outsourcing</option>
    <option>Inhouse</option>
    <option value="OTHER">Others</option>
  </select>

  <!-- 👇 NEW INPUT -->
  <input type="text" class="machineOther" placeholder="Enter machine/vendor"
         style="display:none; margin-top:5px;">
</td>

    <td><input type="number" class="produced"></td>

    <td><input type="number" class="accepted" disabled></td>

    <td><input type="date" class="startDate"></td>

    <td><input type="date" class="endDate" disabled></td>

    <td>
      <select class="operator"></select>
    </td>

    <td>
      <div class="action-buttons">
        <button onclick="editRow(this)">Edit</button>
        <button onclick="deleteRow(this)">Delete</button>
      </div>
    </td>
  `;

  row.classList.add('process-start-row');
  table.appendChild(row);

  // ✅ Initialize Select2 for the three dropdowns in this row
  $(row.querySelector('.process')).select2({
    placeholder: 'Select Process',
    width: '100%',
    minimumResultsForSearch: Infinity
  });

  $(row.querySelector('.machineSelect')).select2({
    placeholder: 'Select Machine/Vendor',
    width: '100%',
    minimumResultsForSearch: Infinity
  });

  loadEmployees(row.querySelector('.operator')).then(() => {
    $(row.querySelector('.operator')).select2({
      placeholder: 'Select Operator',
      width: '100%',
      minimumResultsForSearch: Infinity
    });
  });

}

// =========================
// SAVE PROCESS
// =========================
async function saveProcess() {

  const btn = document.getElementById("saveBtn");

  if (btn.disabled) return;

  btn.disabled = true;
  btn.innerText = "Saving...";

  const rows = document.querySelectorAll("#processTable tr");

  if (rows.length === 0) {
    alert("Add at least one process");
    btn.disabled = false;
    btn.innerText = "Save";
    return;
  }

  try {

    for (const row of rows) {

      const processSelect = row.querySelector(".process");
      const processOther = row.querySelector(".processOther");

      let processName = processSelect.value;
      if (processName === "OTHER") {
        processName = processOther.value;
      }

      const machineSelect = row.querySelector(".machineSelect");
      const machineOther = row.querySelector(".machineOther");

      let machine = machineSelect.value;
      if (machine === "OTHER") {
        machine = machineOther.value;
      }

      const produced = row.querySelector(".produced").value;
      const accepted = row.querySelector(".accepted").value;
      const startDate = row.querySelector(".startDate").value;
      const endDate = row.querySelector(".endDate").value;
      const operator = row.querySelector(".operator").value;

      if (!processName || !machine || !produced || !startDate) {
        continue; // skip incomplete rows
      }

      await fetch(API_URL + "/add-process/" + currentProductionId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId,
          processName,
          producedQty: produced,
          acceptedQty: accepted,
          startDate,
          endDate,
          machineOrVendor: machine,
          operator
        })
      });

    }

    alert("All processes saved!");
    window.location.href = "production-view.html";

  } catch (err) {
    console.error(err);
    alert("Error saving processes");
  }

  btn.disabled = false;
  btn.innerText = "Save Process";
}

// =========================
// LOAD EXISTING DATA
// =========================
async function loadExistingProduction(id) {

  console.log("Fetching ID:", id);

  const res = await fetch(API_URL + "/" + id);
  const data = await res.json();

  document.getElementById("productInput").value = data.productName;
  document.getElementById("qtyInput").value = data.totalQty;

  document.getElementById("processSection").style.display = "block";

  const table = document.getElementById("processTable");
  table.innerHTML = "";

  // ⭐ FIX STARTS HERE
  const unique = {};

  data.processes.forEach(p => {
    unique[p.processName] = p;
  });

  const finalProcesses = Object.values(unique);
  // ⭐ FIX ENDS HERE

  finalProcesses.forEach(proc => {

    const row = document.createElement("tr");

    row.dataset.id = proc._id;

    const isCompleted = proc.acceptedQty && proc.endDate;


    row.innerHTML = `
<td>
<select class="process" disabled onchange="handleProcessChange(this)">
  <option value="">Select Process</option>
  <option>Raw Material Inspection</option>
  <option>Cutting</option>
  <option>Machining (Roughing)</option>
  <option>Milling</option>
  <option>Heat Treatment</option>
  <option>Machining (Finishing)</option>
  <option>Blackening</option>
  <option>Plating</option>
  <option>Assembly</option>
  <option>Drilling</option>
  <option>Turning</option>
  <option>Grinding & Rolling</option>
  <option>Inspection & Dispatch</option>
  <option value="OTHER">Others</option>
</select>

<input type="text" class="processOther" placeholder="Enter process name"
       style="display:none; margin-top:5px;">
</td>

<td>
  <select class="machineSelect" disabled onchange="handleMachineChange(this)">
    <option value="">Select Machine/Vendor</option>
    <option>Inhouse Materials</option>
    <option>CNC/01</option>
    <option>Milling/01</option>
    <option>Lathe/01</option>
    <option>Lathe/02</option>
    <option>Drilling Machine/01</option>
    <option>Outsourcing</option>
    <option>Inhouse</option>
    <option value="OTHER">Others</option>
  </select>

  <input type="text" class="machineOther"
         style="display:none; margin-top:5px;">
</td>

<td><input class="produced" value="${proc.producedQty}" disabled></td>

<td>
  <input class="accepted" 
    value="${proc.acceptedQty || ''}" 
    ${isCompleted ? "disabled" : ""}>
</td>

<td>
  <input type="date" class="startDate" 
    value="${proc.startDate ? proc.startDate.split('T')[0] : ''}" 
    disabled>
</td>

<td>
  <input type="date" class="endDate" 
    value="${proc.endDate ? proc.endDate.split('T')[0] : ''}" 
    ${isCompleted ? "disabled" : ""}>
</td>

<td>
<select class="operator" disabled></select>
</td>

<td>
      <div class="action-buttons">
        <button onclick="editRow(this)">Edit</button>
        <button onclick="deleteRow(this)">Delete</button>
      </div>
    </td>
`;

    if (proc.startDate && !proc.endDate) {
      row.classList.add('process-end-row');
    } else if (!proc.startDate) {
      row.classList.add('process-start-row');
    }
    table.appendChild(row);

    // ✅ Initialize Select2 for process and machine selects
    const processOptions = ["Raw Material Inspection", "Cutting", "Machining (Roughing)", "Milling", "Heat Treatment", "Machining (Finishing)", "Blackening", "Plating", "Assembly", "Drilling", "Turning", "Grinding & Rolling", "Inspection & Dispatch"];

    if (processOptions.includes(proc.processName)) {
      $(row.querySelector('.process')).select2({
        placeholder: 'Select Process',
        width: '100%',
        minimumResultsForSearch: Infinity
      }).val(proc.processName).trigger('change');
    } else {
      $(row.querySelector('.process')).select2({
        placeholder: 'Select Process',
        width: '100%',
        minimumResultsForSearch: Infinity
      }).val('OTHER').trigger('change');
      row.querySelector('.processOther').style.display = 'block';
      row.querySelector('.processOther').value = proc.processName;
    }

    // Set machine value AFTER Select2 init
    if (predefined.includes(proc.machineOrVendor)) {
      $(row.querySelector('.machineSelect')).select2({
        placeholder: 'Select Machine/Vendor',
        width: '100%',
        minimumResultsForSearch: Infinity
      }).val(proc.machineOrVendor).trigger('change');
    } else {
      $(row.querySelector('.machineSelect')).select2({
        placeholder: 'Select Machine/Vendor',
        width: '100%',
        minimumResultsForSearch: Infinity
      }).val('OTHER').trigger('change');
      row.querySelector('.machineOther').style.display = 'block';
      row.querySelector('.machineOther').value = proc.machineOrVendor;
    }

    loadEmployees(row.querySelector('.operator')).then(() => {
      $(row.querySelector('.operator')).select2({
        placeholder: 'Select Operator',
        width: '100%',
        minimumResultsForSearch: Infinity
      }).val(proc.operator ? proc.operator.trim() : '').trigger('change');
    });
    console.log("API RESPONSE:", data);

  });

  // Check if product is complete and disable Add Process button
  const addProcessBtn = document.querySelector('button[onclick="addRow()"]');
  if (data.processes.length > 0) {
    const lastProcess = data.processes[data.processes.length - 1];
    if (lastProcess.processName === "Inspection & Dispatch" && lastProcess.endDate) {
      addProcessBtn.disabled = true;
      addProcessBtn.textContent = "Product Complete";
      addProcessBtn.style.opacity = "0.6";
    }
  }
}

// =========================
// HELPERS
// =========================
function lockStartFields(row) {
  row.querySelector(".process").disabled = true;
  row.querySelector(".machineSelect").disabled = true;
  row.querySelector(".produced").disabled = true;
  row.querySelector(".startDate").disabled = true;
  row.querySelector(".operator").disabled = true;
}

function editRow(btn) {
  const row = btn.closest("tr");
  row.querySelectorAll("input").forEach(el => el.disabled = false);
  // Enable Select2 dropdowns correctly
  $(row).find('.process, .machineSelect, .operator').prop('disabled', false).trigger('change');
  updateRowState(row);
}

function updateRowState(row) {
  row.classList.remove('process-start-row', 'process-end-row');
  const startDate = row.querySelector('.startDate').value;
  const endDate = row.querySelector('.endDate').value;

  if (startDate && !endDate) {
    row.classList.add('process-end-row');
  } else if (!startDate) {
    row.classList.add('process-start-row');
  }
}

function deleteRow(btn) {
  if (!confirm("Delete this process?")) return;
  btn.closest("tr").remove();
}


async function loadEmployees(select) {
  const res = await fetch("https://erp-system-303n.onrender.com/api/employees");
  const data = await res.json();

  select.innerHTML = `<option>Select Operator</option>`;
  data.forEach(emp => {
    select.innerHTML += `<option>${emp.name}</option>`;
  });
}

async function getOrCreateProduct(productName) {

  const res = await fetch("https://erp-system-303n.onrender.com/api/products");
  const products = await res.json();

  let product = products.find(
    p => p.name.toLowerCase() === productName.toLowerCase()
  );

  if (!product) {
    const newRes = await fetch("https://erp-system-303n.onrender.com/api/products/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: productName })
    });

    product = await newRes.json();
  }

  return product;
}

function openRouteCardPanel() {
  document.getElementById("routeCardPanel").style.display = "block";
}

function closeRouteCardPanel() {
  document.getElementById("routeCardPanel").style.display = "none";
}

function createRouteCard() {
  alert("Route Card Created");
  closeRouteCardPanel();
}


function handleMachineChange(selectElement) {

  const row = selectElement.closest("tr");
  const operatorInput = row.querySelector(".operator");
  const otherInput = row.querySelector(".machineOther");

  if (selectElement.value === "Outsourcing") {
    operatorInput.value = "";
    operatorInput.disabled = true;
  } else {
    operatorInput.disabled = false;
  }

  // ⭐ NEW LOGIC
  if (selectElement.value === "OTHER") {
    otherInput.style.display = "block";
  } else {
    otherInput.style.display = "none";
    otherInput.value = "";
  }
}

// =========================
// HANDLE PROCESS CHANGE
// =========================
function handleProcessChange(selectElement) {
  const row = selectElement.closest("tr");
  const otherInput = row.querySelector(".processOther");

  if (selectElement.value === "OTHER") {
    otherInput.style.display = "block";
  } else {
    otherInput.style.display = "none";
    otherInput.value = "";
  }
}
