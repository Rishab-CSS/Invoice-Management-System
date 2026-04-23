const API = "http://localhost:3000/api/employees";
let editingId = null;


// ➤ Load Employees
async function loadEmployees() {
    const res = await fetch(API);
    const data = await res.json();

    const table = document.getElementById("employeeTable");
    table.innerHTML = "";

    data.forEach(emp => {
    table.innerHTML += `
        <tr>
            <td>${emp.name}</td>
            <td>${emp.age}</td>
            <td>${emp.phone}</td>
<td>${emp.designation || "-"}</td>
<td>${Number(emp.salary).toLocaleString('en-IN')}</td>
             <td>   <button onclick="editEmployee(
                    '${emp._id}',
                    '${emp.name}',
                    '${emp.age}',
                    '${emp.phone}',
                    '${emp.designation}',
                    '${emp.salary}'
                )">Edit</button>

                <button onclick="deleteEmployee('${emp._id}')">Delete</button>
            </td>
        </tr>
    `;
});

}

// ➤ Add Employee
async function addEmployee() {
    const employee = {
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        phone: document.getElementById("phone").value,
        salary: document.getElementById("salary").value,
        designation: document.getElementById("designation").value
    };

    if (editingId) {
        await fetch(`${API}/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employee)
        });

        editingId = null;

        // ✅ Back to Add
        document.getElementById("submitBtn").innerText = "Add Employee";
    } else {
        await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employee)
        });
    }

    loadEmployees();

    // Clear inputs
    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("salary").value = "";
    document.getElementById("designation").value = "";
}


// ➤ Delete
async function deleteEmployee(id) {
    if (confirm("Do you wish to delete the employee record?")) {
        await fetch(`${API}/${id}`, { method: "DELETE" });
        loadEmployees();
    }
}

// ➤ Edit 
function editEmployee(id, name, age, phone, designation, salary) {
    document.getElementById("name").value = name;
    document.getElementById("age").value = age;
    document.getElementById("phone").value = phone;
    document.getElementById("salary").value = salary;
    document.getElementById("designation").value = designation;

    editingId = id;

    document.getElementById("submitBtn").innerText = "Save";
}


// Load on start
loadEmployees();