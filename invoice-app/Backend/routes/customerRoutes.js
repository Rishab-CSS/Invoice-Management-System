const express = require("express");
const router = express.Router();
const Customer = require("../models/customer");

// GET all customers
router.get("/", async (req, res) => {
    const customers = await Customer.find();
    res.json(customers);
});

// ADD customer
router.post("/", async (req, res) => {
    const customer = new Customer(req.body);
    await customer.save();
    res.json(customer);
});

// UPDATE
router.put("/:id", async (req, res) => {
    const updated = await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(updated);
});

// DELETE
router.delete("/:id", async (req, res) => {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

module.exports = router;