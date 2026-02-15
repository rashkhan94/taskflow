const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('board:join', (boardId) => {
            socket.join(`board:${boardId}`);
            console.log(`Socket ${socket.id} joined board:${boardId}`);
        });

        socket.on('board:leave', (boardId) => {
            socket.leave(`board:${boardId}`);
            console.log(`Socket ${socket.id} left board:${boardId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

export default setupSocket;
