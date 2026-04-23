const mongoose = require("mongoose");

const processSchema = new mongoose.Schema({
  process: String,
  machine: String,
  startDate: String,
  endDate: String,
  producedQty: Number,
  acceptedQty: Number,
  reworkQty: Number,
  rejectedQty: Number,
  operator: String
});

const routeCardSchema = new mongoose.Schema({

    rcNo: String,
    customer: String,

    product: String,   // ✅ ADD THIS
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

    partNumber: String,
    qty: Number,

    poNo: String,
    poId: { type: mongoose.Schema.Types.ObjectId },

    invoiceNo: String,   // ✅ ADD THIS

    processes: Array

}, { timestamps: true });

module.exports = mongoose.model("RouteCard", routeCardSchema);