const express = require("express");
const router = express.Router();
const Production = require("../models/ProductionTracking");
const ProductProcess = require("../models/ProductProcess");

// =========================
// CREATE PRODUCT
// =========================
router.post("/create", async (req, res) => {
  try {
    const data = new Production({
      ...req.body,
      productId: req.body.productId
    });

    await data.save();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// GET ALL
// =========================
router.get("/", async (req, res) => {
  const data = await Production.find().sort({ createdAt: -1 });
  res.json(data);
});

// =========================
// GET ONE
// =========================
router.get("/:id", async (req, res) => {
  try {
    const data = await Production.findById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// ADD PROCESS
// =========================
router.post("/add-process/:id", async (req, res) => {
  try {

    const product = await Production.findById(req.params.id);
    let process = req.body;

    // =========================
    // LOSS CALCULATION
    // =========================
    const produced = Number(process.producedQty || 0);
    const accepted = Number(process.acceptedQty || 0);

    let missing = 0;
    if (accepted > 0) {
      missing = produced - accepted;
    }

    process.missingQty = missing > 0 ? missing : 0;

    if (missing > 0) {
      process.rejectedQty = missing;
      process.finalFlowQty = accepted;
    } else {
      process.rejectedQty = 0;
      process.finalFlowQty = accepted;
    }

    // =========================
    // INVENTORY HANDLING
    // =========================
    if (missing > 0) {
      if (process.useInventory === true) {
        process.takenFromInventory = missing;
        process.finalFlowQty = accepted + missing;
      } else {
        process.rejectedQty = missing;
        process.finalFlowQty = accepted;
      }
    } else {
      process.finalFlowQty = accepted;
    }

    // =========================
    // OPERATOR VALIDATION
    // =========================
    if (
      process.machineOrVendor &&
      process.machineOrVendor.toLowerCase() !== "outsourcing"
    ) {
      if (!process.operator) {
        return res.status(400).json({
          error: "Operator required for in-house process"
        });
      }
    }

    // =========================
    // UPDATE TOTAL PRODUCED
    // =========================
    if (process.finalFlowQty) {
      product.producedQty = process.finalFlowQty;
    }

    // =========================
    // SAVE / UPDATE PROCESS
    // =========================
    if (req.body.processId) {

      const existing = product.processes.id(req.body.processId);

      if (existing) {
        existing.processName = process.processName;
        existing.producedQty = process.producedQty;
        existing.acceptedQty = process.acceptedQty;
        existing.startDate = process.startDate;
        existing.endDate = process.endDate;
        existing.machineOrVendor = process.machineOrVendor;
        existing.operator = process.operator;
      }

    } else {

      const exists = product.processes.find(p =>
        p.processName === process.processName &&
        p.startDate === process.startDate
      );

      if (!exists) {
        product.processes.push(process);
      }
    }

    // =========================
    // AUTO COMPLETE STATUS
    // =========================
    if (
      process.processName &&
      process.processName.toLowerCase().includes("inspection") &&
      process.endDate
    ) {
      product.status = "Completed";
    }

    await product.save();

    // =========================
    // SYNC WITH PRODUCT PROCESS (FINAL FIX)
    // =========================
    const newProcesses = product.processes.map(p => ({
      name: p.processName
    }));

    let existingProcess = await ProductProcess.findOne({
      productId: product.productId
    });

    if (existingProcess) {

      let merged = existingProcess.processes || [];

      newProcesses.forEach(np => {

        const exists = merged.find(mp =>
          mp.name.toLowerCase() === np.name.toLowerCase()
        );

        if (!exists) {
          merged.push(np);
        }

      });

      existingProcess.processes = merged;
      await existingProcess.save();

    } else {

      await ProductProcess.create({
        productId: product.productId,
        processes: newProcesses
      });

    }

    // =========================
    // RESPONSE
    // =========================
    const newProcess = product.processes[product.processes.length - 1];

    res.json({
      productId: product.productId,
      processId: newProcess._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// COMPLETE
// =========================
router.put("/complete/:id", async (req, res) => {
  try {
    const updated = await Production.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// CLEAR PROCESSES
// =========================
router.put("/clear-processes/:id", async (req, res) => {
  try {
    const product = await Production.findById(req.params.id);

    product.processes = [];
    product.producedQty = 0;
    product.status = "In Progress";

    await product.save();

    res.json({ message: "Processes cleared" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DISPATCH
// =========================
router.post("/dispatch/:id", async (req, res) => {
  try {

    const product = await Production.findById(req.params.id);
    const dispatchQty = req.body.dispatchedQty || 0;
    const produced = product.producedQty || 0;

    if (dispatchQty > produced) {
      return res.status(400).json({
        error: "Dispatch qty cannot be more than produced qty"
      });
    }

    product.dispatchedQty = dispatchQty;
    product.remainingStock = produced - dispatchQty;
    product.status = "Completed";

    await product.save();
    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELETE
// =========================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Production.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;