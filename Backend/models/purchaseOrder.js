const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  part: String,
  partNo: String,
  hsn: String,
  orderedQty: Number,
  pendingQty: Number,
  rate: Number
});

const purchaseOrderSchema = new mongoose.Schema({
  poNo: String,
  poDate: String,
  customer: String,
  items: [itemSchema]
}, { timestamps: true });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);