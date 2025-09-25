import { Router } from "express";
import { pool } from "../config/database";

const router = Router();




// 📋 Liste utilisateurs
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM UTILISATEUR");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération utilisateurs" });
  }
});

// ➕ Créer utilisateur
router.post("/", async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const [result] = await pool.query(
      "INSERT INTO UTILISATEUR (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)",
      [nom, email, mot_de_passe, role]
    );

    res.status(201).json({
      id_utilisateur: (result ).insertId,
      nom,
      email,
      mot_de_passe,
      role
    });
  } catch (err) {
    console.error("❌ Erreur création utilisateur:", err);
    res.status(500).json({ message: "Erreur création utilisateur" });
  }
});

// 🔎 Récupérer un utilisateur par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM UTILISATEUR WHERE id_utilisateur = ?",
      [id]
    );

    if ((rows ).length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json((rows )[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur récupération utilisateur" });
  }
});

// ✏️ Modifier utilisateur (update partiel)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // peut contenir seulement certains champs

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
    }

    // construire dynamiquement la requête
    const fields = Object.keys(updates).map(key => `${key}=?`).join(", ");
    const values = Object.values(updates);

    await pool.query(
      `UPDATE UTILISATEUR SET ${fields} WHERE id_utilisateur=?`,
      [...values, id]
    );

    res.json({ id_utilisateur: id, ...updates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur modification utilisateur" });
  }
});


// ❌ Supprimer utilisateur
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM UTILISATEUR WHERE id_utilisateur = ?", [id]);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur suppression utilisateur" });
  }
});

export default router;
