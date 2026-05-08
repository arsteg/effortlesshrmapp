// Communication Types for React Native App

export interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  avatar?: string;
  participants: ConversationParticipant[];
  settings?: ConversationSettings;
  lastMessage?: Message;
  lastActivity: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  userId: string | User;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastReadAt?: string;
  notifications: 'all' | 'mentions' | 'none';
}

export interface ConversationSettings {
  isPinned: boolean;
  isMuted: boolean;
  muteUntil?: string;
  isArchived: boolean;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  department?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | User;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'call' | 'system';
  content?: {
    text?: string;
  };
  attachments?: Attachment[];
  replyTo?: string | Message;
  reactions?: Reaction[];
  threadCount?: number;
  readBy?: { userId: string; readAt: string }[];
  deliveredTo?: { userId: string; deliveredAt: string }[];
  metadata?: Record<string, any>;
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  // UI state
  sending?: boolean;
  failed?: boolean;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface CallSession {
  _id: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'connecting' | 'active' | 'ended' | 'missed' | 'declined';
  initiator: string | User;
  participants: CallParticipant[];
  startedAt?: string;
  endedAt?: string;
  iceServers?: RTCIceServer[];
  createdAt: string;
  updatedAt: string;
}

export interface CallParticipant {
  userId: string | User;
  status: 'invited' | 'ringing' | 'connecting' | 'connected' | 'left' | 'declined';
  joinedAt?: string;
  leftAt?: string;
  hasAudio: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'dnd' | 'offline' | 'invisible';
  customMessage?: string;
  lastSeen?: string;
  devices: DeviceInfo[];
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'desktop' | 'web' | 'tablet';
  platform: string;
  isActive: boolean;
  lastActive: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// WebSocket Event Types
export interface WsTypingEvent {
  conversationId: string;
  userId: string;
  userName?: string;
}

export interface WsPresenceEvent {
  userId: string;
  status: string;
  customMessage?: string;
}

export interface WsMessageEvent {
  conversationId: string;
  message: Message;
}

export interface WsCallEvent {
  callId: string;
  type: 'audio' | 'video';
  initiator: User;
  participants: string[];
}

export interface WsRTCSignalEvent {
  callId: string;
  fromUserId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
