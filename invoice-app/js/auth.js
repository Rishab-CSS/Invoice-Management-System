function logout(){

localStorage.removeItem("adminLoggedIn");
localStorage.removeItem("editInvoice"); // clear edit mode

window.location.href = "login.html";

}