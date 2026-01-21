import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useEffect, useState } from 'react';
import { Bell, User, Clock } from 'lucide-react';

const QueueStatus = () => {
    const { id: establishmentId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [customer, setCustomer] = useState(null);
    const [position, setPosition] = useState(null);
    const [isCalled, setIsCalled] = useState(false);

    useEffect(() => {
        // Load customer session
        const stored = localStorage.getItem(`customer_${establishmentId}`);
        if (!stored) {
            navigate(`/q/${establishmentId}`);
            return;
        }

        try {
            const parsed = JSON.parse(stored);
            setCustomer(parsed);
        } catch (e) {
            navigate(`/q/${establishmentId}`);
        }
    }, [establishmentId, navigate]);

    useEffect(() => {
        if (!socket || !customer) return;

        // Join the room to get updates
        socket.emit('join_room', establishmentId);

        // Listen for queue updates to calculate position
        const handleQueueUpdate = (queue) => {
            if (!queue) return;
            // Find my status in the queue
            const myEntry = queue.find(c => c.id === customer.id);
            if (myEntry) {
                // If status changed to called
                if (myEntry.status === 'called') {
                    handleCalled();
                } else if (myEntry.status === 'waiting') {
                    // Calculate position: Count people performing 'waiting' before me
                    const index = queue.filter(c => c.status === 'waiting').findIndex(c => c.id === customer.id);
                    setPosition(index + 1);
                    setIsCalled(false);
                }
            } else {
                // I was removed?
                alert("Você foi removido da fila.");
                localStorage.removeItem(`customer_${establishmentId}`);
                navigate(`/q/${establishmentId}`);
            }
        };

        const handleCalled = () => {
            setIsCalled(true);
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([500, 300, 500, 300, 500]); // Vibrate pattern
                // Loop vibration? Browser might block continuous vibration without user interaction context repeatedly, 
                // but we trigger it once strongly. 
            }
        };

        socket.on('queue_update', handleQueueUpdate);

        // Also listen for specific call event just in case
        socket.on('customer_called', (calledId) => {
            if (calledId === customer.id) {
                handleCalled();
            }
        });

        // Request initial status
        socket.emit('get_status', { establishmentId, customerId: customer.id });

        return () => {
            socket.off('queue_update', handleQueueUpdate);
            socket.off('customer_called');
        };
    }, [socket, customer, establishmentId, navigate]);

    const handleConfirm = () => {
        // Stop vibration/alert
        setIsCalled(false); // Just hide UI overlay? 
        if (navigator.vibrate) navigator.vibrate(0);
        // Maybe notify server 'I'm coming'? POC doesn't specify logic for that, just ACK.
    };

    // Background color based on state
    const bgClass = isCalled ? 'bg-red-500 animate-pulse' : 'bg-white';
    const textClass = isCalled ? 'text-white' : 'text-gray-900';

    if (!customer) return <div>Carregando...</div>;

    if (isCalled) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen ${bgClass} ${textClass} p-6 transition-colors duration-500`}>
                <Bell size={64} className="mb-6 animate-bounce" />
                <h1 className="text-4xl font-bold mb-4 text-center">SUA VEZ!</h1>
                <p className="text-xl mb-12 text-center">Dirija-se ao balcão.</p>
                <button
                    onClick={handleConfirm}
                    className="px-8 py-4 bg-white text-red-600 font-bold text-xl rounded-full shadow-xl hover:bg-gray-100 transition"
                >
                    Estou a caminho
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pt-12 p-6 min-h-full">
            <div className="bg-blue-600 text-white p-4 rounded-full mb-6 shadow-lg">
                <User size={48} />
            </div>

            <h2 className="text-xl text-gray-500 mb-2">Olá, {customer.name}</h2>
            {position !== null ? (
                <>
                    <h1 className="text-6xl font-black text-blue-600 mb-2">{position}º</h1>
                    <p className="text-gray-400 font-medium mb-12">Sua posição na fila</p>
                </>
            ) : (
                <p className="text-xl text-gray-500 mb-12">Carregando posição...</p>
            )}

            <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4 text-gray-600">
                    <Clock size={24} />
                    <div>
                        <p className="text-sm text-gray-400">Tempo estimado</p>
                        <p className="font-bold">{position ? position * 5 : '--'} min</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueStatus;

