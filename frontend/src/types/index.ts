export interface User {
  id_utilisateur: number;
  nom: string;
  email: string;
  mot_de_passe?: string;
  role: 'ADMIN' | 'CHEF';
}

export interface Vehicle {
  id_vehicule: number;
  marque: string;
  modele: string;
  responsable_id: number;
  responsable_nom?: string;
  index_debut_mois?: number;
  index_fin_mois?: number;
  total_carburant_prix?: number;
  total_maintenance_prix?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Repair {
  id_reparation: number;
  date_reparation: string;
  description: string;
  vehicule_id: number;
  vehicule_info?: string;
  cout_total?: number;
  statut?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_by?: number;
  created_by_name?: string;
  pieces?: RepairPart[];
}

export interface Part {
  id_piece: number;
  nom: string;
  reference: string;
  prix_unitaire?: number;
  stock_actuel?: number;
  stock_minimum?: number;
}

export interface RepairPart {
  reparation_id: number;
  piece_id: number;
  quantite: number;
  prix_unitaire_utilise?: number;
  piece_nom?: string;
  piece_reference?: string;
}

export interface FuelRecord {
  id_carburant: number;
  vehicule_id: number;
  date_ravitaillement: string;
  quantite_litres: number;
  prix_unitaire: number;
  prix_total: number;
  kilometrage: number;
  created_by: number;
}

export interface MonthlyVehicleStats {
  vehicule_id: number;
  vehicule_info: string;
  mois: number;
  annee: number;
  total_reparations: number;
  cout_total_reparations: number;
  total_carburant: number;
  cout_total_carburant: number;
  kilometrage_debut?: number;
  kilometrage_fin?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}


export interface RepairRequest {
  id_reparation?: number; // optional for creation
  date_reparation?: string;
  description?: string;
  vehicule_id?: number;
  vehicule_info?: string;
  cout_total?: number;
  statut?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_by?: number;
  created_by_name?: string;
  selectedParts?: { piece_id: number; quantite: number }[];
}
