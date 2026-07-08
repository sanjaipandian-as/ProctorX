import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

export const useSocket = (quizId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setSocket(null);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [quizId]);

  return socket;
};
export default useSocket;
