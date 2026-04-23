const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/login", async (req, res) => {

  const { username, password } = req.body;

  const user = await User.findOne({ username, password });

  if (!user) {
    return res.status(401).json({ success: false });
  }

  res.json({
    success: true,
    role: user.role
  });

});

module.exports = router;