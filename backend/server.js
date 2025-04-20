require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/auth-routes");
const passportSetup = require("./configs/passport-setup");
const { connectDB } = require("./configs/db-conn");
const User = require("./models/User.js");
const userRoutes = require("./routes/user-routes");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const MongoStore = require("connect-mongo"); // Import MongoStore

const app = express();

// Get the frontend URL from environment variable or fallback to localhost for development
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
console.log(`Frontend URL: ${FRONTEND_URL}`);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// Use more secure cookie settings in production
app.use(
  session({
    secret: process.env.COOKIE_KEY,
    resave: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // MongoDB URI from your .env file
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // SameSite setting for cross-site cookies
    },
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Health check endpoint for Azure
app.get("/api/health", (req, res) => {
  console.log("Health check request received");
  res.json({ status: "healthy", message: "API is running" });
});

app.get("/api", (req, res) => {
  console.log("API root request received");
  res.json({ message: "Hello from the backend!" });
});

// Azure Static Web Apps expects a module.exports
if (process.env.NODE_ENV !== "production") {
  console.log("Running in development mode");
}

if (process.env.NODE_ENV === "production") {
  console.log("Running in production mode");
  module.exports = app;
} else {
  // For local development, start the server
  const PORT = process.env.PORT || 5000;
  try {
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
      try {
        await connectDB();
        console.log("Connected to the database");
      } catch (dbError) {
        console.error("Database connection failed:", dbError);
      }
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
  
}
