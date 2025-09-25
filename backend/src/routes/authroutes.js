import { Router } from "express";
import { pool } from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// === LOGIN ===
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Récupérer l'utilisateur depuis la base
    const [rows] = await pool.query(
      "SELECT * FROM UTILISATEUR WHERE email = ?",
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Comparer le mot de passe en clair
    if (password !== user.mot_de_passe) {     //ill see omb3d if ad crypted passwd or not :)
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // Supprimer le mot de passe avant d’envoyer la réponse
    delete user.mot_de_passe;

    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded; // id, email, role
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// === /me route ===
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id_utilisateur, email, nom, role FROM UTILISATEUR WHERE id_utilisateur = ?",
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === LOGOUT ===
router.post("/logout", (req, res) => {
  // le frontend peut juste supprimer le token du localStorage
  res.json({ message: "Logged out" });
});

export default router;
