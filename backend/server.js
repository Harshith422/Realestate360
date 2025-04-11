require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointments");
const marketRoutes = require("./routes/marketRoutes");

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Root endpoint handler
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Realestate360 API is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/auth",
      properties: "/properties",
      users: "/users",
      appointments: "/appointments",
      marketData: "/api/market-trends"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// API routes
app.use("/auth", authRoutes);
app.use("/properties", propertyRoutes);
app.use("/users", userRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/api", marketRoutes);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
