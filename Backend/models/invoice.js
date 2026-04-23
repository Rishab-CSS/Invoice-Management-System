const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

  invoiceNo: {
    type: String,
    required: true,
    unique: true 
  },
  customerName: String,
  amount: Number,
  invoiceDate: String,

  status: { type: String, default: "Pending" },
  paymentTerms: {
  type: Number,
  default: 45
},

  poId: String,
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


