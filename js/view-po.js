const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

const tbody = document.querySelector("#poTable tbody");

// =========================
// DATE FORMAT
// =========================
function formatDate(date){

    let d = new Date(date);

    let day = String(d.getDate()).padStart(2,'0');
    let month = String(d.getMonth()+1).padStart(2,'0');
    let year = d.getFullYear();

    return `${day}-${month}-${year}`;
}

// =========================
// FETCH POS FROM BACKEND
// =========================
async function getPOs(){
    let res = await fetch("http://localhost:3000/api/purchase-orders");
    return await res.json();
}

// =========================
// LOAD & FILTER TABLE
// =========================
async function filterPO(type){

    let pos = await getPOs(); // 🔥 FROM DB

    tbody.innerHTML = "";

    pos.forEach(po => {

        let items = [...po.items]; // clone to avoid mutation

        // =========================
        // FILTER LOGIC
        // =========================
        if(type === "pending"){
            items = items.filter(i => i.pendingQty > 0);
        }

        if(type === "completed"){
            items = items.filter(i => i.pendingQty === 0);
        }

        if(items.length === 0) return;

        items.forEach((i,index) => {

            let status = i.pendingQty === 0 ? "Completed" : "Pending";

let row = document.createElement("tr");
row.classList.add(`po-group-${po._id}`);


row.addEventListener("mouseenter", () => {
    document.querySelectorAll(`.po-group-${po._id}`)
        .forEach(r => r.classList.add("po-hover"));
});

row.addEventListener("mouseleave", () => {
    document.querySelectorAll(`.po-group-${po._id}`)
        .forEach(r => r.classList.remove("po-hover"));
});


            let poCells = "";

            if(index === 0){
                poCells = `
                <td rowspan="${items.length}">${po.poNo}</td>

                <td rowspan="${items.length}">
                ${formatDate(po.poDate)}
                </td>

                <td rowspan="${items.length}">
                ${po.customer}
                </td>
                `;
            }

            

            row.innerHTML = `

            ${poCells}

            <td>
                <div class="po-part">${i.partNo}</div>
                <div class="po-desc">${i.part}</div>
            </td>

            <td>${i.orderedQty}</td>

            <td>₹ ${Number(i.rate).toLocaleString("en-IN")}</td>

            <td>₹ ${(i.orderedQty * i.rate).toLocaleString("en-IN")}</td>

            <td>${i.pendingQty}</td>

            <td>₹ ${(i.pendingQty * i.rate).toLocaleString("en-IN")}</td>

            <td class="${status === 'Completed' ? 'po-complete' : 'po-pending'}">
                ${status}
            </td>

            ${index === 0 ? `
            <td rowspan="${items.length}">
                <div class="po-actions">
                    <button onclick='editPO(${JSON.stringify(po)})'>Edit</button>
                    <button onclick="deletePO('${po._id}')">Delete</button>
                </div>
            </td>
            ` : ""}

            `;

            tbody.appendChild(row);

        });

    });

}

// =========================
// INITIAL LOAD
// =========================
filterPO("all");

// =========================
// DELETE PO
// =========================
async function deletePO(id){

    if(!confirm("Are you sure you want to delete this PO?")){
        return;
    }

    await fetch(`http://localhost:3000/api/purchase-orders/${id}`, {
        method: "DELETE"
    });

    alert("PO Deleted");

    filterPO("all");
}

// =========================
// EDIT PO (FINAL FIX)
// =========================
function editPO(po){

    // ✅ Store full PO object
    localStorage.setItem("editPO", JSON.stringify(po));

    // ✅ DEBUG (you can remove later)
    console.log("Editing PO:", po);

    // ✅ Redirect clean (NO ?edit=)
    window.location.href = "create-po.html";
}