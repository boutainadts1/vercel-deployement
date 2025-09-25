import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Users, Shield, ChefHat, Trash2, Edit } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/api';
import { User } from '@/types';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role: 'CHEF' as 'ADMIN' | 'CHEF'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.nom.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return;
    }
    if (!editingUser && !formData.mot_de_passe.trim()) {
      setError('Le mot de passe est requis');
      return;
    }
    if (formData.mot_de_passe && formData.mot_de_passe.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Vérification email unique
    const existingUser = users.find(u =>
      u.email.toLowerCase() === formData.email.toLowerCase() &&
      (!editingUser || u.id_utilisateur !== editingUser.id_utilisateur)
    );
    if (existingUser) {
      setError('Un utilisateur avec cet email existe déjà');
      return;
    }

    try {
      if (editingUser) {
        // ✅ Ne mettre à jour que les champs modifiés
        const updateData: Partial<User> = {};
        if (formData.nom !== editingUser.nom) updateData.nom = formData.nom;
        if (formData.email !== editingUser.email) updateData.email = formData.email;
        if (formData.role !== editingUser.role) updateData.role = formData.role;
        if (formData.mot_de_passe.trim()) updateData.mot_de_passe = formData.mot_de_passe;

        if (Object.keys(updateData).length === 0) {
          setError("Aucun changement détecté");
          return;
        }

        await updateUser(editingUser.id_utilisateur, updateData);
        setSuccess(`Utilisateur ${formData.nom} modifié avec succès !`);
      } else {
        // ➕ Créer un nouvel utilisateur
        await createUser(formData);
        setSuccess(`Utilisateur ${formData.nom} créé avec succès !`);
      }

      setDialogOpen(false);
      resetForm();
      loadUsers();

      // Nettoyage du message après 3s
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Erreur lors de la sauvegarde de l\'utilisateur');
    }
  };

  const resetForm = () => {
    setFormData({ nom: '', email: '', mot_de_passe: '', role: 'CHEF' });
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser.id_utilisateur) {
      setError('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteUser(userId);
        setSuccess('Utilisateur supprimé avec succès');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      email: user.email,
      mot_de_passe: '',
      role: user.role
    });
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
        <p className="text-gray-600">
          Seuls les administrateurs peuvent gérer les utilisateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
          <p className="text-gray-600">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Modifiez les informations de l\'utilisateur'
                  : 'Remplissez les informations pour créer un nouveau compte utilisateur'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@algerietelecom.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mot_de_passe">
                  {editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                </Label>
                <Input
                  id="mot_de_passe"
                  type="password"
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                  placeholder="Minimum 6 caractères"
                  required={!editingUser}
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  {editingUser
                    ? 'Laissez vide pour conserver le mot de passe actuel'
                    : 'L\'utilisateur utilisera ce mot de passe pour se connecter'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'ADMIN' | 'CHEF') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHEF">Chef (Utilisateur standard)</SelectItem>
                    <SelectItem value="ADMIN">Admin (Administrateur)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingUser ? 'Modifier' : 'Créer l\'utilisateur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id_utilisateur} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {user.role === 'ADMIN' ? (
                    <Shield className="w-5 h-5 text-red-600" />
                  ) : (
                    <ChefHat className="w-5 h-5 text-blue-600" />
                  )}
                  <CardTitle className="text-lg">{user.nom}</CardTitle>
                </div>
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'default'}>
                  {user.role}
                </Badge>
              </div>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ID:</span>
                  <Badge variant="secondary">#{user.id_utilisateur}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mot de passe:</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {user.mot_de_passe ? '••••••••' : 'Non défini'}
                  </span>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>

                  {user.id_utilisateur !== currentUser.id_utilisateur && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id_utilisateur)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur</h3>
          <p className="text-gray-600">
            Commencez par créer des comptes utilisateurs pour votre équipe
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les utilisateurs créés pourront se connecter avec leur email et mot de passe</li>
          <li>• Les CHEFs peuvent gérer tous les véhicules et créer des réparations (statut planifié uniquement)</li>
          <li>• Les ADMINs ont accès à toutes les fonctionnalités de gestion</li>
          <li>• Vous ne pouvez pas supprimer votre propre compte</li>
          <li>• Cliquez sur "Modifier" pour éditer les informations d'un utilisateur</li>
        </ul>
      </div>
    </div>
  );
}
