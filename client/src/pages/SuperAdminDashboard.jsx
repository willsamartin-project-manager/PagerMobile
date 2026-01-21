import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, Search } from 'lucide-react';

const SuperAdminDashboard = () => {
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check Auth
    useEffect(() => {
        const isSuperAdmin = localStorage.getItem('is_super_admin');
        if (!isSuperAdmin) {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchEstablishments = async () => {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            try {
                const res = await fetch(`${API_URL}/api/establishments`);
                const data = await res.json();
                setEstablishments(data);
            } catch (error) {
                console.error("Failed to fetch", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEstablishments();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('is_super_admin');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Super Admin</h1>
                        <p className="text-gray-500">Gestão Global da Plataforma</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                        Sair
                    </button>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="text-blue-600" />
                            Estabelecimentos Cadastrados ({establishments.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Carregando dados...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                    <tr>
                                        <th className="p-4">Nome</th>
                                        <th className="p-4">ID (Slug)</th>
                                        <th className="p-4">Criado em</th>
                                        <th className="p-4">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {establishments.map((est) => (
                                        <tr key={est.id} className="hover:bg-blue-50/50 transition">
                                            <td className="p-4 font-medium text-gray-800">{est.name}</td>
                                            <td className="p-4 font-mono text-blue-600 text-sm">{est.id}</td>
                                            <td className="p-4 text-gray-500 text-sm">
                                                {new Date(est.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <a
                                                    href={`/admin/${est.id}`}
                                                    target="_blank"
                                                    className="text-xs bg-gray-900 text-white px-3 py-1 rounded-md hover:bg-gray-700"
                                                >
                                                    Ver Painel
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                    {establishments.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-400">
                                                Nenhum estabelecimento encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
