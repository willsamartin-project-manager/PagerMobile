import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Trash2, Bell, CheckCircle, QrCode } from 'lucide-react';
import QRCode from "react-qr-code";

const AdminDashboard = () => {
    const { id: establishmentId } = useParams();
    const socket = useSocket();
    const [queue, setQueue] = useState([]);
    const [showQr, setShowQr] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join_room', establishmentId);

        const handleQueueUpdate = (updatedQueue) => {
            setQueue(updatedQueue);
        };

        socket.on('queue_update', handleQueueUpdate);

        // Fetch initial
        socket.emit('join_room', establishmentId); // Resend just in case

        return () => {
            socket.off('queue_update', handleQueueUpdate);
        };
    }, [socket, establishmentId]);

    const handleCall = (customerId) => {
        if (socket) {
            socket.emit('call_customer', { establishmentId, customerId });
        }
    };

    const handleRemove = (customerId) => {
        if (socket) {
            socket.emit('remove_customer', { establishmentId, customerId });
        }
    };

    const joinUrl = `${window.location.protocol}//${window.location.host}/q/${establishmentId}`;

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Painel Admin</h1>
                    <p className="text-gray-500">Estabelecimento: <span className="font-mono font-bold text-blue-600">{establishmentId}</span></p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        Na Fila: {queue.length}
                    </div>
                </div>

                <div className="mt-4 md:mt-0 text-center">
                    <button
                        onClick={() => setShowQr(!showQr)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        <QrCode size={20} />
                        <span>{showQr ? 'Ocultar QR' : 'Mostrar QR Code'}</span>
                    </button>

                    {showQr && (
                        <div className="absolute top-24 right-6 bg-white p-4 shadow-xl rounded-xl border z-10 animate-fade-in md:static md:mt-4 md:shadow-none md:border-none">
                            <QRCode value={joinUrl} size={150} />
                            <p className="text-xs text-center mt-2 text-gray-500 max-w-[150px] break-all">
                                {joinUrl}
                            </p>
                        </div>
                    )}
                </div>
            </header>

            <div className="space-y-4">
                {queue.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        Nenhum cliente na fila.
                    </div>
                ) : (
                    queue.map((customer, index) => (
                        <div
                            key={customer.id}
                            className={`bg-white p-4 rounded-xl shadow-sm border-l-4 flex justify-between items-center ${customer.status === 'called' ? 'border-red-500 bg-red-50' : 'border-blue-500'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${customer.status === 'called' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 className="font-bold text-lg">{customer.name}</h3>
                                    <p className="text-gray-500 text-sm">{customer.phone}</p>
                                    <p className="text-xs text-gray-400">
                                        Entrou às {new Date(customer.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleCall(customer.id)}
                                    className={`p-3 rounded-lg transition ${customer.status === 'called'
                                        ? 'bg-red-200 text-red-700 hover:bg-red-300'
                                        : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                                        }`}
                                    title="Chamar Cliente"
                                >
                                    <Bell size={20} />
                                </button>

                                <button
                                    onClick={() => handleRemove(customer.id)}
                                    className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                                    title="Finalizar/Remover"
                                >
                                    <CheckCircle size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

