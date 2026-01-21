import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <h1 className="text-4xl font-bold mb-8">Fila Virtual</h1>
            <p className="mb-8 text-center">Escaneie o QR Code no estabelecimento para entrar na fila.</p>
            <div className="space-y-4">
                <Link to="/q/test-restaurante" className="block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold shadow-md hover:bg-gray-100 transition">
                    Simular Cliente (Test Restaurante)
                </Link>
                <Link to="/admin/test-restaurante" className="block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold shadow-md hover:bg-gray-800 transition">
                    Painel Admin (Test Restaurante)
                </Link>
            </div>
        </div>
    );
};

export default Landing;
