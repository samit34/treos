import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UnreadEntry {
  conversationId: string;
  count: number;
}

export interface ChatNotification {
  id: string;
  conversationId: string;
  senderName: string;
  preview: string;
  timestamp: string;
}

interface ChatState {
  onlineUsers: string[];
  unreadTotal: number;
  unreadByConversation: Record<string, number>;
  notifications: ChatNotification[];
  conversationsVersion: number;
  activeConversationId: string | null;
}

const initialState: ChatState = {
  onlineUsers: [],
  unreadTotal: 0,
  unreadByConversation: {},
  notifications: [],
  conversationsVersion: 0,
  activeConversationId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    userOnline: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    userOffline: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter((userId) => userId !== action.payload);
    },
    setUnreadSummary: (state, action: PayloadAction<{ total: number; conversations: UnreadEntry[] }>) => {
      state.unreadTotal = action.payload.total;
      state.unreadByConversation = action.payload.conversations.reduce<Record<string, number>>(
        (acc, entry) => {
          acc[entry.conversationId] = entry.count;
          return acc;
        },
        {}
      );
    },
    incrementUnread: (state, action: PayloadAction<{ conversationId: string }>) => {
      state.unreadTotal += 1;
      state.unreadByConversation[action.payload.conversationId] =
        (state.unreadByConversation[action.payload.conversationId] ?? 0) + 1;
    },
    markConversationRead: (state, action: PayloadAction<{ conversationId: string }>) => {
      const current = state.unreadByConversation[action.payload.conversationId] ?? 0;
      if (current > 0) {
        state.unreadTotal = Math.max(state.unreadTotal - current, 0);
      }
      delete state.unreadByConversation[action.payload.conversationId];
    },
    addNotification: (state, action: PayloadAction<ChatNotification>) => {
      const existing = state.notifications.find((notification) => notification.id === action.payload.id);
      if (existing) {
        return;
      }
      state.notifications = [action.payload, ...state.notifications].slice(0, 5);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    incrementConversationsVersion: (state) => {
      state.conversationsVersion += 1;
    },
    setActiveConversationId: (state, action: PayloadAction<string | null | undefined>) => {
      state.activeConversationId = action.payload ?? null;
    },
  },
});

export const {
  setOnlineUsers,
  userOnline,
  userOffline,
  setUnreadSummary,
  incrementUnread,
  markConversationRead,
  addNotification,
  removeNotification,
  clearNotifications,
  incrementConversationsVersion,
  setActiveConversationId,
} = chatSlice.actions;

export default chatSlice.reducer;


