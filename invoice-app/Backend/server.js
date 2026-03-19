const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const invoiceRoutes = require("./routes/invoiceRoutes");

const customerRoutes = require("./routes/customerRoutes");







const app = express();

// Middleware
app.use(cors());
app.use(express.json());


app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);


// 🔗 MongoDB Connection (for now local)
mongoose.connect("mongodb+srv://cssrishab_db_user:ld1b2Yayp5lwGJiS@cluster0.ywmjtzj.mongodb.net/?appName=Cluster0")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("API is working 🚀");
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});