function login(){

let username = document.getElementById("username").value;
let password = document.getElementById("password").value;

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

if(username === ADMIN_USER && password === ADMIN_PASS){

localStorage.setItem("adminLoggedIn","true");
localStorage.removeItem("editInvoice"); // clear leftover edit data

window.location.href = "index.html";

}
else{

document.getElementById("error").style.display="block";

}

}