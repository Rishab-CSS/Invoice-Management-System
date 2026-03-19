const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");

// GET all invoices
router.get("/", async (req, res) => {
  const invoices = await Invoice.find();
  res.json(invoices);
});

// ADD new invoice
router.post("/", async (req, res) => {

  console.log("BODY RECEIVED:", req.body);

  
  const newInvoice = new Invoice(req.body);
  await newInvoice.save();
  res.json(newInvoice);
});

// DELETE invoice
router.delete("/:id", async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET latest invoice number
router.get("/latest", async (req, res) => {
  try {
    const lastInvoice = await Invoice.findOne()
      .sort({ invoiceNo: -1 });

    res.json(lastInvoice);
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