import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import axios from 'axios';
import { toast } from 'sonner';

const AuthPage = () => {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service.onrender.com';
            const res = await axios.post(`${API_BASE}/api/auth/login`, {
                email,
                password
            });

            const { access, user } = res.data;

            // Allow only 'merchant' (dealer) or specific roles if needed.
            // For now, any valid user can login.
            login(access, user);
            toast.success('Willkommen zurück!');

        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Login fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-700">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
                            <span className="text-2xl font-bold text-white">A</span>
                        </div>
                        <h1 className="text-2xl font-bold">Händler Login</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            Melden Sie sich mit Ihren Zugangsdaten an.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 ml-1">E-Mail Adresse</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                placeholder="name@firma.de"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 ml-1">Passwort</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button fullWidth disabled={loading}>
                                {loading ? 'Lade...' : 'Anmelden'}
                            </Button>
                        </div>
                    </form>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 text-center text-xs text-gray-500">
                    &copy; 2026 Autoteile Assistent
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
