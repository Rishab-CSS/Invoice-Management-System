const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

  invoiceNo: String,
  customerName: String,
  amount: Number,
  invoiceDate: String,

  // 🔥 ADD THESE
  poNo: String,
  poDate: String,
  gstType: String,

  items: [
    {
      part: String,
      no: String,
      hsn: String,
      qty: Number,
      rate: Number,
      total: Number
    }
  ]

});

module.exports = mongoose.model("Invoice", invoiceSchema);


