import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({ id: '', name: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Hardcode API URL or use same origin
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = mode === 'register' ? '/api/register' : '/api/login';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erro na requisição');

            // Success
            if (data.success) {
                if (data.superAdmin) {
                    localStorage.setItem('is_super_admin', 'true');
                    navigate('/super-admin');
                    return;
                }
                const estId = data.establishment.id;
                // Save session (basic)
                localStorage.setItem('admin_token', estId); // In real app, use JWT
                navigate(`/admin/${estId}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-indigo-700 to-purple-800 text-white">
            <h1 className="text-5xl font-extrabold mb-2 tracking-tight">Fila Virtual</h1>
            <p className="mb-8 text-blue-200">Portal do Parceiro</p>

            <div className="w-full max-w-md bg-white text-gray-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex border-b mb-6">
                    <button
                        className={`flex-1 pb-2 font-bold ${mode === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
                        onClick={() => setMode('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`flex-1 pb-2 font-bold ${mode === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
                        onClick={() => setMode('register')}
                    >
                        Cadastrar
                    </button>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ex: Pizzaria do João"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Único (Login)</label>
                        <input
                            type="text"
                            required
                            value={formData.id}
                            onChange={e => setFormData({ ...formData, id: e.target.value })}
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: pizzaria-joao"
                        />
                        {mode === 'register' && <p className="text-xs text-gray-500 mt-1">Este ID será usado no link da fila.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="*******"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Carregando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
                    </button>
                </form>
            </div>

            <div className="mt-12 text-center opacity-60">
                <p className="text-sm">É um cliente?</p>
                <p className="text-xs">Escaneie o QR Code do estabelecimento para entrar na fila.</p>
            </div>
        </div>
    );
};

export default Landing;
