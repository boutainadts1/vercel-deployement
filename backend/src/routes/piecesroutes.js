import { Router } from "express";
import { pool } from "../config/database";

const router = Router();

// ======================
// Ajouter une pièce
// ======================
router.post("/", async (req, res) => {
  try {
    const { nom, reference, prix_unitaire, stock_actuel, stock_minimum } = req.body;
    const [result] = await pool.query(
      "INSERT INTO PIECE (nom, reference, prix_unitaire, stock_actuel, stock_minimum) VALUES (?, ?, ?, ?, ?)",
      [nom, reference, prix_unitaire, stock_actuel, stock_minimum]
    );
    res.json({ id_piece: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur ajout pièce" });
  }
});

// ======================
// Liste pièces
// ======================
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM PIECE");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur récupération pièces" });
  }
});

// ======================
// Mettre à jour une pièce
// ======================
router.put("/:id", async (req, res) => {
  try {
    const partId = req.params.id;
    const { nom, reference, prix_unitaire, stock_actuel, stock_minimum } = req.body;

    await pool.query(
      "UPDATE PIECE SET nom = ?, reference = ?, prix_unitaire = ?, stock_actuel = ?, stock_minimum = ? WHERE id_piece = ?",
      [nom, reference, prix_unitaire, stock_actuel, stock_minimum, partId]
    );

    res.json({ id_piece: Number(partId), ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur mise à jour pièce" });
  }
});

// ======================
// Supprimer une pièce
// ======================
router.delete("/:id", async (req, res) => {
  try {
    const partId = req.params.id;
    await pool.query("DELETE FROM PIECE WHERE id_piece = ?", [partId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur suppression pièce" });
  }
});

export default router;
