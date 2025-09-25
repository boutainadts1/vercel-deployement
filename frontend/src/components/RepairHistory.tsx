import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, History, Calendar, Wrench, Car, FileText } from 'lucide-react';
import { getCompletedRepairs } from '@/lib/api';
import { Repair, User } from '@/types';
import * as XLSX from 'xlsx'; // 📦 import SheetJS

interface RepairHistoryProps {
  currentUser: User;
}

export default function RepairHistory({ currentUser }: RepairHistoryProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadRepairs(); }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepairs(repairs);
    } else {
      const filtered = repairs.filter(repair => 
        repair.vehicule_info?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRepairs(filtered);
    }
  }, [searchTerm, repairs]);

  const loadRepairs = async () => {
    try {
      const repairsData = await getCompletedRepairs();
      setRepairs(repairsData);
      setFilteredRepairs(repairsData);
    } catch (error) {
      console.error('Error loading repair history:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fonction d'export Excel
 const exportToExcel = (mode: 'all' | 'month') => {
  let exportData = filteredRepairs;

  if (mode === 'month') {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    exportData = filteredRepairs.filter(r => {
      if (!r.date_reparation) return false;
      const repairDate = new Date(r.date_reparation);
      return repairDate.getMonth() === currentMonth && repairDate.getFullYear() === currentYear;
    });
  }

  if (!exportData.length) return;

  const dataForExcel = exportData.map((r, index) => {
    const repairDate = r.date_reparation ? new Date(r.date_reparation) : null;
    const month = repairDate ? repairDate.getMonth() + 1 : '';
    const year = repairDate ? repairDate.getFullYear() : '';
    const fullDate = repairDate ? repairDate.toLocaleDateString('fr-FR') : '';

    return {
      'N°': index + 1,
      'ID Réparation': r.id_reparation,
      'Mois': month,
      'Année': year,
      'Date complète': fullDate,
      'Véhicule': r.vehicule_info,
      'Coût total (DA)': r.cout_total != null ? Number(r.cout_total).toFixed(2) : '0.00',
      'Créé par': r.created_by_name,
      'Pièces utilisées': r.pieces?.map(p => `${p.piece_nom} (${p.piece_reference}) x${p.quantite}`).join('; ') || '',
      'Description': r.description,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historique Réparations');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename =
    mode === 'all'
      ? `Historique_Reparations_Toutes_${dateStr}.xlsx`
      : `Historique_Reparations_CeMois_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
};




  if (loading) return <div className="flex justify-center p-8">Chargement de l'historique...</div>;
  if (currentUser.role !== 'ADMIN') return (
    <div className="text-center py-12">
      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
      <p className="text-gray-600">Seuls les administrateurs peuvent accéder à l'historique des réparations.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historique des Réparations</h2>
          <p className="text-gray-600">Consultez l'historique de toutes les réparations terminées</p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {filteredRepairs.length} réparation{filteredRepairs.length !== 1 ? 's' : ''} terminée{filteredRepairs.length !== 1 ? 's' : ''}
          </Badge>
          <Button
    variant="outline"
    size="sm"
    onClick={() => exportToExcel('month')}
    className="flex items-center space-x-1"
  >
    <FileText className="w-4 h-4" />
    <span>Réparations du mois</span>
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => exportToExcel('all')}
    className="flex items-center space-x-1"
  >
    <FileText className="w-4 h-4" />
    <span>Toutes les réparations</span>
  </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Recherche par véhicule</span>
          </CardTitle>
          <CardDescription>Filtrez les réparations par nom de véhicule (marque et modèle)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom de véhicule (ex: Renault Master)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Repairs List */}
      <div className="space-y-4">
        {filteredRepairs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Aucun résultat' : 'Aucune réparation terminée'}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Aucune réparation ne correspond à votre recherche.'
                  : "L'historique sera alimenté au fur et à mesure que les réparations seront terminées."
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-4">
                  Effacer la recherche
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRepairs.map((repair) => (
            <Card key={repair.id_reparation} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Wrench className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Réparation #{repair.id_reparation}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{repair.vehicule_info}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    TERMINÉ
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {repair.description}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Date de réparation</p>
                        <p className="text-sm font-medium">
                          {new Date(repair.date_reparation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="text-xs text-gray-500">Coût total</p>
                        <p className="text-sm font-medium text-green-600">
                          {Number(repair.cout_total || 0).toFixed(2)} DA
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Créé par</p>
                        <p className="text-sm font-medium">{repair.created_by_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Parts Used */}
                  {repair.pieces && repair.pieces.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Pièces utilisées</h4>
                      <div className="space-y-2">
                        {repair.pieces.map((piece, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div>
                              <span className="text-sm font-medium">{piece.piece_nom}</span>
                              <span className="text-xs text-gray-500 ml-2">({piece.piece_reference})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">Qté: {piece.quantite}</div>
                              <div className="text-xs text-gray-500">
  {piece.prix_unitaire_utilise != null
    ? Number(piece.prix_unitaire_utilise).toFixed(2)
    : "N/A"} DA / unité
</div>

                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
