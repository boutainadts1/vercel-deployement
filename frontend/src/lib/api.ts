// src/api/api.ts
import { User, Vehicle, Repair, Part,  FuelRecord, MonthlyVehicleStats, RepairRequest } from '@/types';

const API_URL = "http://localhost:3001/api"; 


// ======================
// AUTHENTIFICATION
// ======================

// Connexion
export interface LoginResponse {
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<LoginResponse | null> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }) 
  });

  if (!res.ok) return null;

  const data: LoginResponse = await res.json();
  return data;
};



// Déconnexion
export const logout = async (): Promise<void> => {
  await fetch(`${API_URL}/auth/logout`, { method: "POST" });
};

// Récupérer l’utilisateur courant
export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem("token"); // récupère ton token du login
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return null;
  return res.json();
};

// ======================
// USERS
// ======================
export const getUsers = async (): Promise<User[]> => {
  const res = await fetch(`${API_URL}/users`);
  return res.json();
};

export const createUser = async (userData: Omit<User, "id_utilisateur">): Promise<User> => {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  return res.json();
};

export const updateUser = async (userId: number, userData: Partial<User>): Promise<User> => {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  return res.json();
};

export const deleteUser = async (userId: number): Promise<void> => {
  await fetch(`${API_URL}/users/${userId}`, { method: "DELETE" });
};

// ======================
// VEHICLES
// ======================
export const getVehicles = async (userId, role) => {
  const url = `${API_URL}/vehicles/${userId}/${role}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur récupération véhicules");
  return res.json();
};




export const createVehicle = async (vehicleData: Omit<Vehicle, "id_vehicule">): Promise<Vehicle> => {
  const res = await fetch(`${API_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicleData)
  });
  return res.json();
};

export const updateVehicle = async (vehicleId: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
  const res = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicleData)
  });
  return res.json();
};

export const deleteVehicle = async (vehicleId: number): Promise<void> => {
  await fetch(`${API_URL}/vehicles/${vehicleId}`, { method: "DELETE" });
};

// ======================
// PARTS
// ======================
export const getParts = async (): Promise<Part[]> => {
  const res = await fetch(`${API_URL}/parts`);
  return res.json();
};

export const createPart = async (partData: Omit<Part, "id_piece">): Promise<Part> => {
  const res = await fetch(`${API_URL}/parts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partData),
  });
  return res.json();
};

export const updatePart = async (partId: number, partData: Partial<Part>): Promise<Part> => {
  const res = await fetch(`${API_URL}/parts/${partId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partData),
  });
  return res.json();
};

export const deletePart = async (partId: number): Promise<void> => {
  await fetch(`${API_URL}/parts/${partId}`, { method: "DELETE" });
};


// ======================
// REPAIRS
// ======================
// Récupérer toutes les réparations
export const getRepairs = async (userId?: number, role?: string): Promise<Repair[]> => {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId.toString());
  if (role) params.append("role", role);

  const res = await fetch(`${API_URL}/repairs?${params.toString()}`);
  if (!res.ok) throw new Error("Erreur récupération réparations");
  return res.json();
};


// Créer une réparation
// Type pour créer une réparation (sans id_reparation et sans reparation_id dans les pièces)
// Types à ajouter dans api.ts ou types.ts
export type NewRepairPart = {
  piece_id: number;
  quantite: number;
  prix_unitaire_utilise?: number;
};

export type RepairPart = NewRepairPart & {
  reparation_id: number; // obligatoire pour update
};

export type NewRepair = Omit<Repair, "id_reparation" | "pieces"> & {
  pieces?: NewRepairPart[];
};


export const createRepair = async (
  repairData: NewRepair,
  role?: string
): Promise<Repair> => {
  const dataToSend = {
    ...repairData,
    statut: role === "ADMIN" ? repairData.statut : "PLANNED",
  };

  const res = await fetch(`${API_URL}/repairs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataToSend),
  });

  if (!res.ok) throw new Error("Erreur création réparation");
  return res.json();
};


// Mettre à jour une réparation
export const updateRepair = async (
  repairId: number,
  repairData: Partial<Repair>
): Promise<Repair> => {
  const res = await fetch(`${API_URL}/repairs/${repairId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(repairData),
  });
  if (!res.ok) throw new Error("Erreur mise à jour réparation");
  return res.json();
};

export const updateRepairParts = async (
  repairId: number,
  parts: { piece_id: number; quantite: number; prix_unitaire_utilise: number }[]
) => {
  const res = await fetch(`${API_URL}/repairs/${repairId}/parts`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parts.map(p => ({ ...p, reparation_id: repairId }))),
  });
  if (!res.ok) throw new Error("Erreur mise à jour pièces réparation");
  return res.json();
};

// Supprimer une réparation
export const deleteRepair = async (repairId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/repairs/${repairId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erreur suppression réparation");
};

// Récupérer uniquement les réparations terminées
export const getCompletedRepairs = async (vehicleId?: number): Promise<Repair[]> => {
  const params = new URLSearchParams();
  if (vehicleId !== undefined) params.append("vehicleId", vehicleId.toString());
  const url = `${API_URL}/repairs/completed${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur récupération réparations terminées");
  return res.json();
};


// ======================
// FUEL RECORDS
// ======================
export const getFuelRecords = async (vehicleId?: number): Promise<FuelRecord[]> => {
  const url = vehicleId ? `${API_URL}/fuel?vehicleId=${vehicleId}` : `${API_URL}/fuel`;
  const res = await fetch(url);
  return res.json();
};

export const createFuelRecord = async (
  fuelData: Omit<FuelRecord, "id_carburant">
): Promise<FuelRecord> => {
  const res = await fetch(`${API_URL}/fuel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fuelData),
  });
  return res.json();
};

// ======================
// MONTHLY STATS
// ======================
export const getMonthlyVehicleStats = async (
  year?: number,
  month?: number,
  vehicleId?: number
): Promise<MonthlyVehicleStats[]> => {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (month) params.append("month", month.toString());
  if (vehicleId) params.append("vehicleId", vehicleId.toString());

  const res = await fetch(`${API_URL}/stats?${params.toString()}`);
  return res.json();
};
