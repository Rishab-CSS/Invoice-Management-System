const express = require("express");
const router = express.Router();
const RouteCard = require("../models/RouteCard");

// =======================
// CREATE
// =======================
router.post("/add", async (req, res) => {
  try {
    const rc = new RouteCard(req.body);
    await rc.save();
    res.json(rc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// GET ALL
// =======================
router.get("/", async (req, res) => {
  const data = await RouteCard.find().sort({ createdAt: -1 });
  res.json(data);
});

// =======================
// GET ONE (FOR EDIT)
// =======================
router.get("/:id", async (req, res) => {
  const data = await RouteCard.findById(req.params.id);
  res.json(data);
});

// =======================
// UPDATE
// =======================
router.put("/:id", async (req, res) => {
  try {
    console.log("UPDATE BODY:", req.body); // 🔥 DEBUG

    const updated = await RouteCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.error("UPDATE ERROR:", err); // 🔥 SEE ERROR
    res.status(500).json({ error: err.message });
  }
});

// =======================
// DELETE
// =======================
router.delete("/:id", async (req, res) => {
  await RouteCard.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;