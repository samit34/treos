import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { initializeSocket } from './utils/socket';
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Connect to MongoDB
connectDB();

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

