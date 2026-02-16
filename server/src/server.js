import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import listRoutes from './routes/lists.js';
import taskRoutes from './routes/tasks.js';
import errorHandler from './middleware/errorHandler.js';
import setupSocket from './socket/socketHandler.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            process.env.CLIENT_URL || 'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Middleware
app.use(cors({
    origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
    ],
    credentials: true,
}));
app.use(express.json());

// Attach io to requests so controllers can emit events
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io
setupSocket(io);

import { seed } from './seed.js';

app.get('/api/seed', async (req, res) => {
    try {
        await seed(false); // false = don't close connection
        res.json({ message: 'Database seeded successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Seeding failed', error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app, httpServer, io };
