import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : window.location.origin);

let socketInstance = null;

const getSocket = () => {
    if (!socketInstance) {
        socketInstance = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });
    }
    return socketInstance;
};

export function useSocket(boardId, handlers = {}) {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!boardId) return;

        const socket = getSocket();
        if (!socket.connected) {
            socket.connect();
        }

        socket.emit('board:join', boardId);

        const events = [
            'task:created', 'task:updated', 'task:deleted', 'tasks:reordered',
            'list:created', 'list:updated', 'list:deleted', 'lists:reordered',
            'board:updated', 'board:deleted', 'member:added',
        ];

        const listeners = events.map((event) => {
            const handler = (data) => {
                const handlerName = `on${event.split(':').map((s) => s[0].toUpperCase() + s.slice(1)).join('')}`;
                handlersRef.current[handlerName]?.(data);
            };
            socket.on(event, handler);
            return { event, handler };
        });

        return () => {
            socket.emit('board:leave', boardId);
            listeners.forEach(({ event, handler }) => socket.off(event, handler));
        };
    }, [boardId]);

    const emitEvent = useCallback((event, data) => {
        const socket = getSocket();
        socket.emit(event, data);
    }, []);

    return { emitEvent };
}
