// =======================
// AUTH CHECK
// =======================
const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

// =======================
// API URLS
// =======================
const PRODUCT_API = "https://erp-system-303n.onrender.com/api/products";
const PROCESS_API = "https://erp-system-303n.onrender.com/api/processes";

// =======================
// ELEMENTS
// =======================
const table = document.getElementById("processTable");
const processRows = document.getElementById("processRows");

let currentProductId = null;

// =======================
// LOAD TABLE (MAIN VIEW)
// =======================
async function loadTable(){

    const res = await fetch(PRODUCT_API);
    const products = await res.json();

    table.innerHTML = "";

    for(let i = 0; i < products.length; i++){

        let p = products[i];

        let processList = "-";

        try {
const res2 = await fetch(`${PROCESS_API}/${p._id}`);
const data = await res2.json();

if (data && data.processes && data.processes.length > 0) {

    processList = "<div style='display:flex; flex-direction:column; gap:6px;'>";

    data.processes.forEach(proc => {
        processList += `
        <span style="
            background: rgba(56, 189, 248, 0.1);
            color: #38bdf8;
            padding:5px 12px;
            border-radius:20px;
            font-size:12px;
            font-weight: 600;
            border:1px solid rgba(56, 189, 248, 0.2);
max-width:100%;
word-break:break-word;
        ">
            ${proc.name}
        </span>`;
    });

    processList += "</div>";
}


        } catch (err) {
            console.error("Error loading processes:", err);
        }

        table.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${p.name}</td>
            <td>${processList}</td>
            <td>
            <div class="action-buttons">
                <button onclick="openModal('${p._id}')">Add / Edit</button>
                <button onclick="deleteProcesses('${p._id}')">Delete</button>
                </div>
                
            </td>
        </tr>
        `;
    }

    applyEmptyState();
}

// =======================
// OPEN MODAL
// =======================
function openModal(productId){

    currentProductId = productId;

    document.getElementById("processModal").style.display = "block";

    loadProcesses(productId);
}

// =======================
// CLOSE MODAL
// =======================
function closeModal(){
    document.getElementById("processModal").style.display = "none";
}

// =======================
// LOAD PROCESSES INTO MODAL
// =======================
async function loadProcesses(productId){

    processRows.innerHTML = "";

    try {
        const res = await fetch(`${PROCESS_API}/${productId}`);
        const data = await res.json();

        if(!data || !data.processes || data.processes.length === 0){
            addProcessRow();
            return;
        }

        data.processes.forEach(p=>{
addProcessRow(p.name);
        });

    } catch (err) {
        console.error("Error loading processes:", err);
        addProcessRow();
    }

    renumber();
}

// =======================
// ADD PROCESS ROW
// =======================
function addProcessRow(value=""){

    const row = document.createElement("tr");

    row.innerHTML = `
    <td class="sl"></td>

    <td>
        <input type="text" class="processName" value="${value}">
    </td>

    <td>
        <button onclick="moveUp(this)">↑</button>
        <button onclick="moveDown(this)">↓</button>
    </td>

    <td>
        <button onclick="removeRow(this)">X</button>
    </td>
    `;

    processRows.appendChild(row);

    renumber();
}

// =======================
// REMOVE ROW
// =======================
function removeRow(btn){
    btn.closest("tr").remove();
    renumber();
}

// =======================
// MOVE UP
// =======================
function moveUp(btn){
    const row = btn.closest("tr");
    if(row.previousElementSibling){
        row.parentElement.insertBefore(row, row.previousElementSibling);
        renumber();
    }
}

// =======================
// MOVE DOWN
// =======================
function moveDown(btn){
    const row = btn.closest("tr");
    if(row.nextElementSibling){
        row.parentElement.insertBefore(row.nextElementSibling, row);
        renumber();
    }
}

// =======================
// RENUMBER
// =======================
function renumber(){
    Array.from(processRows.children).forEach((row,i)=>{
        row.querySelector(".sl").innerText = i+1;
    });
}

// =======================
// SAVE PROCESSES
// =======================
async function saveProcesses(){

    if(!currentProductId){
        alert("No product selected");
        return;
    }

    const processes = [];

    Array.from(processRows.children).forEach(row=>{
        const name = row.querySelector(".processName").value.trim();
        if(name){
            processes.push({ name });
        }
    });

    try {
        await fetch(`${PROCESS_API}/save`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                productId: currentProductId,
                processes
            })
        });

        alert("Processes Saved");

        closeModal();
        loadTable();

    } catch (err) {
        console.error("Save error:", err);
        alert("Error saving processes");
    }
}

// =======================
// DELETE PROCESSES
// =======================
async function deleteProcesses(productId){

    if(!confirm("Delete processes?")) return;

    try {
        await fetch(`${PROCESS_API}/delete/${productId}`,{
            method:"DELETE"
        });

        loadTable();

    } catch (err) {
        console.error("Delete error:", err);
    }
}

// =======================
// INIT
// =======================
loadTable();