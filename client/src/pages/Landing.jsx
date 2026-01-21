import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const [establishmentId, setEstablishmentId] = useState('');
    const navigate = useNavigate();

    const handleGo = (type) => {
        if (!establishmentId) return;
        const id = establishmentId.toLowerCase().replace(/\s+/g, '-');
        if (type === 'admin') {
            navigate(`/admin/${id}`);
        } else {
            navigate(`/q/${id}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Fila Virtual</h1>
            <p className="mb-12 text-center text-blue-100 max-w-md text-lg">
                Sistema de gerenciamento de filas para restaurantes e estabelecimentos.
            </p>

            <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                    ID do Estabelecimento
                </label>
                <input
                    type="text"
                    value={establishmentId}
                    onChange={(e) => setEstablishmentId(e.target.value)}
                    placeholder="Ex: restaurante-do-joao"
                    className="w-full p-4 bg-white/90 text-gray-900 rounded-xl mb-4 focus:ring-4 focus:ring-blue-400 outline-none transition placeholder-gray-400"
                />

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleGo('client')}
                        disabled={!establishmentId}
                        className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                    >
                        <span>Cliente</span>
                        <span className="text-xs font-normal opacity-70">Entrar na Fila</span>
                    </button>
                    <button
                        onClick={() => handleGo('admin')}
                        disabled={!establishmentId}
                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                    >
                        <span>Admin</span>
                        <span className="text-xs font-normal opacity-70">Gerenciar</span>
                    </button>
                </div>
            </div>

            <p className="mt-8 text-sm text-blue-200/60">
                Digite um ID para criar ou acessar um estabelecimento.
            </p>
        </div>
    );
};

export default Landing;
