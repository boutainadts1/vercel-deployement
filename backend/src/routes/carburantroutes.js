import { Router } from "express";
import { pool } from "../config/database";

const router = Router();

// Ajouter consommation carburant
router.post("/", async (req, res) => {
  try {
    const { id_vehicule, date, litres, cout } = req.body;
    const [result] = await pool.query(
      "INSERT INTO CONSOMMATION_CARBURANT (id_vehicule, date, litres, cout) VALUES (?, ?, ?, ?)",
      [id_vehicule, date, litres, cout]
    );
    res.json({ id_consommation: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ message: "Erreur ajout consommation carburant" });
  }
});

//  Liste consommations
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM CONSOMMATION_CARBURANT");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération consommations" });
  }
});

export default router;
