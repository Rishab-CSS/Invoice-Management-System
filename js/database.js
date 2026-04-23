function saveInvoice(invoice){
    let invoices = JSON.parse(localStorage.getItem("invoices")) || [];
    invoices.push(invoice);
    localStorage.setItem("invoices", JSON.stringify(invoices));
}

function getInvoices(){
    return JSON.parse(localStorage.getItem("invoices")) || [];
}

function getNextInvoiceNumber(){

    let invoices = getInvoices();

    if(invoices.length === 0){
        return "001";
    }

    let lastInvoice = invoices[invoices.length - 1].invoiceNo;

    let num = parseInt(lastInvoice);

    num++;

    return String(num).padStart(3,'0');
}