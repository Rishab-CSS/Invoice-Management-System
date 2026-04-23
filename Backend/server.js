require("dotenv").config();


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const invoiceRoutes = require("./routes/invoiceRoutes");

const customerRoutes = require("./routes/customerRoutes");

const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");

const purchaseInvoiceRoutes = require("./routes/purchaseInvoiceRoutes");

const paymentRoutes = require("./routes/paymentRoutes");

const productRoutes = require("./routes/productRoutes");

const productProcessRoutes = require("./routes/productProcessRoutes");

const routeCardRoutes = require("./routes/routeCardRoutes");

const employeeRoutes = require("./routes/employeeRoutes");

const productionRoutes = require("./routes/productionTrackingRoutes");

const authRoutes = require("./routes/authRoutes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// ✅ ADD HERE
app.get("/ping", (req, res) => {
  res.send("alive");
});


app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/purchase-invoices", purchaseInvoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/processes", productProcessRoutes);
app.use("/api/route-cards", routeCardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/auth", authRoutes);


const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

// 🔗 MongoDB Connection (for now local)
mongoose.connect(process.env.MONGO_URI)  



.then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("FULL ERROR:", err));

// Test route
app.get("/", (req, res) => {
  res.send("API is working 🚀");
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});