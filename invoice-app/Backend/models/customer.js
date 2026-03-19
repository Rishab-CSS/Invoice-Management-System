const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    name: String,
    address: String,
    gst: String,
    vendorCode: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Customer", customerSchema);