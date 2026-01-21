import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // In production, this URL should probably come from env vars
        // For POC, we assume server is on port 3001
        // Note: If accessing from mobile on the same network, localhost won't work.
        // We might need to use the computer's IP address.
        // For now, we use localhost.
        const newSocket = io('http://localhost:3001');

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
