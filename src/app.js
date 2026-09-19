require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const FRONTEND_DIST = path.join(__dirname, "../frontend/dist");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/addresses", require("./routes/addresses"));
app.use("/api/receipts", require("./routes/receipts"));
app.use("/api/admin", require("./routes/admin"));

// Serve the built React frontend (production)
app.use(express.static(FRONTEND_DIST));
app.get("/", (req, res, next) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) next();
  });
});
app.get("/*splat", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) next();
  });
});

app.use(errorHandler);

module.exports = app;