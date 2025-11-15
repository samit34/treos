import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { AuthRequest } from '../middlewares/authMiddleware';
import { getChatAssociation } from '../utils/chatAssociation';

const ensureParticipant = (
  conversation: (typeof Conversation)['prototype'] | null,
  userId?: mongoose.Types.ObjectId | string | null
): boolean => {
  if (!conversation || !userId) {
    return false;
  }
  return conversation.participants
    .map((participant: mongoose.Types.ObjectId) => participant.toString())
    .includes(userId.toString());
};

export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conversations = await Conversation.find({
      participants: req.user?._id,
    })
      .populate('participants', 'firstName lastName email profilePicture')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrCreateConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user?._id;

    if (!senderId || !receiverId) {
      res.status(400).json({ message: 'Sender and receiver are required.' });
      return;
    }

    const association = await getChatAssociation(senderId.toString(), receiverId);

    if (!association) {
      res.status(403).json({
        message: 'Chat is only available between associated clients and workers.',
      });
      return;
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate('participants', 'firstName lastName email profilePicture role');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
      await conversation.populate('participants', 'firstName lastName email profilePicture role');
    }

    res.json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: 'Invalid conversation id.' });
      return;
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!ensureParticipant(conversation, req.user?._id)) {
      res.status(403).json({ message: 'Not authorized to view this conversation' });
      return;
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'firstName lastName email profilePicture')
      .populate('receiver', 'firstName lastName email profilePicture')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user?._id,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        totalPages: Math.ceil(messages.length / Number(limit)),
        currentPage: Number(page),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { conversationId, receiverId, content } = req.body;
    const senderId = req.user?._id;

    if (!senderId || !receiverId || !content) {
      res.status(400).json({ message: 'Conversation, receiver, and content are required.' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: 'Invalid conversation id.' });
      return;
    }

    const association = await getChatAssociation(senderId.toString(), receiverId);

    if (!association) {
      res.status(403).json({
        message: 'Chat is only available between associated clients and workers.',
      });
      return;
    }

    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      // Create conversation if it doesn't exist
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    if (
      !ensureParticipant(conversation, senderId) ||
      !ensureParticipant(conversation, receiverId)
    ) {
      res.status(403).json({ message: 'Not authorized to send messages in this conversation.' });
      return;
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName email profilePicture')
      .populate('receiver', 'firstName lastName email profilePicture');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: populatedMessage },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const receiverId = req.user?._id;

    if (!receiverId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const unreadAggregation = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(receiverId.toString()),
          isRead: false,
        },
      },
      {
        $group: {
          _id: '$conversation',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUnread = unreadAggregation.reduce((acc, entry) => acc + entry.count, 0);

    const conversations = unreadAggregation.map((entry) => ({
      conversationId: entry._id.toString(),
      count: entry.count,
    }));

    res.json({
      success: true,
      data: { totalUnread, conversations },
    });
  } catch (error) {
    next(error);
  }
};

