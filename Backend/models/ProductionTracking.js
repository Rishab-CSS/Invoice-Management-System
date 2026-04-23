const mongoose = require("mongoose");

const processSchema = new mongoose.Schema({
  processName: String,

  producedQty: Number,
  acceptedQty: Number,

  

  missingQty: Number,
  takenFromInventory: Number,
  rejectedQty: Number,

  finalFlowQty: Number,

  startDate: String,
  endDate: String,

  machineOrVendor: String,
  operator: String
});

const productionTrackingSchema = new mongoose.Schema({


  productId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Product"
},

  productName: String,
  totalQty: Number,

  customer: String,
poNo: String,
partNumber: String,
routeCardNo: String,

  processes: [processSchema],

  producedQty: Number,
  dispatchedQty: {
    type: Number,
    default: 0
  },

  remainingStock: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    default: "In Progress"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ProductionTracking", productionTrackingSchema);