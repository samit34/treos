import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { initializeSocket, disconnectSocket, getSocket } from '../utils/socket';
import {
  addNotification,
  incrementConversationsVersion,
  incrementUnread,
  markConversationRead,
  setOnlineUsers,
  setUnreadSummary,
  userOffline,
  userOnline,
} from '../features/chat/chatSlice';
import axiosInstance from '../api/axiosInstance';
import { Message } from '../types';

export const useChatSocket = () => {
  const dispatch = useAppDispatch();
  const { accessToken, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const activeConversationId = useAppSelector((state) => state.chat.activeConversationId);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    const socket = initializeSocket(accessToken);

    const handleOnlineUsers = (userIds: string[]) => {
      dispatch(setOnlineUsers(userIds));
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      dispatch(userOnline(userId));
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      dispatch(userOffline(userId));
    };

    const handleMessageNotification = (message: Message) => {
      const messageConversationId =
        typeof message.conversation === 'string'
          ? message.conversation
          : (message.conversation as unknown as { _id?: string })?._id ?? '';

      const senderId = (message.sender as unknown as { id?: string; _id?: string }).id ??
        (message.sender as unknown as { id?: string; _id?: string })._id;

      if (senderId === user?.id || senderId === (user as unknown as { _id?: string })?._id) {
        return;
      }

      if (messageConversationId && messageConversationId === activeConversationId) {
        dispatch(markConversationRead({ conversationId: messageConversationId }));
        const socketInstance = getSocket();
        if (socketInstance) {
          socketInstance.emit('mark-read', { messageId: message._id });
        }
        dispatch(incrementConversationsVersion());
        return;
      }

      dispatch(incrementUnread({ conversationId: messageConversationId || message.conversation }));
      dispatch(
        addNotification({
          id: message._id,
          conversationId: messageConversationId || message.conversation,
          senderName: `${message.sender.firstName ?? ''} ${message.sender.lastName ?? ''}`.trim() ||
            message.sender.email,
          preview: message.content,
          timestamp: message.createdAt,
        })
      );
      dispatch(incrementConversationsVersion());
    };

    socket.on('online-users', handleOnlineUsers);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('message-notification', handleMessageNotification);

    return () => {
      socket.off('online-users', handleOnlineUsers);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('message-notification', handleMessageNotification);
    };
  }, [accessToken, activeConversationId, dispatch, isAuthenticated, user?.id]);

  useEffect(() => {
    const fetchUnreadSummary = async () => {
      if (!isAuthenticated) {
        return;
      }
      try {
        const response = await axiosInstance.get('/chat/unread-count');
        const { totalUnread, conversations } = response.data.data;
        dispatch(
          setUnreadSummary({
            total: totalUnread,
            conversations,
          })
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch unread summary', error);
      }
    };

    fetchUnreadSummary();
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?.id) {
      return;
    }

    const handleMessageRead = ({ messageId }: { messageId: string }) => {
      // placeholder for future enhancements
      void messageId;
    };

    socket.on('message-read', handleMessageRead);

    return () => {
      socket.off('message-read', handleMessageRead);
    };
  }, [user?.id]);
};


