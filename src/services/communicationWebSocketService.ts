import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/storage';
import { API_BASE_URL } from '../utils/constants';
import {
  Message,
  WsTypingEvent,
  WsPresenceEvent,
  WsCallEvent,
  WsRTCSignalEvent,
  CallSession
} from '../types/communication';

type EventCallback<T = any> = (data: T) => void;

class CommunicationWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 50;
  private isConnecting = false;
  private userId: string | null = null;

  // Event listeners
  private listeners: Map<string, Set<EventCallback>> = new Map();

  // Event types
  static readonly EVENTS = {
    // Connection
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    // Messages
    NEW_MESSAGE: 'new_message',
    MESSAGE_UPDATED: 'message_updated',
    MESSAGE_DELETED: 'message_deleted',
    MESSAGE_REACTION: 'message_reaction',
    // Typing
    USER_TYPING: 'user_typing',
    USER_STOPPED_TYPING: 'user_stopped_typing',
    // Presence
    PRESENCE_UPDATE: 'presence_update',
    // Conversations
    CONVERSATION_CREATED: 'conversation_created',
    CONVERSATION_UPDATED: 'conversation_updated',
    PARTICIPANT_ADDED: 'participant_added',
    PARTICIPANT_REMOVED: 'participant_removed',
    // Calls
    INCOMING_CALL: 'incoming_call',
    CALL_ANSWERED: 'call_answered',
    CALL_DECLINED: 'call_declined',
    CALL_ENDED: 'call_ended',
    PARTICIPANT_JOINED_CALL: 'participant_joined_call',
    PARTICIPANT_LEFT_CALL: 'participant_left_call',
    // WebRTC Signaling
    RTC_OFFER: 'rtc_offer',
    RTC_ANSWER: 'rtc_answer',
    RTC_ICE_CANDIDATE: 'rtc_ice_candidate',
  };

  async connect(userId: string): Promise<void> {
    if (this.socket?.connected) {
      if (this.userId === userId) return;
      this.disconnect();
    }

    if (this.isConnecting) return;

    this.isConnecting = true;
    this.userId = userId;

    try {
      const token = await getToken();

      // Extract base URL without /api/v1/ suffix
      const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

      // Connect to Socket.IO server with /communication namespace
      this.socket = io(`${baseUrl}/communication`, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      });

      this.socket.on('connect', () => {
        console.log('Communication WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit(CommunicationWebSocketService.EVENTS.CONNECTED, { userId });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Communication WebSocket disconnected:', reason);
        this.isConnecting = false;
        this.emit(CommunicationWebSocketService.EVENTS.DISCONNECTED, {});
      });

      this.socket.on('connect_error', (error) => {
        console.error('Communication WebSocket connection error:', error.message);
        this.isConnecting = false;
      });

      // Set up event listeners for all communication events
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Message events
    this.socket.on('new_message', (data: { conversationId: string; message: Message }) => {
      this.emit(CommunicationWebSocketService.EVENTS.NEW_MESSAGE, data);
    });

    this.socket.on('message_updated', (message: Message) => {
      this.emit(CommunicationWebSocketService.EVENTS.MESSAGE_UPDATED, message);
    });

    this.socket.on('message_deleted', (data: { conversationId: string; messageId: string }) => {
      this.emit(CommunicationWebSocketService.EVENTS.MESSAGE_DELETED, data);
    });

    this.socket.on('message_reaction', (data: any) => {
      this.emit(CommunicationWebSocketService.EVENTS.MESSAGE_REACTION, data);
    });

    // Typing events
    this.socket.on('user_typing', (data: { conversationId: string; userId: string }) => {
      this.emit(CommunicationWebSocketService.EVENTS.USER_TYPING, data);
    });

    this.socket.on('user_stopped_typing', (data: { conversationId: string; userId: string }) => {
      this.emit(CommunicationWebSocketService.EVENTS.USER_STOPPED_TYPING, data);
    });

    // Presence events
    this.socket.on('presence_update', (data: { userId: string; status: string }) => {
      this.emit(CommunicationWebSocketService.EVENTS.PRESENCE_UPDATE, data);
    });

    // Conversation events
    this.socket.on('conversation_created', (data: any) => {
      this.emit(CommunicationWebSocketService.EVENTS.CONVERSATION_CREATED, data);
    });

    this.socket.on('conversation_updated', (data: any) => {
      this.emit(CommunicationWebSocketService.EVENTS.CONVERSATION_UPDATED, data);
    });

    // Call events
    this.socket.on('incoming_call', (call: CallSession) => {
      this.emit(CommunicationWebSocketService.EVENTS.INCOMING_CALL, call);
    });

    this.socket.on('call_answered', (data: { callId: string }) => {
      this.emit(CommunicationWebSocketService.EVENTS.CALL_ANSWERED, data);
    });

    this.socket.on('call_declined', (data: { callId: string }) => {
      this.emit(CommunicationWebSocketService.EVENTS.CALL_DECLINED, data);
    });

    this.socket.on('call_ended', (data: { callId: string }) => {
      this.emit(CommunicationWebSocketService.EVENTS.CALL_ENDED, data);
    });

    // WebRTC signaling events
    this.socket.on('rtc_offer', (data: WsRTCSignalEvent) => {
      this.emit(CommunicationWebSocketService.EVENTS.RTC_OFFER, data);
    });

    this.socket.on('rtc_answer', (data: WsRTCSignalEvent) => {
      this.emit(CommunicationWebSocketService.EVENTS.RTC_ANSWER, data);
    });

    this.socket.on('rtc_ice_candidate', (data: WsRTCSignalEvent) => {
      this.emit(CommunicationWebSocketService.EVENTS.RTC_ICE_CANDIDATE, data);
    });
  }

  disconnect(): void {
    this.userId = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ==================== Event Subscription ====================

  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // ==================== Send Messages ====================

  // Room management
  joinConversation(conversationId: string): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  joinCallRoom(callId: string): void {
    this.socket?.emit('join_call', { callId });
  }

  leaveCallRoom(callId: string): void {
    this.socket?.emit('leave_call', { callId });
  }

  // Typing indicators
  startTyping(conversationId: string): void {
    this.socket?.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit('typing_stop', { conversationId });
  }

  // Presence
  updatePresence(status: string, customMessage?: string): void {
    this.socket?.emit('presence_update', { status, customMessage });
  }

  // WebRTC Signaling
  sendOffer(callId: string, targetUserId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit('rtc_offer', { callId, targetUserId, sdp });
  }

  sendAnswer(callId: string, targetUserId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit('rtc_answer', { callId, targetUserId, sdp });
  }

  sendIceCandidate(callId: string, targetUserId: string, candidate: RTCIceCandidateInit): void {
    this.socket?.emit('rtc_ice_candidate', { callId, targetUserId, candidate });
  }

  // Utility
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const communicationWsService = new CommunicationWebSocketService();
