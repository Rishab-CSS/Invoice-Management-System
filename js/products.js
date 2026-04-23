const role = localStorage.getItem("role");

if(!role){
  window.location.href = "login.html";
}

const API = "https://erp-system-303n.onrender.com/api/products";

let editId = null;

// =======================
// LOAD PRODUCTS
// =======================

async function loadProducts(){
    const res = await fetch(API);
    const data = await res.json();

    const table = document.getElementById("productTable");
    table.innerHTML = "";

    data.forEach(p => {
        table.innerHTML += `
        <tr>
            <td>${p.name}</td>
            <td>
                <button onclick="editProduct('${p._id}')">Edit</button>
                <button onclick="deleteProduct('${p._id}')">Delete</button>
            </td>
        </tr>
        `;
    });
}

// =======================
// SAVE PRODUCT
// =======================

async function saveProduct(){

    const name = document.getElementById("productName").value.trim();

    if(!name){
        alert("Enter product name");
        return;
    }

    if(editId){
        // UPDATE
        await fetch(`${API}/${editId}`,{
            method:"PUT",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ name })
        });

        editId = null;

    }else{
        // CREATE
        await fetch(`${API}/add`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ name })
        });
    }

    document.getElementById("productName").value = "";

    loadProducts();
}

// =======================
// EDIT
// =======================

async function editProduct(id){

    const res = await fetch(API);
    const data = await res.json();

    const product = data.find(p => p._id === id);

    document.getElementById("productName").value = product.name;

    editId = id;
}

// =======================
// DELETE
// =======================

async function deleteProduct(id){

    if(!confirm("Delete this product?")) return;

    await fetch(`${API}/${id}`,{
        method:"DELETE"
    });

    loadProducts();
}

// INIT
loadProducts();