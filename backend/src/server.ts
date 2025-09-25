import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { testConnection, initializeDatabase } from "./config/database";

// Import des routes
import utilisateurRoutes from "./routes/usersroutes.js";
import vehiculeRoutes from "./routes/vehiculeroutes.js";
import pieceRoutes from "./routes/piecesroutes.js";
import reparationRoutes from "./routes/reparationroutes.js";
import carburantRoutes from "./routes/carburantroutes.js";
import authRoutes from "./routes/authroutes.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT ;

// Middlewares
app.use(cors());
app.use(express.json());

// Simple health check route
app.get("/", (_req, res) => {
  res.send(" Fleet Management Backend is running");
});

// Routes API
app.use("/api/users", utilisateurRoutes);
app.use("/api/vehicles", vehiculeRoutes);
app.use("/api/parts", pieceRoutes);
app.use("/api/repairs", reparationRoutes);
app.use("/api/fuel-records", carburantRoutes);
app.use("/api/auth", authRoutes);


// Start server + init DB
const startServer = async () => {
  try {
    console.log(" Testing database connection...");
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error(" Cannot start server: database connection failed");
      process.exit(1);
    }

    console.log(" Initializing database schema...");
    await initializeDatabase();

    //  On supprime le seedDatabase()
    // car maintenant les données viendront du frontend

    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
