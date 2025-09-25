import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { getParts, createPart, updatePart, deletePart } from '@/lib/api';
import { Part, User } from '@/types';

interface PartsManagementProps {
  currentUser: User;
}

export default function PartsManagement({ currentUser }: PartsManagementProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    reference: '',
    prix_unitaire: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const partsData = await getParts();
      setParts(partsData);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await updatePart(editingPart.id_piece, formData);
      } else {
        await createPart(formData);
      }
      setDialogOpen(false);
      setEditingPart(null);
      setFormData({
        nom: '',
        reference: '',
        prix_unitaire: 0
      });
      loadData();
    } catch (error) {
      console.error('Error saving part:', error);
    }
  };

  const handleDeletePart = async (partId: number) => {
    try {
      await deletePart(partId);
      loadData(); // Refresh the parts list
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('Erreur lors de la suppression de la pièce');
    }
  };

  const openEditDialog = (part: Part) => {
    setEditingPart(part);
    setFormData({
      nom: part.nom,
      reference: part.reference,
      prix_unitaire: part.prix_unitaire || 0
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPart(null);
    setFormData({
      nom: '',
      reference: '',
      prix_unitaire: 0
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Pièces</h2>
          <p className="text-gray-600">Gérez l'inventaire des pièces détachées</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une pièce
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPart ? 'Modifier la pièce' : 'Ajouter une pièce'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations de la pièce
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la pièce</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prix">Prix unitaire (DA)</Label>
                <Input
                  id="prix"
                  type="number"
                  step="0.01"
                  value={formData.prix_unitaire}
                  onChange={(e) => setFormData({ ...formData, prix_unitaire: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingPart ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parts.map((part) => (
          <Card key={part.id_piece} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{part.nom}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(part)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {/* Delete button - Only visible for ADMIN users */}
                  {currentUser.role === 'ADMIN' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action ne peut pas être annulée. Cette pièce sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePart(part.id_piece)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              <CardDescription>{part.reference}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex justify-between items-center">
  <span className="text-sm text-gray-600">Prix unitaire:</span>
  <span className="text-sm font-medium">
    {Number(part.prix_unitaire || 0).toFixed(2)} DA
  </span>
</div>

                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ID:</span>
                  <Badge variant="secondary">#{part.id_piece}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {parts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune pièce</h3>
          <p className="text-gray-600">Commencez par ajouter des pièces à l'inventaire</p>
        </div>
      )}
    </div>
  );
}