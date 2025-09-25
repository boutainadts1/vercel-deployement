import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Car, 
  Wrench, 
  Package, 
  History, 
  LogOut, 
  Shield, 
  ChefHat
} from 'lucide-react';
import { useAuth } from '@/context/authcontext';
import UserManagement from '@/components/UserManagement';
import VehicleList from '@/components/VehicleList';
import RepairList from '@/components/RepairList';
import PartsManagement from '@/components/PartsManagement';
import RepairHistory from '@/components/RepairHistory';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@/lib/api';

export default function Index() {
  const { user: currentUser, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login'); // sécurité si AuthContext n’a pas trouvé l’utilisateur
    }
  }, [loading, currentUser, navigate]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login', { replace: true });
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  // Onglet actif selon l’URL
  const activeTab = location.pathname.replace('/', '') || 'vehicles';

  // Définir les onglets visibles selon le rôle
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'vehicles', label: 'Véhicules', icon: Car },
      { id: 'repairs', label: 'Réparations', icon: Wrench },
      { id: 'history', label: 'Historique', icon: History }
    ];

    if (currentUser.role === 'ADMIN') {
      baseTabs.push(
        { id: 'parts', label: 'Pièces', icon: Package },
        { id: 'users', label: 'Utilisateurs', icon: Users }
      );
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  const handleTabChange = (tabId: string) => {
    navigate(`/${tabId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Car className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Fleet Manager</h1>
                  <p className="text-xs text-gray-600">Algérie Télécom</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {currentUser.role === 'ADMIN' ? (
                  <Shield className="w-5 h-5 text-red-600" />
                ) : (
                  <ChefHat className="w-5 h-5 text-blue-600" />
                )}
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{currentUser.nom}</div>
                  <div className="text-xs text-gray-600">{currentUser.email}</div>
                </div>
                <Badge variant={currentUser.role === 'ADMIN' ? 'destructive' : 'default'}>
                  {currentUser.role}
                </Badge>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-2">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Contenus */}
          <TabsContent value="vehicles">
            <VehicleList currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="repairs">
            <RepairList currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="history">
            <RepairHistory currentUser={currentUser} />
          </TabsContent>

          {currentUser.role === 'ADMIN' && (
            <TabsContent value="parts">
              <PartsManagement currentUser={currentUser} />
            </TabsContent>
          )}

          {currentUser.role === 'ADMIN' && (
            <TabsContent value="users">
              <UserManagement currentUser={currentUser} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              © 2024 Algérie Télécom - Fleet Management System
            </div>
            <div className="text-sm text-gray-600">
              Connecté en tant que: <span className="font-medium">{currentUser.nom}</span> ({currentUser.role})
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
