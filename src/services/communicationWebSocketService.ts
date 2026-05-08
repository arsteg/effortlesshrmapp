import { getToken } from '../utils/storage';
import { WEBSOCKET_URL } from '../utils/constants';
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
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 50;
  private isConnecting = false;
  private heartbeatInterval: any = null;
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
    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.userId === userId) return;
      this.disconnect();
    }

    if (this.isConnecting) return;

    this.isConnecting = true;
    this.userId = userId;

    try {
      const token = await getToken();
      // Connect to communication-specific WebSocket endpoint
      const wsUrl = `${WEBSOCKET_URL}/communication?token=${token}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('Communication WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit(CommunicationWebSocketService.EVENTS.CONNECTED, { userId });
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('Communication WebSocket error:', error);
        this.isConnecting = false;
      };

      this.socket.onclose = (event) => {
        console.log('Communication WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit(CommunicationWebSocketService.EVENTS.DISCONNECTED, {});

        // Attempt reconnection
        if (this.userId && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          this.reconnectAttempts++;
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          setTimeout(() => {
            if (this.userId) this.connect(this.userId);
          }, delay);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    this.userId = null;
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const { event, payload } = message;

      if (event) {
        this.emit(event, payload);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send('ping', {});
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
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

  private send(event: string, payload: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, payload }));
    }
  }

  // Room management
  joinConversation(conversationId: string): void {
    this.send('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.send('leave_conversation', { conversationId });
  }

  joinCallRoom(callId: string): void {
    this.send('join_call', { callId });
  }

  leaveCallRoom(callId: string): void {
    this.send('leave_call', { callId });
  }

  // Typing indicators
  startTyping(conversationId: string): void {
    this.send('typing_start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.send('typing_stop', { conversationId });
  }

  // Presence
  updatePresence(status: string, customMessage?: string): void {
    this.send('presence_update', { status, customMessage });
  }

  // WebRTC Signaling
  sendOffer(callId: string, targetUserId: string, sdp: RTCSessionDescriptionInit): void {
    this.send('rtc_offer', { callId, targetUserId, sdp });
  }

  sendAnswer(callId: string, targetUserId: string, sdp: RTCSessionDescriptionInit): void {
    this.send('rtc_answer', { callId, targetUserId, sdp });
  }

  sendIceCandidate(callId: string, targetUserId: string, candidate: RTCIceCandidateInit): void {
    this.send('rtc_ice_candidate', { callId, targetUserId, candidate });
  }

  // Utility
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const communicationWsService = new CommunicationWebSocketService();
