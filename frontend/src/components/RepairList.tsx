import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Wrench, Calendar, Package, Edit } from 'lucide-react';
import { getRepairs, getVehicles, createRepair, updateRepair, getParts, updateVehicle } from '@/lib/api';
import { Repair, Vehicle, User, Part } from '@/types';
import { NewRepair, RepairPart } from '@/lib/api';

interface RepairListProps {
  currentUser: User;
}

type RepairStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export default function RepairList({ currentUser }: RepairListProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [selectedParts, setSelectedParts] = useState<{ piece_id: number; quantite: number; prix_unitaire_utilise?: number }[]>([]);
  const [searchPartTerm, setSearchPartTerm] = useState(''); // 🔹 recherche pièces

  const [formData, setFormData] = useState<{
    date_reparation: string;
    description: string;
    vehicule_id: number;
    statut: RepairStatus;
  }>({
    date_reparation: '',
    description: '',
    vehicule_id: 0,
    statut: 'PLANNED'
  });

  useEffect(() => { loadData(); }, [currentUser]);

  const loadData = async () => {
    try {
      const repairsData = await getRepairs(currentUser.id_utilisateur, currentUser.role);
      setRepairs(repairsData.map(r => ({ ...r, cout_total: Number(r.cout_total || 0) })));

      const vehiclesData = await getVehicles(currentUser.id_utilisateur, currentUser.role);
      setVehicles(vehiclesData);

      const partsData = await getParts();
      setParts(partsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    return selectedParts.reduce((total, sp) => {
      const price = sp.prix_unitaire_utilise !== undefined
        ? sp.prix_unitaire_utilise
        : Number(parts.find(p => p.id_piece === sp.piece_id)?.prix_unitaire) || 0;
      return total + price * sp.quantite;
    }, 0);
  };

  const resetForm = () => {
    setFormData({ date_reparation: '', description: '', vehicule_id: 0, statut: 'PLANNED' });
    setSelectedParts([]);
    setEditingRepair(null);
    setSearchPartTerm('');
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData({ 
      date_reparation: new Date().toISOString().split('T')[0],
      description: '',
      vehicule_id: 0,
      statut: 'PLANNED'
    });
    setDialogOpen(true);
  };

  const openEditDialog = (repair: Repair) => {
    setEditingRepair(repair);

    const initialSelectedParts = repair.pieces?.map(p => ({
      piece_id: p.piece_id,
      quantite: p.quantite,
      prix_unitaire_utilise: Number(p.prix_unitaire_utilise) || 0
    })) || [];

    setSelectedParts(initialSelectedParts);
    setFormData({
      date_reparation: repair.date_reparation,
      description: repair.description,
      vehicule_id: repair.vehicule_id,
      statut: repair.statut
    });

    setTimeout(() => setDialogOpen(true), 0);
  };

  const handlePartSelection = (partId: number, checked: boolean) => {
    if (checked) {
      setSelectedParts([...selectedParts, { piece_id: partId, quantite: 1 }]);
    } else {
      setSelectedParts(selectedParts.filter(sp => sp.piece_id !== partId));
    }
  };

  const updatePartQuantity = (partId: number, quantite: number) => {
    setSelectedParts(selectedParts.map(sp => sp.piece_id === partId ? { ...sp, quantite } : sp));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalRepairCost = calculateTotalCost();

      if (editingRepair) {
        const updatedRepairData: Omit<Repair, "id_reparation"> & { pieces?: RepairPart[] } = {
          date_reparation: formData.date_reparation,
          description: formData.description,
          vehicule_id: formData.vehicule_id,
          statut: formData.statut,
          cout_total: totalRepairCost,
          created_by: editingRepair.created_by,
          pieces: selectedParts.map(sp => ({
            piece_id: sp.piece_id,
            quantite: sp.quantite,
            prix_unitaire_utilise: sp.prix_unitaire_utilise ?? (Number(parts.find(p => p.id_piece === sp.piece_id)?.prix_unitaire) || 0),
            reparation_id: editingRepair.id_reparation,
          })),
        };
        await updateRepair(editingRepair.id_reparation, updatedRepairData);

        if (formData.statut === "COMPLETED" && editingRepair.statut !== "COMPLETED") {
          const vehicle = vehicles.find(v => v.id_vehicule === formData.vehicule_id);
          await updateVehicle(formData.vehicule_id, {
            total_maintenance_prix: (vehicle?.total_maintenance_prix || 0) + totalRepairCost
          });
        }
      } else {
        const repairDataToCreate: NewRepair = {
          date_reparation: formData.date_reparation,
          description: formData.description,
          vehicule_id: formData.vehicule_id,
          statut: currentUser.role === "CHEF" ? "PLANNED" : formData.statut,
          created_by: currentUser.id_utilisateur,
          cout_total: totalRepairCost,
          pieces: selectedParts.map(sp => ({
            piece_id: sp.piece_id,
            quantite: sp.quantite,
            prix_unitaire_utilise: sp.prix_unitaire_utilise ?? (Number(parts.find(p => p.id_piece === sp.piece_id)?.prix_unitaire) || 0),
          }))
        };

        const newRepair = await createRepair(repairDataToCreate, currentUser.role);

        if (selectedParts.length > 0) {
          const partsWithRepairId: RepairPart[] = selectedParts.map(sp => ({
            piece_id: sp.piece_id,
            quantite: sp.quantite,
            prix_unitaire_utilise: sp.prix_unitaire_utilise ?? (Number(parts.find(p => p.id_piece === sp.piece_id)?.prix_unitaire) || 0),
            reparation_id: newRepair.id_reparation,
          }));
          await updateRepair(newRepair.id_reparation, { pieces: partsWithRepairId });
        }

        if (formData.statut === "COMPLETED") {
          const vehicle = vehicles.find(v => v.id_vehicule === formData.vehicule_id);
          await updateVehicle(formData.vehicule_id, {
            total_maintenance_prix: (vehicle?.total_maintenance_prix || 0) + totalRepairCost
          });
        }
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Erreur sauvegarde réparation:", error);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Header & New Repair Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Réparations</h2>
          <p className="text-gray-600">
            {currentUser.role === 'ADMIN' 
              ? 'Suivez et modifiez toutes les réparations de la flotte'
              : 'Créez des réparations pour vos véhicules (statut planifié uniquement)'
            }
          </p>
        </div>

        {vehicles.length > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle réparation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRepair ? 'Modifier la réparation' : 'Ajouter une réparation'}</DialogTitle>
                <DialogDescription>
                  {editingRepair 
                    ? 'Modifiez les informations de la réparation'
                    : currentUser.role === 'CHEF' 
                      ? 'Enregistrez une nouvelle réparation (statut planifié automatiquement)'
                      : 'Enregistrez une nouvelle réparation avec les pièces utilisées'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date de réparation</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date_reparation}
                      onChange={(e) => setFormData({ ...formData, date_reparation: e.target.value })}
                      required
                    />
                  </div>

                  {currentUser.role === 'ADMIN' && (
                    <div className="space-y-2">
                      <Label htmlFor="statut">Statut</Label>
                      <Select
                        value={formData.statut}
                        onValueChange={(value: RepairStatus) => setFormData({ ...formData, statut: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLANNED">Planifiée</SelectItem>
                          <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                          <SelectItem value="COMPLETED">Terminée</SelectItem>
                          <SelectItem value="CANCELLED">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {currentUser.role === 'CHEF' && !editingRepair && (
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-gray-50">
                        <Badge variant="secondary">Planifiée</Badge>
                      </div>
                      <p className="text-xs text-gray-500">Les chefs ne peuvent créer que des réparations planifiées</p>
                    </div>
                  )}
                </div>

                {/* Vehicle */}
                <div className="space-y-2">
                  <Label htmlFor="vehicule">Véhicule</Label>
                  <Select
                    value={formData.vehicule_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, vehicule_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id_vehicule} value={vehicle.id_vehicule.toString()}>
                          {vehicle.marque} {vehicle.modele} (#{vehicle.id_vehicule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez la réparation effectuée..."
                    required
                  />
                </div>

                {/* Parts Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <Label className="text-base font-medium">Pièces utilisées</Label>
                  </div>

                  {/* 🔹 Input recherche */}
                  <div className="mb-2">
                    <Input
                      placeholder="Rechercher une pièce par nom..."
                      value={searchPartTerm}
                      onChange={(e) => setSearchPartTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-3">
                      {parts
                        .filter(part => part.nom.toLowerCase().includes(searchPartTerm.toLowerCase()))
                        .map(part => {
                          const selectedPart = selectedParts.find(sp => sp.piece_id === part.id_piece);
                          const isSelected = !!selectedPart;

                          return (
                            <div key={part.id_piece} className="flex items-center space-x-3 p-2 rounded border">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handlePartSelection(part.id_piece, !!checked)}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{part.nom}</div>
                                <div className="text-xs text-gray-600">
                                  {part.reference} - {(Number(part.prix_unitaire) || 0).toFixed(2)} DA - Stock: {part.stock_actuel}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center space-x-2">
                                  <Label className="text-xs">Qté:</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={part.stock_actuel || 1}
                                    value={selectedPart.quantite}
                                    onChange={(e) => updatePartQuantity(part.id_piece, parseInt(e.target.value) || 1)}
                                    className="w-16 h-8"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {selectedParts.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">Résumé des pièces sélectionnées:</div>
                      <div className="space-y-1 text-xs">
                        {selectedParts.map(sp => {
                          const part = parts.find(p => p.id_piece === sp.piece_id);
                          return (
                            <div key={sp.piece_id} className="flex justify-between">
                              <span>{part?.nom} × {sp.quantite}</span>
                              <span>{((Number(part?.prix_unitaire) || 0) * sp.quantite).toFixed(2)} DA</span>
                            </div>
                          );
                        })}
                        <div className="border-t pt-1 flex justify-between font-medium">
                          <span>Total:</span>
                          <span>{calculateTotalCost().toFixed(2)} DA</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                  <Button type="submit">{editingRepair ? 'Modifier' : 'Ajouter'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Repair Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repairs
          .filter(repair => {
            if (currentUser.role === "ADMIN") return repair.statut !== "COMPLETED";
            if (currentUser.role === "CHEF") return repair.created_by === currentUser.id_utilisateur;
            return true;
          })
          .map(repair => (
            <Card key={repair.id_reparation} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-lg">Réparation #{repair.id_reparation}</CardTitle>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={repair.statut === 'COMPLETED' ? 'default' : repair.statut === 'PLANNED' ? 'secondary' : repair.statut === 'IN_PROGRESS' ? 'outline' : 'destructive'}>
                      {repair.statut === 'PLANNED' ? 'Planifiée' : repair.statut === 'IN_PROGRESS' ? 'En cours' : repair.statut === 'COMPLETED' ? 'Terminée' : 'Annulée'}
                    </Badge>
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(repair.date_reparation).toLocaleDateString('fr-FR')}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{repair.vehicule_info}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-600 mt-1">{repair.description}</p>
                  </div>

                  {repair.pieces && repair.pieces.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Pièces utilisées:</span>
                      <div className="mt-1 space-y-1">
                        {repair.pieces.map((piece, idx) => (
                          <div key={idx} className="text-xs bg-gray-100 rounded p-2">
                            <div className="font-medium">{piece.piece_nom}</div>
                            <div className="text-gray-600">
                              {piece.piece_reference} - Qté: {piece.quantite} × {Number(piece.prix_unitaire_utilise)?.toFixed(2)} DA
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Par: {repair.created_by_name}</span>
                    <span className="font-medium text-green-600">{repair.cout_total?.toFixed(2) || '0.00'} DA</span>
                  </div>

                  {currentUser.role === 'ADMIN' && (
                    <div className="pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(repair)} className="w-full">
                        <Edit className="w-4 h-4 mr-2" />Modifier
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Empty state */}
      {repairs.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réparation</h3>
          <p className="text-gray-600">
            {vehicles.length === 0 ? 'Aucun véhicule disponible pour enregistrer des réparations' : 'Aucune réparation enregistrée pour le moment'}
          </p>
        </div>
      )}

      {/* Permissions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Permissions des réparations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les CHEFs peuvent créer des réparations mais ne peuvent pas spécifier le statut (toujours "Planifiée")</li>
          <li>• Les ADMINs peuvent créer des réparations avec n'importe quel statut</li>
          <li>• Seuls les ADMINs peuvent modifier les réparations existantes</li>
          <li>• Tous les utilisateurs peuvent voir toutes les réparations</li>
        </ul>
      </div>
    </div>
  );
}