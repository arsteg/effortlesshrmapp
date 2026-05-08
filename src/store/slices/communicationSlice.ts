import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { communicationService } from '../../services/communicationService';
import { communicationWsService } from '../../services/communicationWebSocketService';
import {
  Conversation,
  Message,
  CallSession,
  UserPresence,
  User
} from '../../types/communication';

interface CommunicationState {
  // Conversations
  conversations: Conversation[];
  selectedConversationId: string | null;
  conversationsLoading: boolean;
  conversationsError: string | null;

  // Messages
  messages: Record<string, Message[]>;
  messagesLoading: boolean;
  messagesError: string | null;
  hasMoreMessages: Record<string, boolean>;

  // Typing indicators
  typingUsers: Record<string, string[]>;

  // Presence
  presenceMap: Record<string, string>;
  myPresence: UserPresence | null;

  // Calls
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  callHistory: CallSession[];

  // UI state
  unreadTotal: number;
  isConnected: boolean;
}

const initialState: CommunicationState = {
  conversations: [],
  selectedConversationId: null,
  conversationsLoading: false,
  conversationsError: null,
  messages: {},
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: {},
  typingUsers: {},
  presenceMap: {},
  myPresence: null,
  activeCall: null,
  incomingCall: null,
  callHistory: [],
  unreadTotal: 0,
  isConnected: false,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'communication/fetchConversations',
  async (params: { page?: number; type?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await communicationService.getConversations(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const createConversation = createAsyncThunk(
  'communication/createConversation',
  async (
    data: { type: 'direct' | 'group'; participants: string[]; name?: string; initialMessage?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await communicationService.createConversation(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create conversation');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'communication/fetchMessages',
  async (
    { conversationId, before }: { conversationId: string; before?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await communicationService.getMessages(conversationId, { before, limit: 50 });
      return {
        conversationId,
        messages: response.data,
        hasMore: response.pagination?.hasMore || false,
        prepend: !!before,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'communication/sendMessage',
  async (
    { conversationId, text, attachments, replyTo }: {
      conversationId: string;
      text?: string;
      attachments?: any[];
      replyTo?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await communicationService.sendMessage(conversationId, {
        text,
        attachments,
        replyTo,
      });
      return { conversationId, message: response.data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'communication/deleteMessage',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await communicationService.deleteMessage(messageId);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete message');
    }
  }
);

export const initiateCall = createAsyncThunk(
  'communication/initiateCall',
  async (
    data: { type: 'audio' | 'video'; participants: string[]; conversationId?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await communicationService.initiateCall(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initiate call');
    }
  }
);

export const answerCall = createAsyncThunk(
  'communication/answerCall',
  async (callId: string, { rejectWithValue }) => {
    try {
      const response = await communicationService.answerCall(callId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to answer call');
    }
  }
);

export const declineCall = createAsyncThunk(
  'communication/declineCall',
  async (callId: string, { rejectWithValue }) => {
    try {
      const response = await communicationService.declineCall(callId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to decline call');
    }
  }
);

export const endCall = createAsyncThunk(
  'communication/endCall',
  async (callId: string, { rejectWithValue }) => {
    try {
      const response = await communicationService.endCall(callId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to end call');
    }
  }
);

export const updatePresence = createAsyncThunk(
  'communication/updatePresence',
  async (
    { status, customMessage }: { status: string; customMessage?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await communicationService.updatePresence(status, customMessage);
      // Also update via WebSocket for real-time propagation
      communicationWsService.updatePresence(status, customMessage);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update presence');
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'communication/markAsRead',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await communicationService.markAsRead(conversationId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark as read');
    }
  }
);

const communicationSlice = createSlice({
  name: 'communication',
  initialState,
  reducers: {
    setSelectedConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload;
    },

    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },

    // Real-time message handlers
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      // Check if message already exists
      if (!state.messages[conversationId].find(m => m._id === message._id)) {
        state.messages[conversationId].push(message);
      }

      // Update conversation's last message and activity
      const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        state.conversations[conversationIndex].lastActivity = message.createdAt;

        // Increment unread count if not the selected conversation
        if (state.selectedConversationId !== conversationId) {
          state.conversations[conversationIndex].unreadCount++;
          state.unreadTotal++;
        }

        // Move conversation to top
        const [conversation] = state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(conversation);
      }
    },

    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const messages = state.messages[message.conversationId];
      if (messages) {
        const index = messages.findIndex(m => m._id === message._id);
        if (index !== -1) {
          messages[index] = message;
        }
      }
    },

    removeMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const { conversationId, messageId } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        const index = messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          messages.splice(index, 1);
        }
      }
    },

    // Typing indicators
    setUserTyping: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId);
      }
    },

    clearUserTyping: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          id => id !== userId
        );
      }
    },

    // Presence
    updateUserPresence: (state, action: PayloadAction<{ userId: string; status: string }>) => {
      const { userId, status } = action.payload;
      state.presenceMap[userId] = status;
    },

    // Calls
    setIncomingCall: (state, action: PayloadAction<CallSession | null>) => {
      state.incomingCall = action.payload;
    },

    setActiveCall: (state, action: PayloadAction<CallSession | null>) => {
      state.activeCall = action.payload;
    },

    updateCallStatus: (state, action: PayloadAction<{ callId: string; status: CallSession['status'] }>) => {
      if (state.activeCall?._id === action.payload.callId) {
        state.activeCall.status = action.payload.status;
      }
      if (state.incomingCall?._id === action.payload.callId) {
        state.incomingCall.status = action.payload.status;
      }
    },

    // Clear conversation unread
    clearUnread: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      if (conversation && conversation.unreadCount > 0) {
        state.unreadTotal -= conversation.unreadCount;
        conversation.unreadCount = 0;
      }
    },

    // Reset state
    resetCommunicationState: () => initialState,
  },

  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.conversationsError = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload;
        state.unreadTotal = action.payload.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsLoading = false;
        state.conversationsError = action.payload as string;
      });

    // Create conversation
    builder
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.selectedConversationId = action.payload._id;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { conversationId, messages, hasMore, prepend } = action.payload;

        if (prepend && state.messages[conversationId]) {
          state.messages[conversationId] = [...messages.reverse(), ...state.messages[conversationId]];
        } else {
          state.messages[conversationId] = messages.reverse();
        }
        state.hasMoreMessages[conversationId] = hasMore;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        // Replace temp message or add new one
        const tempIndex = state.messages[conversationId].findIndex(
          m => m.sending && m.content?.text === message.content?.text
        );
        if (tempIndex !== -1) {
          state.messages[conversationId][tempIndex] = message;
        } else {
          state.messages[conversationId].push(message);
        }

        // Update conversation
        const convIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (convIndex !== -1) {
          state.conversations[convIndex].lastMessage = message;
          state.conversations[convIndex].lastActivity = message.createdAt;
          const [conv] = state.conversations.splice(convIndex, 1);
          state.conversations.unshift(conv);
        }
      });

    // Initiate call
    builder
      .addCase(initiateCall.fulfilled, (state, action) => {
        state.activeCall = action.payload;
      });

    // Answer call
    builder
      .addCase(answerCall.fulfilled, (state, action) => {
        state.activeCall = action.payload;
        state.incomingCall = null;
      });

    // Decline call
    builder
      .addCase(declineCall.fulfilled, (state) => {
        state.incomingCall = null;
      });

    // End call
    builder
      .addCase(endCall.fulfilled, (state) => {
        state.activeCall = null;
      });

    // Update presence
    builder
      .addCase(updatePresence.fulfilled, (state, action) => {
        state.myPresence = action.payload;
      });

    // Mark as read
    builder
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const conversation = state.conversations.find(c => c._id === conversationId);
        if (conversation && conversation.unreadCount > 0) {
          state.unreadTotal -= conversation.unreadCount;
          conversation.unreadCount = 0;
        }
      });
  },
});

export const {
  setSelectedConversation,
  setConnected,
  addMessage,
  updateMessage,
  removeMessage,
  setUserTyping,
  clearUserTyping,
  updateUserPresence,
  setIncomingCall,
  setActiveCall,
  updateCallStatus,
  clearUnread,
  resetCommunicationState,
} = communicationSlice.actions;

export default communicationSlice.reducer;
