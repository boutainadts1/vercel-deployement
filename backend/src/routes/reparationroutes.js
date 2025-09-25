import { Router } from "express";
import { pool } from "../config/database";

const router = Router();





// ---------------------
// GET / → all repairs (with role/user filter + pieces + vehicle info)
// ---------------------
router.get("/", async (req, res) => {
  try {
    const { role, userId } = req.query;

    let query = `
      SELECT r.*, v.marque, v.modele, u.nom AS created_by_name
      FROM REPARATION r
      LEFT JOIN VEHICULE v ON r.vehicule_id = v.id_vehicule
      LEFT JOIN UTILISATEUR u ON r.created_by = u.id_utilisateur
    `;
    const params= [];

    if (role === "CHEF" && userId) {
      query += " WHERE r.created_by = ?";
      params.push(userId);
    }

    const [repairs] = await pool.query(query, params);

    // Attach pieces and vehicule info
    for (const repair of repairs) {
      const [pieces] = await pool.query(
        `SELECT rp.piece_id, rp.quantite, rp.prix_unitaire_utilise,
                p.nom AS piece_nom, p.reference AS piece_reference
         FROM REPARATION_PIECE rp
         JOIN PIECE p ON rp.piece_id = p.id_piece
         WHERE rp.reparation_id = ?`,
        [repair.id_reparation]
      );

      repair.pieces = pieces.map((p) => ({
        ...p,
        prix_unitaire_utilise: p.prix_unitaire_utilise != null ? Number(p.prix_unitaire_utilise) : null
      }));

      repair.vehicule_info = `${repair.marque} ${repair.modele} (#${repair.vehicule_id})`;
      repair.created_by_name = repair.created_by_name || "Inconnu";
    }

    res.json(repairs);

  } catch (err) {
    console.error("❌ Erreur récupération réparations:", err);
    res.status(500).json({ message: "Erreur récupération réparations" });
  }
});

// ---------------------
// GET /completed → completed repairs only (with vehicle info + pieces + creator)
// ---------------------
router.get("/completed", async (req, res) => {
  try {
    const { vehicleId } = req.query;

    let query = `
      SELECT r.*, v.marque, v.modele, u.nom AS created_by_name
      FROM REPARATION r
      LEFT JOIN VEHICULE v ON r.vehicule_id = v.id_vehicule
      LEFT JOIN UTILISATEUR u ON r.created_by = u.id_utilisateur
      WHERE r.statut = 'COMPLETED'
    `;
    const params = [];
    if (vehicleId) {
      query += " AND r.vehicule_id = ?";
      params.push(vehicleId);
    }

    const [repairs] = await pool.query(query, params);

    for (const repair of repairs) {
      const [pieces] = await pool.query(
        `SELECT rp.piece_id, rp.quantite, rp.prix_unitaire_utilise,
                p.nom AS piece_nom, p.reference AS piece_reference
         FROM REPARATION_PIECE rp
         JOIN PIECE p ON rp.piece_id = p.id_piece
         WHERE rp.reparation_id = ?`,
        [repair.id_reparation]
      );

      repair.pieces = pieces.map((p ) => ({
        ...p,
        prix_unitaire_utilise: p.prix_unitaire_utilise != null ? Number(p.prix_unitaire_utilise) : null
      }));

      repair.vehicule_info = `${repair.marque} ${repair.modele} (#${repair.vehicule_id})`;
      repair.created_by_name = repair.created_by_name || "Inconnu";
    }

    res.json(repairs);

  } catch (err) {
    console.error("❌ Erreur récupération réparations terminées:", err);
    res.status(500).json({ message: "Erreur récupération réparations terminées" });
  }
});

// Modifier réparation avec gestion des pièces
// Modifier réparation avec gestion des pièces
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
    }

    // Séparer les pièces des autres champs
    const { pieces, ...repairUpdates } = updates;

    // 1️⃣ Mettre à jour les champs de la réparation
    if (Object.keys(repairUpdates).length > 0) {
      const fields = Object.keys(repairUpdates)
        .map((key) => `${key}=?`)
        .join(", ");
      const values = Object.values(repairUpdates);

      await pool.query(
        `UPDATE REPARATION SET ${fields} WHERE id_reparation=?`,
        [...values, id]
      );
    }

    // 2️⃣ Mettre à jour les pièces si fournies
    if (pieces && Array.isArray(pieces)) {
      // Supprimer les anciennes pièces pour cette réparation
      await pool.query(`DELETE FROM REPARATION_PIECE WHERE reparation_id=?`, [id]);

      // Insérer les nouvelles pièces
      for (const p of pieces) {
        await pool.query(
          `INSERT INTO REPARATION_PIECE (reparation_id, piece_id, quantite, prix_unitaire_utilise)
           VALUES (?, ?, ?, ?)`,
          [id, p.piece_id, p.quantite, p.prix_unitaire_utilise]
        );
      }
    }

    // 3️⃣ Optionnel : recalculer cout_total si pieces ont changé
    let totalCost = repairUpdates.cout_total ?? 0;
    if (pieces && pieces.length > 0) {
      totalCost = pieces.reduce((sum, p) => sum + (p.prix_unitaire_utilise || 0) * p.quantite, 0);
    }

    // 4️⃣ Retourner la réparation mise à jour (tu peux enrichir avec les pièces si besoin)
    res.json({
      id_reparation: id,
      ...repairUpdates,
      cout_total: totalCost,
      pieces: pieces || [],
    });
  } catch (err) {
    console.error("❌ Erreur modification réparation:", err);
    res.status(500).json({ message: "Erreur modification réparation" });
  }
});



// Supprimer réparation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM REPARATION WHERE id_reparation=?", [id]);
    res.json({ message: "Réparation supprimée" });
  } catch (err) {
    console.error(" Erreur suppression réparation:", err);
    res.status(500).json({ message: "Erreur suppression réparation" });
  }
});



router.post("/", async (req, res) => {
  try {
    const {
      date_reparation,
      description,
      cout_total,
      statut,
      vehicule_id,
      created_by
    } = req.body;

    const [result] = await pool.query(
      "INSERT INTO REPARATION (date_reparation, description, cout_total, statut, vehicule_id, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [date_reparation, description, cout_total, statut, vehicule_id, created_by]
    );

    res.json({ id_reparation: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur ajout reparation" });
  }
});

export default router;
