import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { initializeSocket, disconnectSocket } from '../../utils/socket';
import axiosInstance from '../../api/axiosInstance';
import { Conversation, Message } from '../../types';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import { markConversationRead, setActiveConversationId } from '../../features/chat/chatSlice';

interface LocationState {
  startWithUserId?: string;
}

const ChatPage = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const onlineUsers = useAppSelector((state) => state.chat.onlineUsers);
  const unreadByConversation = useAppSelector((state) => state.chat.unreadByConversation);
  const conversationsVersion = useAppSelector((state) => state.chat.conversationsVersion);
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitiatedFromStateRef = useRef(false);

  const currentUserId =
    user?.id ??
    (user as unknown as { _id?: string })?._id ??
    (user as unknown as { id?: string })?.id ??
    '';

  const startWithUserId = (location.state as LocationState | null)?.startWithUserId;

  const getParticipantId = useCallback((participant: Conversation['participants'][number]): string => {
    return (
      participant.id ??
      (participant as unknown as { _id?: string })?._id ??
      (participant as unknown as { id?: string })?.id ??
      ''
    );
  }, []);

  useEffect(() => {
    if (accessToken) {
      initializeSocket(accessToken);
    }

    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/chat/conversations');
      const fetched: Conversation[] = response.data.data.conversations;
      setConversations(fetched);
      setSelectedConversationId((prev) => {
        if (prev && fetched.some((conversation) => conversation._id === prev)) {
          return prev;
        }
        return fetched[0]?._id ?? null;
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationsVersion > 0) {
      fetchConversations();
    }
  }, [conversationsVersion, fetchConversations]);

  const handleStartConversation = useCallback(
    async (userId: string): Promise<Conversation | null> => {
    try {
      const response = await axiosInstance.post('/chat/conversations', {
        receiverId: userId,
      });
      const newConversation = response.data.data.conversation;
      setConversations((prev) => {
        const filtered = prev.filter((conversation) => conversation._id !== newConversation._id);
        return [newConversation, ...filtered];
      });
      setSelectedConversationId(newConversation._id);
      dispatch(setActiveConversationId(newConversation._id));
      dispatch(markConversationRead({ conversationId: newConversation._id }));
      return newConversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      return null;
    }
  }, [dispatch]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    dispatch(setActiveConversationId(conversationId));
    dispatch(markConversationRead({ conversationId }));
  };

  const handleConversationMessage = useCallback((message: Message) => {
    const conversationId =
      typeof message.conversation === 'string'
        ? message.conversation
        : (message.conversation as unknown as { _id?: string })?._id ?? '';

    if (!conversationId) {
      return;
    }

    setConversations((prev) => {
      const existing = prev.find((conversation) => conversation._id === conversationId);
      if (!existing) {
        return prev;
      }

      const updatedConversation: Conversation = {
        ...existing,
        lastMessage: message,
        lastMessageAt: message.createdAt,
      };

      const others = prev.filter((conversation) => conversation._id !== conversationId);
      return [updatedConversation, ...others];
    });
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      dispatch(markConversationRead({ conversationId: selectedConversationId }));
    }
  }, [dispatch, selectedConversationId]);

  useEffect(() => {
    return () => {
      dispatch(setActiveConversationId(null));
    };
  }, [dispatch]);

  useEffect(() => {
    hasInitiatedFromStateRef.current = false;
  }, [startWithUserId]);

  useEffect(() => {
    const targetUserId = startWithUserId;
    if (!targetUserId || loading || hasInitiatedFromStateRef.current) {
      return;
    }

    const existingConversation = conversations.find((conversation) =>
      conversation.participants.some((participant) => getParticipantId(participant) === targetUserId)
    );

    const initiateChat = async () => {
      hasInitiatedFromStateRef.current = true;
      if (existingConversation) {
        setSelectedConversationId(existingConversation._id);
        dispatch(setActiveConversationId(existingConversation._id));
        dispatch(markConversationRead({ conversationId: existingConversation._id }));
        navigate('/dashboard/chat', { replace: true });
        return;
      }

      const created = await handleStartConversation(targetUserId);
      if (created) {
        navigate('/dashboard/chat', { replace: true });
      }
    };

    void initiateChat();
  }, [
    conversations,
    dispatch,
    getParticipantId,
    handleStartConversation,
    loading,
    navigate,
    startWithUserId,
  ]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex">
      <div className="w-1/3">
        <ChatList
          conversations={conversations}
          currentUserId={currentUserId}
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId ?? undefined}
          onlineUsers={onlineUsers}
          unreadCounts={unreadByConversation}
          onStartConversation={handleStartConversation}
        />
      </div>
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUserId={currentUserId}
            onMessage={handleConversationMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

