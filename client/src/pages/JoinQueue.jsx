import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const JoinQueue = () => {
    const { id: establishmentId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // If already has a session for this establishment, redirect to status
        const savedCustomer = localStorage.getItem(`customer_${establishmentId}`);
        if (savedCustomer) {
            navigate(`/q/${establishmentId}/status`);
        }

        if (socket) {
            socket.on('join_success', (customer) => {
                localStorage.setItem(`customer_${establishmentId}`, JSON.stringify(customer));
                navigate(`/q/${establishmentId}/status`);
            });

            return () => {
                socket.off('join_success');
            };
        }
    }, [socket, establishmentId, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !phone) return;

        setIsSubmitting(true);
        if (socket) {
            socket.emit('add_customer', {
                establishmentId,
                name,
                phone
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
            <h1 className="text-2xl font-bold mb-2 text-primary">Bem-vindo!</h1>
            <p className="text-gray-600 mb-8 text-center">Entre na fila para <strong>{establishmentId}</strong></p>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Seu nome"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="(11) 99999-9999"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {isSubmitting ? 'Entrando...' : 'Entrar na Fila'}
                </button>
            </form>
        </div>
    );
};

export default JoinQueue;

