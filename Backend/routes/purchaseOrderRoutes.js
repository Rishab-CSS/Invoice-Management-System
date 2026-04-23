const express = require("express");
const router = express.Router();
const PurchaseOrder = require("../models/PurchaseOrder");

// CREATE PO
router.post("/", async (req, res) => {
  try {
    const po = new PurchaseOrder(req.body);
    await po.save();
    res.json({ message: "Purchase Order saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL PO
router.get("/", async (req, res) => {
  try {
    const data = await PurchaseOrder.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "PO deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "PO updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;