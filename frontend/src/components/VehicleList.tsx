import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Car, Gauge, Euro, Lock, Download } from 'lucide-react';
import { getVehicles, getUsers, createVehicle, updateVehicle } from '@/lib/api';
import { Vehicle, User } from '@/types';
import * as XLSX from 'xlsx';

interface VehicleListProps {
  currentUser: User;
}

export default function VehicleList({ currentUser }: VehicleListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    responsable_id: 0,
    index_debut_mois: 0,
    index_fin_mois: 0,
    total_carburant_prix: 0,
    total_maintenance_prix: 0
  });

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      if (!currentUser || !currentUser.id_utilisateur || !currentUser.role) {
        console.warn(" currentUser not ready yet:", currentUser);
        return;
      }

      const [vehiclesData, usersData] = await Promise.all([
        getVehicles(currentUser.id_utilisateur, currentUser.role),
        getUsers()
      ]);

      console.log("🚗 Vehicles from API:", vehiclesData);
      setVehicles(vehiclesData);
      setUsers(usersData.filter(u => u.role === 'CHEF'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      marque: '',
      modele: '',
      responsable_id: 0,
      index_debut_mois: 0,
      index_fin_mois: 0,
      total_carburant_prix: 0,
      total_maintenance_prix: 0,
    });
    setEditingVehicle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.marque.trim()) {
      setError("La marque est requise");
      return;
    }
    if (!formData.modele.trim()) {
      setError("Le modèle est requis");
      return;
    }
    if (!formData.responsable_id || formData.responsable_id <= 0) {
      setError("Un responsable est requis");
      return;
    }

    try {
      if (editingVehicle) {
        const updateData: Partial<Vehicle> = {};
        if (formData.marque !== editingVehicle.marque) updateData.marque = formData.marque;
        if (formData.modele !== editingVehicle.modele) updateData.modele = formData.modele;
        if (formData.responsable_id !== editingVehicle.responsable_id) updateData.responsable_id = formData.responsable_id;
        if (formData.index_debut_mois !== editingVehicle.index_debut_mois) updateData.index_debut_mois = Number(formData.index_debut_mois);
        if (formData.index_fin_mois !== editingVehicle.index_fin_mois) updateData.index_fin_mois = Number(formData.index_fin_mois);
        if (formData.total_carburant_prix !== editingVehicle.total_carburant_prix) updateData.total_carburant_prix = Number(formData.total_carburant_prix);
        if (formData.total_maintenance_prix !== editingVehicle.total_maintenance_prix) updateData.total_maintenance_prix = Number(formData.total_maintenance_prix);

        if (Object.keys(updateData).length === 0) {
          setError("Aucun changement détecté");
          return;
        }

        await updateVehicle(editingVehicle.id_vehicule, updateData);
        setSuccess(`Véhicule ${formData.marque} ${formData.modele} modifié avec succès !`);
      } else {
        const newVehicle = {
          marque: formData.marque,
          modele: formData.modele,
          responsable_id: formData.responsable_id,
          index_debut_mois: Number(formData.index_debut_mois),
          index_fin_mois: Number(formData.index_fin_mois),
          total_carburant_prix: Number(formData.total_carburant_prix),
          total_maintenance_prix: Number(formData.total_maintenance_prix),
        };
        await createVehicle(newVehicle);
        setSuccess(`Véhicule ${formData.marque} ${formData.modele} créé avec succès !`);
      }

      setDialogOpen(false);
      resetForm();
      loadData();

      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError("Erreur lors de la sauvegarde du véhicule");
    }
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      marque: vehicle.marque,
      modele: vehicle.modele,
      responsable_id: vehicle.responsable_id,
      index_debut_mois: vehicle.index_debut_mois || 0,
      index_fin_mois: vehicle.index_fin_mois || 0,
      total_carburant_prix: Number(vehicle.total_carburant_prix || 0),
      total_maintenance_prix: Number(vehicle.total_maintenance_prix || 0)
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingVehicle(null);
    setFormData({ 
      marque: '', 
      modele: '', 
      responsable_id: 0,
      index_debut_mois: 0,
      index_fin_mois: 0,
      total_carburant_prix: 0,
      total_maintenance_prix: 0
    });
    setDialogOpen(true);
  };

  const exportToExcel = (mode: "all" | "month") => {
  let exportData = vehicles;

  if (mode === "month") {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    exportData = vehicles.filter((v) => {
      if (!v.updated_at) return false;
      const updatedDate = new Date(v.updated_at);
      return (
        updatedDate.getMonth() === currentMonth &&
        updatedDate.getFullYear() === currentYear
      );
    });
  }

  const rows = exportData.map((vehicle, index) => {
    const updatedDate = vehicle.updated_at ? new Date(vehicle.updated_at) : null;
    const monthStr = updatedDate ? updatedDate.getMonth() + 1 : ''; 
    const yearStr = updatedDate ? updatedDate.getFullYear() : '';

    // 🔹 Récupération du nom du responsable depuis la table users
    const responsable = users.find(u => u.id_utilisateur === vehicle.responsable_id);
    const responsableNom = responsable ? responsable.nom : 'Non assigné';

    return {
      'N°': index + 1,
      'Mois': monthStr,
      'Année': yearStr,
      'ID Véhicule': vehicle.id_vehicule,
      'Marque': vehicle.marque,
      'Modèle': vehicle.modele,
      'Responsable': responsableNom,
      'Index Début (km)': vehicle.index_debut_mois || 0,
      'Index Fin (km)': vehicle.index_fin_mois || 0,
      'Distance Parcourue (km)': (vehicle.index_fin_mois || 0) - (vehicle.index_debut_mois || 0),
      'Coût Carburant (DA)': Number(vehicle.total_carburant_prix || 0).toFixed(2),
      'Coût Maintenance (DA)': Number(vehicle.total_maintenance_prix || 0).toFixed(2),
      'Coût Total (DA)': (
        Number(vehicle.total_carburant_prix || 0) +
        Number(vehicle.total_maintenance_prix || 0)
      ).toFixed(2),
    };
  });

  const totalCarburant = exportData.reduce((sum, v) => sum + Number(v.total_carburant_prix || 0), 0);
  const totalMaintenance = exportData.reduce((sum, v) => sum + Number(v.total_maintenance_prix || 0), 0);
  const totalDistance = exportData.reduce(
    (sum, v) => sum + ((v.index_fin_mois || 0) - (v.index_debut_mois || 0)),
    0
  );

  rows.push({
    'N°': 0,
    'Mois': '',
    'Année': '',
    'ID Véhicule': 0,
    'Marque': '',
    'Modèle': '',
    'Responsable': 'TOTAL',
    'Index Début (km)': 0,
    'Index Fin (km)': 0,
    'Distance Parcourue (km)': totalDistance,
    'Coût Carburant (DA)': totalCarburant.toFixed(2),
    'Coût Maintenance (DA)': totalMaintenance.toFixed(2),
    'Coût Total (DA)': (totalCarburant + totalMaintenance).toFixed(2),
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Véhicules');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = mode === "all"
    ? `vehicules_tous_${dateStr}.xlsx`
    : `vehicules_mois_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
};


  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  const canCreateVehicle = currentUser.role === 'ADMIN';
  const canEditVehicle = (vehicle: Vehicle) => {
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'CHEF') return vehicle.responsable_id === currentUser.id_utilisateur;
    return false;
  };
  const isRestrictedEdit = currentUser.role === 'CHEF';

  // Filtrage pour recherche
  const filteredVehicles = vehicles.filter((vehicle) => {
  const query = searchQuery.toLowerCase();

  // 🔹 Récupération du nom du responsable depuis users
  const responsable = users.find(u => u.id_utilisateur === vehicle.responsable_id);
  const responsableNom = responsable ? responsable.nom : '';

  return (
    vehicle.marque?.toLowerCase().includes(query) ||
    vehicle.modele?.toLowerCase().includes(query) ||
    responsableNom.toLowerCase().includes(query)
  );
});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Véhicules</h2>
          <p className="text-gray-600">
            {currentUser.role === 'ADMIN' 
              ? 'Gérez tous les véhicules de la flotte'
              : 'Gérez vos véhicules assignés'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportToExcel("all")} disabled={vehicles.length === 0}>
            <Download className="w-4 h-4 mr-2" />Exporter Tout
          </Button>
          <Button variant="outline" onClick={() => exportToExcel("month")} disabled={vehicles.length === 0}>
            <Download className="w-4 h-4 mr-2" />Exporter Mois en cours
          </Button>
        </div>
      </div>

      {/*  Champ de recherche */}
      <div className="my-4">
        <Input
          placeholder="Rechercher par marque, modèle ou responsable..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => {
  // 🔹 Récupération du nom du responsable depuis la table users
  const responsable = users.find(u => u.id_utilisateur === vehicle.responsable_id);
  const responsableNom = responsable ? responsable.nom : 'Non assigné';

  return (
    <Card key={vehicle.id_vehicule} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">{vehicle.marque}</CardTitle>
          </div>
          {canEditVehicle(vehicle) && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(vehicle)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
                  </DialogTitle>
                  <DialogDescription>
                    {isRestrictedEdit && editingVehicle 
                      ? 'En tant que chef, vous ne pouvez modifier que les index de début et fin de mois'
                      : 'Remplissez les informations du véhicule'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marque">Marque</Label>
                      <Input
                        id="marque"
                        value={formData.marque}
                        onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                        required
                        disabled={isRestrictedEdit}
                      />
                      {isRestrictedEdit && <Lock className="w-4 h-4 text-gray-400 inline ml-2" />}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modele">Modèle</Label>
                      <Input
                        id="modele"
                        value={formData.modele}
                        onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                        required
                        disabled={isRestrictedEdit}
                      />
                      {isRestrictedEdit && <Lock className="w-4 h-4 text-gray-400 inline ml-2" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Select
                      value={formData.responsable_id.toString()}
                      onValueChange={(value) => setFormData({ ...formData, responsable_id: parseInt(value) })}
                      disabled={isRestrictedEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id_utilisateur} value={user.id_utilisateur.toString()}>
                            {user.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isRestrictedEdit && <Lock className="w-4 h-4 text-gray-400 inline ml-2" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="index_debut" className="flex items-center gap-2">
                        Index début de mois (km)
                        {!isRestrictedEdit && <span className="text-green-600">✓</span>}
                      </Label>
                      <Input
                        id="index_debut"
                        type="number"
                        value={formData.index_debut_mois}
                        onChange={(e) => setFormData({ ...formData, index_debut_mois: parseInt(e.target.value) || 0 })}
                        className={isRestrictedEdit ? "border-green-500 focus:border-green-600" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="index_fin" className="flex items-center gap-2">
                        Index fin de mois (km)
                        {!isRestrictedEdit && <span className="text-green-600">✓</span>}
                      </Label>
                      <Input
                        id="index_fin"
                        type="number"
                        value={formData.index_fin_mois}
                        onChange={(e) => setFormData({ ...formData, index_fin_mois: parseInt(e.target.value) || 0 })}
                        className={isRestrictedEdit ? "border-green-500 focus:border-green-600" : ""}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carburant_prix">Total carburant (DA)</Label>
                      <Input
                        id="carburant_prix"
                        type="number"
                        step="0.01"
                        value={formData.total_carburant_prix}
                        onChange={(e) => setFormData({ ...formData, total_carburant_prix: parseFloat(e.target.value) || 0 })}
                        disabled={isRestrictedEdit}
                      />
                      {isRestrictedEdit && <Lock className="w-4 h-4 text-gray-400 inline ml-2" />}
                    </div>
                    <div className="space-y-2">
  <Label htmlFor="maintenance_prix">Total maintenance (DA)</Label>
  <Input
    id="maintenance_prix"
    type="number"
    step="0.01"
    value={formData.total_maintenance_prix}
    onChange={(e) => setFormData({ ...formData, total_maintenance_prix: parseFloat(e.target.value) || 0 })}
    disabled // 🔒 on bloque l'édition pour tout le monde
  />
  <Lock className="w-4 h-4 text-gray-400 inline ml-2" />
</div>

                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingVehicle ? 'Modifier' : 'Ajouter'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <CardDescription>{vehicle.modele}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ID:</span>
            <Badge variant="secondary">#{vehicle.id_vehicule}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Responsable:</span>
            <span className="text-sm font-medium">{responsableNom}</span> {/* 🔹 ici */}
          </div>
          
          {/* Kilométrage Section */}
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 mb-2">
              <Gauge className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Kilométrage</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Début:</span>
                <div className="font-medium">{vehicle.index_debut_mois?.toLocaleString() || 0} km</div>
              </div>
              <div>
                <span className="text-gray-500">Fin:</span>
                <div className="font-medium">{vehicle.index_fin_mois?.toLocaleString() || 0} km</div>
              </div>
            </div>
            <div className="mt-1">
              <span className="text-gray-500 text-xs">Distance parcourue:</span>
              <div className="font-medium text-sm text-blue-600">
                {((vehicle.index_fin_mois || 0) - (vehicle.index_debut_mois || 0)).toLocaleString()} km
              </div>
            </div>
          </div>

          {/* Costs Section */}
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Coûts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Carburant:</span>
                <div className="font-medium text-green-600">
                  {Number(vehicle.total_carburant_prix || 0).toFixed(2)} DA
                </div>
              </div>
              <div>
                <span className="text-gray-500">Maintenance:</span>
                <div className="font-medium text-orange-600">
                  {Number(vehicle.total_maintenance_prix || 0).toFixed(2)} DA
                </div>
              </div>
            </div>
            <div className="mt-1">
              <span className="text-gray-500 text-xs">Total:</span>
              <div className="font-medium text-sm text-red-600">
                {(Number(vehicle.total_carburant_prix || 0) + Number(vehicle.total_maintenance_prix || 0)).toFixed(2)} DA
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
})}

      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun véhicule</h3>
          <p className="text-gray-600">
            {currentUser.role === 'ADMIN' 
              ? 'Commencez par ajouter un véhicule à la flotte'
              : 'Aucun véhicule assigné à vous'
            }
          </p>
        </div>
      )}

      {/* Permissions info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Permissions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {currentUser.role === 'ADMIN' ? (
            <>
              <li>• En tant qu'ADMIN, vous pouvez voir et modifier tous les véhicules</li>
              <li>• Vous pouvez créer de nouveaux véhicules et assigner des responsables</li>
              <li>• Vous avez accès à tous les champs de modification</li>
              <li>• Vous pouvez exporter toutes les données des véhicules en Excel</li>
            </>
          ) : (
            <>
              <li>• En tant que CHEF, vous ne voyez que vos véhicules assignés</li>
              <li>• Vous pouvez uniquement modifier les index de début et fin de mois</li>
              <li>• Les autres champs sont protégés et ne peuvent pas être modifiés</li>
              <li>• Vous pouvez exporter les données de vos véhicules en Excel</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
