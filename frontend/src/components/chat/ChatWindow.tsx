import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getSocket } from '../../utils/socket';
import { Message, Conversation } from '../../types';
import axiosInstance from '../../api/axiosInstance';
import { markConversationRead } from '../../features/chat/chatSlice';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onMessage: (message: Message) => void;
}

const ChatWindow = ({ conversation, currentUserId, onMessage }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const dispatch = useAppDispatch();
  const onlineUsers = useAppSelector((state) => state.chat.onlineUsers);

  const otherUser = conversation.participants.find((participant) => {
    const participantId =
      participant.id ??
      (participant as unknown as { _id?: string })?._id ??
      (participant as unknown as { id?: string })?.id;
    return participantId !== currentUserId;
  });
  const otherUserId =
    otherUser?.id ??
    (otherUser as unknown as { _id?: string })?._id ??
    (otherUser as unknown as { id?: string })?.id ??
    '';
  const isOtherUserOnline = otherUserId ? onlineUsers.includes(otherUserId) : false;

  useEffect(() => {
    setLoading(true);
    setMessages([]);
  }, [conversation._id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get(`/chat/conversations/${conversation._id}/messages`);
        const fetchedMessages: Message[] = response.data.data.messages;
        setMessages(fetchedMessages);
        dispatch(markConversationRead({ conversationId: conversation._id }));

        const socketInstance = getSocket();
        if (socketInstance) {
          fetchedMessages
            .filter((message) => {
              const senderId =
                message.sender.id ??
                (message.sender as unknown as { _id?: string })?._id ??
                (message.sender as unknown as { id?: string })?.id;
              return senderId !== currentUserId && !message.isRead;
            })
            .forEach((message) => {
              socketInstance.emit('mark-read', { messageId: message._id });
            });
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation._id, currentUserId, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    const handleNewMessage = (message: Message) => {
      const messageConversationId =
        typeof message.conversation === 'string'
          ? message.conversation
          : (message.conversation as unknown as { _id?: string })?._id ?? '';

      if (messageConversationId !== conversation._id) {
        return;
      }

      setMessages((prev) => [...prev, message]);
      onMessage(message);

      const senderId =
        message.sender.id ??
        (message.sender as unknown as { _id?: string })?._id ??
        (message.sender as unknown as { id?: string })?.id;

      if (senderId !== currentUserId) {
        socket.emit('mark-read', { messageId: message._id });
        dispatch(markConversationRead({ conversationId: conversation._id }));
      }
    };

    const handleTyping = (payload: { userId: string; isTyping: boolean; conversationId: string }) => {
      if (payload.conversationId === conversation._id && payload.userId === otherUserId) {
        setIsOtherUserTyping(payload.isTyping);
      }
    };

    socket.emit('join-conversation', conversation._id);
    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);

    return () => {
      socket.emit('leave-conversation', conversation._id);
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
      setIsOtherUserTyping(false);
    };
  }, [conversation._id, currentUserId, dispatch, onMessage, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      const socket = getSocket();
      if (!socket) {
        return;
      }
      socket.emit('typing', {
        conversationId: conversation._id,
        isTyping,
      });
    },
    [conversation._id]
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    const socket = getSocket();
    if (!trimmedMessage || !socket) {
      return;
    }

    try {
      socket.emit('send-message', {
        conversationId: conversation._id,
        receiverId: otherUserId,
        content: trimmedMessage,
      });
      setNewMessage('');
      sendTypingStatus(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    sendTypingStatus(value.trim().length > 0);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      sendTypingStatus(false);
    },
    [sendTypingStatus]
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              {otherUser?.firstName} {otherUser?.lastName}
            </h3>
            <p className="text-xs text-gray-500">
              {isOtherUserOnline ? 'Online' : 'Offline'}
              {isOtherUserTyping && <span className="ml-2 text-primary-500">typing…</span>}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${
              ((message.sender.id ??
                (message.sender as unknown as { _id?: string })?._id ??
                (message.sender as unknown as { id?: string })?.id) === currentUserId
                ? 'justify-end'
                : 'justify-start')
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                (message.sender.id ??
                (message.sender as unknown as { _id?: string })?._id ??
                (message.sender as unknown as { id?: string })?.id) === currentUserId
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-75">
                {new Date(message.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;

