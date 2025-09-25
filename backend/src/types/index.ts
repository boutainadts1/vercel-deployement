export interface User {
  id_utilisateur: number;
  nom: string;
  email: string;
  mot_de_passe?: string;
  role: 'ADMIN' | 'CHEF';
  created_at?: Date;
  updated_at?: Date;
  is_active?: boolean;
  last_login?: Date;
}

export interface Vehicle {
  id_vehicule: number;
  marque: string;
  modele: string;
  annee?: number;
  vin?: string;
  numero_plaque?: string;
  responsable_id: number;
  statut: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
  created_at?: Date;
  updated_at?: Date;
  responsable_nom?: string;
}

export interface Repair {
  id_reparation: number;
  date_reparation: string;
  description?: string;
  cout_total?: number;
  statut: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  vehicule_id: number;
  created_by: number;
  created_at?: Date;
  completed_at?: Date;
  vehicule_info?: string;
  created_by_name?: string;
}

export interface Part {
  id_piece: number;
  nom: string;
  reference: string;
  prix_unitaire?: number;
  stock_actuel?: number;
  stock_minimum?: number;
  created_at?: Date;
}

export interface RepairPart {
  reparation_id: number;
  piece_id: number;
  quantite: number;
  prix_unitaire_utilise?: number;
  piece_nom?: string;
  piece_reference?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'CHEF';
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}