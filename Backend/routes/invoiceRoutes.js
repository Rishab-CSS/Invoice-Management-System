const express = require("express");
const router = express.Router();
const Invoice = require("../models/invoice");
const Payment = require("../models/paymentModel");
const PurchaseOrder = require("../models/purchaseOrder");

// GET all invoices
router.get("/", async (req, res) => {
    const invoices = await Invoice.find().sort({ _id: -1 });
  res.json(invoices);
});

// ADD new invoice
router.post("/", async (req, res) => {

  console.log("BODY RECEIVED:", req.body);

  try {

    // 🔥 1. Get last invoice
    const lastInvoice = await Invoice.findOne().sort({ _id: -1 });

    let nextNo = 1;

    if (lastInvoice && lastInvoice.invoiceNo) {
      nextNo = parseInt(lastInvoice.invoiceNo) + 1;
    }

    // 🔥 2. Assign new invoice number
    req.body.invoiceNo = String(nextNo).padStart(3, '0');

  const newInvoice = new Invoice(req.body);
await newInvoice.save();

// 🔥 UPDATE PO PENDING QTY
if(req.body.poId && req.body.items){

    const po = await PurchaseOrder.findById(req.body.poId);

    if(po){

        req.body.items.forEach(invItem => {

            let poItem = po.items.find(p => p.part === invItem.part);

            if(poItem){
                poItem.pendingQty -= invItem.qty;

                // prevent negative
                if(poItem.pendingQty < 0){
                    poItem.pendingQty = 0;
                }
            }

        });

        await po.save();
    }
}

res.json(newInvoice);

  } catch (err) {

    // 🔥 Handle duplicate error (just in case)
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate invoice number!" });
    }

    res.status(500).json({ error: err.message });
  }

});



// DELETE invoice
router.delete("/:id", async (req, res) => {
  try {

    // 1️⃣ Get invoice first
    const invoice = await Invoice.findById(req.params.id);

    if(!invoice){
      return res.status(404).json({ message: "Invoice not found" });
    }

   // 🔥 RESTORE PO QTY BEFORE DELETE
if(invoice.poId && invoice.items){

    const po = await PurchaseOrder.findById(invoice.poId);

    if(po){

        invoice.items.forEach(invItem => {

            let poItem = po.items.find(p => p.partNo === invItem.no);

            if(poItem){
                poItem.pendingQty += invItem.qty;
            }

        });

        await po.save();
    }
}

// 2️⃣ Delete related payments
await Payment.deleteMany({ invoiceNo: invoice.invoiceNo });

// 3️⃣ Delete invoice
await Invoice.findByIdAndDelete(req.params.id);

    res.json({ message: "Invoice and related payments deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// GET next invoice number
router.get("/next-number", async (req, res) => {
  try {
    const lastInvoice = await Invoice.findOne().sort({ _id: -1 });

    let nextNo = 1;

    if (lastInvoice && lastInvoice.invoiceNo) {
      nextNo = parseInt(lastInvoice.invoiceNo) + 1;
    }

    const formatted = String(nextNo).padStart(3, '0');

    res.json({ invoiceNo: formatted });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET single invoice by ID
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE invoice (EDIT)
router.put("/:id", async (req, res) => {
  try {

    const oldInvoice = await Invoice.findById(req.params.id);

    // 🔥 1. RESTORE OLD QTY
    if(oldInvoice.poId && oldInvoice.items){
        const po = await PurchaseOrder.findById(oldInvoice.poId);

        if(po){
            oldInvoice.items.forEach(item => {
                let poItem = po.items.find(p => p.partNo === item.no);
                if(poItem){
                    poItem.pendingQty += item.qty;
                }
            });
            await po.save();
        }
    }

    // 🔥 2. APPLY NEW QTY
    if(req.body.poId && req.body.items){
        const po = await PurchaseOrder.findById(req.body.poId);

        if(po){
            req.body.items.forEach(item => {
                let poItem = po.items.find(p => p.partNo === item.no);
                if(poItem){
                    poItem.pendingQty -= item.qty;

                    if(poItem.pendingQty < 0){
                        poItem.pendingQty = 0;
                    }
                }
            });
            await po.save();
        }
    }

    // 🔥 3. UPDATE INVOICE
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedInvoice);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;