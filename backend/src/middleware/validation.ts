import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 1 }).withMessage('Mot de passe requis'),
  handleValidationErrors
];

// User validation rules
export const createUserValidation = [
  body('nom').isLength({ min: 2, max: 100 }).withMessage('Nom requis (2-100 caractères)'),
  body('email').isEmail().withMessage('Email invalide'),
  body('role').isIn(['ADMIN', 'CHEF']).withMessage('Rôle invalide'),
  handleValidationErrors
];

export const updateUserValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  body('nom').optional().isLength({ min: 2, max: 100 }).withMessage('Nom invalide (2-100 caractères)'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('role').optional().isIn(['ADMIN', 'CHEF']).withMessage('Rôle invalide'),
  handleValidationErrors
];

// Vehicle validation rules
export const createVehicleValidation = [
  body('marque').isLength({ min: 1, max: 100 }).withMessage('Marque requise (1-100 caractères)'),
  body('modele').isLength({ min: 1, max: 100 }).withMessage('Modèle requis (1-100 caractères)'),
  body('annee').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
  body('vin').optional().isLength({ max: 17 }).withMessage('VIN invalide (max 17 caractères)'),
  body('numero_plaque').optional().isLength({ max: 20 }).withMessage('Numéro de plaque invalide (max 20 caractères)'),
  body('responsable_id').isInt({ min: 1 }).withMessage('ID responsable invalide'),
  body('statut').optional().isIn(['ACTIVE', 'MAINTENANCE', 'RETIRED']).withMessage('Statut invalide'),
  handleValidationErrors
];

export const updateVehicleValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID véhicule invalide'),
  body('marque').optional().isLength({ min: 1, max: 100 }).withMessage('Marque invalide (1-100 caractères)'),
  body('modele').optional().isLength({ min: 1, max: 100 }).withMessage('Modèle invalide (1-100 caractères)'),
  body('annee').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
  body('vin').optional().isLength({ max: 17 }).withMessage('VIN invalide (max 17 caractères)'),
  body('numero_plaque').optional().isLength({ max: 20 }).withMessage('Numéro de plaque invalide (max 20 caractères)'),
  body('responsable_id').optional().isInt({ min: 1 }).withMessage('ID responsable invalide'),
  body('statut').optional().isIn(['ACTIVE', 'MAINTENANCE', 'RETIRED']).withMessage('Statut invalide'),
  handleValidationErrors
];

// Repair validation rules
export const createRepairValidation = [
  body('date_reparation').isISO8601().withMessage('Date de réparation invalide (format YYYY-MM-DD)'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description trop longue (max 1000 caractères)'),
  body('cout_total').optional().isFloat({ min: 0 }).withMessage('Coût total invalide'),
  body('statut').optional().isIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Statut invalide'),
  body('vehicule_id').isInt({ min: 1 }).withMessage('ID véhicule invalide'),
  handleValidationErrors
];

export const updateRepairValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID réparation invalide'),
  body('date_reparation').optional().isISO8601().withMessage('Date de réparation invalide (format YYYY-MM-DD)'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description trop longue (max 1000 caractères)'),
  body('cout_total').optional().isFloat({ min: 0 }).withMessage('Coût total invalide'),
  body('statut').optional().isIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Statut invalide'),
  handleValidationErrors
];

// Part validation rules
export const createPartValidation = [
  body('nom').isLength({ min: 1, max: 100 }).withMessage('Nom de pièce requis (1-100 caractères)'),
  body('reference').isLength({ min: 1, max: 100 }).withMessage('Référence requise (1-100 caractères)'),
  body('prix_unitaire').optional().isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('stock_actuel').optional().isInt({ min: 0 }).withMessage('Stock actuel invalide'),
  body('stock_minimum').optional().isInt({ min: 0 }).withMessage('Stock minimum invalide'),
  handleValidationErrors
];

export const updatePartValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID pièce invalide'),
  body('nom').optional().isLength({ min: 1, max: 100 }).withMessage('Nom de pièce invalide (1-100 caractères)'),
  body('reference').optional().isLength({ min: 1, max: 100 }).withMessage('Référence invalide (1-100 caractères)'),
  body('prix_unitaire').optional().isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('stock_actuel').optional().isInt({ min: 0 }).withMessage('Stock actuel invalide'),
  body('stock_minimum').optional().isInt({ min: 0 }).withMessage('Stock minimum invalide'),
  handleValidationErrors
];

// Repair-Part validation rules
export const addPartToRepairValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID réparation invalide'),
  body('piece_id').isInt({ min: 1 }).withMessage('ID pièce invalide'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide (minimum 1)'),
  body('prix_unitaire_utilise').optional().isFloat({ min: 0 }).withMessage('Prix unitaire utilisé invalide'),
  handleValidationErrors
];

// Generic ID validation
export const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  handleValidationErrors
];

// Pagination validation
export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Numéro de page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide (1-100)'),
  handleValidationErrors
];