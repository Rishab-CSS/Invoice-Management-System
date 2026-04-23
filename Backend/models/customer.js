const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    name: String,
    address: String,
    gst: String,
    vendorCode: String,
    paymentTerms: {
    type: Number,
    default: 45
},
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Customer", customerSchema);