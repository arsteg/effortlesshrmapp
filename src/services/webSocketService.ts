import { WEBSOCKET_URL } from '../utils/constants';

export enum WebSocketNotificationType {
    LOG = 'log',
    ALERT = 'alert',
    NOTIFICATION = 'notification',
    SCREENSHOT = 'screenshot',
    CHAT = 'chat'
}

export enum WebSocketContentType {
    TEXT = 'text',
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video',
    FILE = 'file',
    JSON = 'json'
}

export interface WebSocketMessage {
    notificationType: WebSocketNotificationType;
    contentType: WebSocketContentType;
    content: string;
    sourceUserId?: string;
    timestamp: string;
}

type MessageCallback = (message: WebSocketMessage) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private userId: string | null = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 100;
    private listeners: Map<WebSocketNotificationType, Set<MessageCallback>> = new Map();
    private heartbeatInterval: any = null;

    connect(userId: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            if (this.userId === userId) {
                return;
            }
            this.disconnect();
        }

        this.userId = userId;
        this.socket = new WebSocket(WEBSOCKET_URL);

        this.socket.onopen = () => {
            console.log(`WebSocket connected`);
            this.reconnectAttempts = 0;
            if (this.userId) {
                this.authenticate(this.userId);
            }
            this.startHeartbeat();
        };

        this.socket.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                const typeListeners = this.listeners.get(message.notificationType);
                if (typeListeners) {
                    typeListeners.forEach(callback => callback(message));
                }
            } catch (error) {
                // Ignore non-JSON messages or special formats
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket closed:', event.reason);
            this.stopHeartbeat();

            if (this.userId && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                this.reconnectAttempts++;
                setTimeout(() => {
                    if (this.userId) this.connect(this.userId);
                }, delay);
            }
        };
    }

    authenticate(userId: string): void {
        this.userId = userId; // Keep track of at least one for reconnect
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'auth', userId }));
            console.log(`Authenticated as ${userId}`);
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.sendMessage({
                notificationType: WebSocketNotificationType.NOTIFICATION,
                contentType: WebSocketContentType.TEXT,
                content: 'ping',
                timestamp: new Date().toISOString()
            });
        }, 10000);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
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

    subscribe(type: WebSocketNotificationType, callback: MessageCallback): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(callback);

        return () => {
            const typeListeners = this.listeners.get(type);
            if (typeListeners) {
                typeListeners.delete(callback);
            }
        };
    }

    sendMessage(message: Partial<WebSocketMessage>): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}

export const webSocketService = new WebSocketService();
