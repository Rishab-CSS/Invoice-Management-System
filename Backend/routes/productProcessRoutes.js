const express = require("express");
const router = express.Router();
const ProductProcess = require("../models/ProductProcess");


router.get("/", async (req, res) => {
  const data = await ProductProcess.find();
  res.json(data);
});

// SAVE / UPDATE PROCESS
router.post("/save", async (req, res) => {
  const { productId, processes } = req.body;

  let existing = await ProductProcess.findOne({ productId });

  if (existing) {
    existing.processes = processes;
    await existing.save();
    return res.json(existing);
  }

  const newEntry = new ProductProcess({ productId, processes });
  await newEntry.save();

  res.json(newEntry);
});

// GET BY PRODUCT
router.get("/:productId", async (req, res) => {
  const data = await ProductProcess.findOne({
    productId: req.params.productId
  });

  res.json(data || { processes: [] });
});


router.delete("/delete/:productId", async (req, res) => {
  await ProductProcess.findOneAndDelete({
    productId: req.params.productId
  });

  res.json({ message: "Deleted" });
});


module.exports = router;