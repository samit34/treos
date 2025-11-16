import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { jwtConfig } from '../config/jwt';
import User from '../models/User';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import { getChatAssociation } from './chatAssociation';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const onlineUsers = new Map<string, number>();

const addOnlineUser = (userId: string) => {
  const currentCount = onlineUsers.get(userId) ?? 0;
  onlineUsers.set(userId, currentCount + 1);
};

const removeOnlineUser = (userId: string) => {
  const currentCount = onlineUsers.get(userId) ?? 0;
  if (currentCount <= 1) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, currentCount - 1);
  }
};

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5000',
      credentials: true,
    },
  });

  // Authentication middleware for socket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, jwtConfig.secret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    if (socket.userId) {
      const wasOffline = !onlineUsers.has(socket.userId);
      addOnlineUser(socket.userId);
      socket.emit('online-users', Array.from(onlineUsers.keys()));
      if (wasOffline) {
        socket.broadcast.emit('user-online', { userId: socket.userId });
      }
    }

    // Join conversation room
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle new message
    socket.on('send-message', async (data: { conversationId: string; receiverId: string; content: string }) => {
      try {
        const { conversationId, receiverId, content } = data;

        if (!socket.userId) {
          throw new Error('Unauthorized');
        }

        const association = await getChatAssociation(socket.userId, receiverId);

        if (!association) {
          socket.emit('error', {
            message: 'Chat is only available between associated clients and workers.',
          });
          return;
        }

        // Create message in database
        let conversation = await Conversation.findById(conversationId);

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [socket.userId, receiverId],
          });
        }

        const participantsAreValid =
          conversation.participants
            .map((participant) => participant.toString())
            .includes(socket.userId) &&
          conversation.participants
            .map((participant) => participant.toString())
            .includes(receiverId);

        if (!participantsAreValid) {
          socket.emit('error', { message: 'Not authorized to send messages in this conversation.' });
          return;
        }

        const message = await Message.create({
          conversation: conversation._id,
          sender: socket.userId,
          receiver: receiverId,
          content,
        });

        // Update conversation
        if (conversation) {
          conversation.lastMessage = message._id as mongoose.Types.ObjectId;
          conversation.lastMessageAt = new Date();
          await conversation.save();
        }

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'firstName lastName email profilePicture')
          .populate('receiver', 'firstName lastName email profilePicture');

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new-message', populatedMessage);

        // Emit to receiver's personal room for notification
        io.to(`user:${receiverId}`).emit('message-notification', populatedMessage);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping: data.isTyping,
        conversationId: data.conversationId,
      });
    });

    // Handle message read
    socket.on('mark-read', async (data: { messageId: string }) => {
      try {
        await Message.findByIdAndUpdate(data.messageId, { isRead: true });
        socket.emit('message-read', { messageId: data.messageId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      if (socket.userId) {
        const wasOnline = onlineUsers.has(socket.userId);
        removeOnlineUser(socket.userId);
        if (wasOnline && !onlineUsers.has(socket.userId)) {
          socket.broadcast.emit('user-offline', { userId: socket.userId });
        }
      }
    });
  });

  return io;
};

