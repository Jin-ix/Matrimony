import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/env.js';
import { initializeSocket } from './config/socket.js';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import kitchenRoutes from './routes/kitchen.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import aiRoutes from './routes/ai.routes.js';
import familyMatchRoutes from './routes/familyMatch.routes.js';

// Import socket handlers
import { registerChatSocket } from './socket/chat.socket.js';
import { registerKitchenSocket } from './socket/kitchen.socket.js';
import { registerNotificationSocket } from './socket/notification.socket.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Register socket event handlers
registerChatSocket(io);
registerKitchenSocket(io);
registerNotificationSocket(io);

// Middleware
app.use(helmet());
const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/kitchen-table', kitchenRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/family-matches', familyMatchRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorMiddleware);

// Start server
const PORT = parseInt(env.PORT, 10);
httpServer.listen(PORT, () => {
    console.log(`🚀 ICM Server running on port ${PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
});

export { app, httpServer };
