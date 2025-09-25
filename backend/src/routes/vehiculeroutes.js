import { Router } from "express";
import { pool } from "../config/database";

const router = Router();


// GET /vehicles/:userId/:role
router.get("/:userId/:role", async (req, res) => {
  try {
    const { userId, role } = req.params;

    let query = "SELECT * FROM VEHICULE";
    const params = [];

    const userIdNum = Number(userId);

    // Si ce n'est pas l'admin, filtrer par responsable_id
    if (role !== "ADMIN" && userIdNum) {
      query += " WHERE responsable_id = ?";
      params.push(userIdNum);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur récupération véhicules" });
  }
});


// Récupérer un véhicule par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM VEHICULE WHERE id_vehicule = ?",
      [id]
    );

    if ((rows ).length === 0) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }

    res.json((rows )[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur récupération véhicule" });
  }
});

// Créer véhicule
router.post("/", async (req, res) => {
  try {
    const {
      marque,
      modele,
      responsable_id,
      index_debut_mois,
      index_fin_mois,
      total_carburant_prix,
      total_maintenance_prix
    } = req.body;

    if (!marque || !modele) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const [result] = await pool.query(
      `INSERT INTO VEHICULE 
      (marque, modele, responsable_id, index_debut_mois, index_fin_mois, total_carburant_prix, total_maintenance_prix) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        marque,
        modele,
        responsable_id ?? null,
        index_debut_mois ?? 0,
        index_fin_mois ?? 0,
        total_carburant_prix ?? 0,
        total_maintenance_prix ?? 0
      ]
    );

    res.status(201).json({
      id_vehicule: (result ).insertId,
      marque,
      modele,
      responsable_id,
      index_debut_mois,
      index_fin_mois,
      total_carburant_prix,
      total_maintenance_prix
    });
  } catch (err) {
    console.error(" Erreur création véhicule:", err);
    res.status(500).json({ message: "Erreur création véhicule" });
  }
});

// Modifier véhicule (update partiel)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
    }

    // construire dynamiquement la requête
    const fields = Object.keys(updates).map(key => `${key}=?`).join(", ");
    const values = Object.values(updates);

    await pool.query(
      `UPDATE VEHICULE SET ${fields} WHERE id_vehicule=?`,
      [...values, id]
    );

    res.json({ id_vehicule: id, ...updates });
  } catch (err) {
    console.error(" Erreur modification véhicule:", err);
    res.status(500).json({ message: "Erreur modification véhicule" });
  }
});

// Supprimer véhicule
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM VEHICULE WHERE id_vehicule=?", [id]);
    res.json({ message: "Véhicule supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur suppression véhicule" });
  }
});

export default router;
