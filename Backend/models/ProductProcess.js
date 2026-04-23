const mongoose = require("mongoose");

const processSchema = new mongoose.Schema({
  name: String
});

const productProcessSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  processes: [processSchema]
}, { timestamps: true });

module.exports = mongoose.model("ProductProcess", productProcessSchema);