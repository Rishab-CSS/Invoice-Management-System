const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  productName: String,
  qty: Number,
  rate: Number,
  amount: Number,
  usedQty: {
    type: Number,
    default: 0   // ✅ your logic
  }
});

const purchaseInvoiceSchema = new mongoose.Schema({
  invoiceNo: String,
  vendorName: String,
  vendorCode: String,
  invoiceDate: String,
  poNo: String,
  poDate: String,

  items: [itemSchema],

  subTotal: Number,
  gst: Number,
  roundOff: Number,
  grandTotal: Number,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);