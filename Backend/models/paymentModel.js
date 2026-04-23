const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    partyName: {
        type: String,
        required: true
    },
    invoiceNo: {
        type: String
    },

    description: {
        type: String
    },

    isManual: {
        type: Boolean,
        default: false
    },

    manualGroupId: {   // ✅ ADD THIS
        type: String
    },

    totalAmount: {     // ✅ ADD THIS (MOST IMPORTANT)
        type: Number
    },

    amount: {
        type: Number,
        required: true
    },

    paymentDate: {
        type: Date,
        required: true
    },

    method: {
        type: String
    },

    status: {
        type: String,
        default: "paid"
    }

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);