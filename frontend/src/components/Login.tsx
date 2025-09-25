import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login as apiLogin } from "@/lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/authcontext";
import img from "@/components/img/logo.png";

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/vehicles";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir les champs email et mot de passe");
      setLoading(false);
      return;
    }

    try {
      const response = await apiLogin(email, password);
      if (response?.user) {
        setUser(response.user);
        localStorage.setItem("currentUser", JSON.stringify(response.user));
        navigate(from, { replace: true });
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Partie gauche (logo + texte) */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-white text-[#1e2a78] p-10">
          <img src={img} alt="Algérie Télécom" className="w-28 mb-4" 
          style={{
            width: "15vw"
          }}/>
          <h1 className="text-3xl font-bold">Algérie Télécom</h1>
          <p className="text-center text-base mt-3">
            Gérez vos véhicules, partout et à tout moment
          </p>
        </div>

        {/* Partie droite (formulaire) */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center bg-[#1e2a78] text-white">
          <h2 className="text-3xl font-bold text-center mb-8">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-white">Nom d’utilisateur</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nom@algerietelecom.com"
                className="rounded-full bg-white text-gray-800 placeholder-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Votre mot de passe"
                className="rounded-full bg-white text-gray-800 placeholder-gray-400"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

           <Button
  type="submit"
  className="
    w-full 
    bg-white 
    text-[#1e2a78] 
    font-semibold 
    rounded-full 
    py-3 
    text-lg
    border-2 
    border-white 
    transition-colors duration-200
    hover:bg-[#1e2a78] 
    hover:text-white
    hover:border-white
    active:bg-[#1e2a78] 
    active:text-white
    active:border-white
  "
  disabled={loading}
>
  {loading ? "Connexion..." : "Se connecter"}
</Button>


          </form>
        </div>
      </div>
    </div>
  );
}
