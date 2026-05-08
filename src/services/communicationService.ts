import { apiService } from './api';
import {
  Conversation,
  Message,
  CallSession,
  UserPresence,
  ApiResponse,
  User
} from '../types/communication';

class CommunicationService {
  // ==================== Conversations ====================

  async getConversations(params?: {
    page?: number;
    limit?: number;
    type?: string;
    archived?: boolean;
  }): Promise<ApiResponse<Conversation[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.archived !== undefined) queryParams.append('archived', params.archived.toString());

    const query = queryParams.toString();
    return apiService.get(`/api/communication/conversations${query ? `?${query}` : ''}`);
  }

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return apiService.get(`/api/communication/conversations/${conversationId}`);
  }

  async createConversation(data: {
    type: 'direct' | 'group';
    participants: string[];
    name?: string;
    initialMessage?: string;
  }): Promise<ApiResponse<Conversation>> {
    return apiService.post('/api/communication/conversations', data);
  }

  async updateConversation(conversationId: string, data: {
    name?: string;
    settings?: Partial<Conversation['settings']>;
  }): Promise<ApiResponse<Conversation>> {
    return apiService.put(`/api/communication/conversations/${conversationId}`, data);
  }

  async archiveConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return apiService.post(`/api/communication/conversations/${conversationId}/archive`, {});
  }

  async leaveConversation(conversationId: string): Promise<ApiResponse<void>> {
    return apiService.post(`/api/communication/conversations/${conversationId}/leave`, {});
  }

  async addParticipants(conversationId: string, userIds: string[]): Promise<ApiResponse<Conversation>> {
    return apiService.post(`/api/communication/conversations/${conversationId}/participants`, { userIds });
  }

  async removeParticipant(conversationId: string, userId: string): Promise<ApiResponse<Conversation>> {
    return apiService.delete(`/api/communication/conversations/${conversationId}/participants/${userId}`);
  }

  // ==================== Messages ====================

  async getMessages(conversationId: string, params?: {
    before?: string;
    after?: string;
    limit?: number;
  }): Promise<ApiResponse<Message[]>> {
    const queryParams = new URLSearchParams();
    if (params?.before) queryParams.append('before', params.before);
    if (params?.after) queryParams.append('after', params.after);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiService.get(`/api/communication/messages/${conversationId}${query ? `?${query}` : ''}`);
  }

  async sendMessage(conversationId: string, data: {
    text?: string;
    type?: string;
    attachments?: any[];
    replyTo?: string;
  }): Promise<ApiResponse<Message>> {
    return apiService.post(`/api/communication/messages/${conversationId}`, data);
  }

  async editMessage(messageId: string, text: string): Promise<ApiResponse<Message>> {
    return apiService.put(`/api/communication/messages/${messageId}`, { text });
  }

  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/communication/messages/${messageId}`);
  }

  async addReaction(messageId: string, emoji: string): Promise<ApiResponse<Message>> {
    return apiService.post(`/api/communication/messages/${messageId}/reactions`, { emoji });
  }

  async removeReaction(messageId: string, emoji: string): Promise<ApiResponse<Message>> {
    return apiService.delete(`/api/communication/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  }

  async searchMessages(conversationId: string, query: string): Promise<ApiResponse<Message[]>> {
    return apiService.get(`/api/communication/messages/${conversationId}/search?q=${encodeURIComponent(query)}`);
  }

  async markAsRead(conversationId: string, messageId?: string): Promise<ApiResponse<void>> {
    return apiService.post(`/api/communication/messages/${conversationId}/read`, { messageId });
  }

  // ==================== Calls ====================

  async initiateCall(data: {
    type: 'audio' | 'video';
    participants: string[];
    conversationId?: string;
  }): Promise<ApiResponse<CallSession>> {
    return apiService.post('/api/communication/calls/initiate', data);
  }

  async answerCall(callId: string): Promise<ApiResponse<CallSession>> {
    return apiService.post(`/api/communication/calls/${callId}/answer`, {});
  }

  async declineCall(callId: string): Promise<ApiResponse<CallSession>> {
    return apiService.post(`/api/communication/calls/${callId}/decline`, {});
  }

  async endCall(callId: string): Promise<ApiResponse<CallSession>> {
    return apiService.post(`/api/communication/calls/${callId}/end`, {});
  }

  async updateParticipantState(callId: string, state: {
    hasAudio?: boolean;
    hasVideo?: boolean;
    isScreenSharing?: boolean;
  }): Promise<ApiResponse<void>> {
    return apiService.put(`/api/communication/calls/${callId}/participant-state`, state);
  }

  async getCallHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<CallSession[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiService.get(`/api/communication/calls/history${query ? `?${query}` : ''}`);
  }

  // ==================== Presence ====================

  async updatePresence(status: string, customMessage?: string): Promise<ApiResponse<UserPresence>> {
    return apiService.put('/api/communication/presence/status', { status, customMessage });
  }

  async getMyPresence(): Promise<ApiResponse<UserPresence>> {
    return apiService.get('/api/communication/presence/me');
  }

  async getUserPresence(userId: string): Promise<ApiResponse<UserPresence>> {
    return apiService.get(`/api/communication/presence/${userId}`);
  }

  async getBulkPresence(userIds: string[]): Promise<ApiResponse<UserPresence[]>> {
    return apiService.post('/api/communication/presence/bulk', { userIds });
  }

  async registerDevice(data: {
    deviceId: string;
    deviceType: string;
    platform: string;
    pushToken?: string;
  }): Promise<ApiResponse<void>> {
    return apiService.post('/api/communication/presence/device', data);
  }

  async unregisterDevice(deviceId: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/communication/presence/device/${deviceId}`);
  }

  // ==================== Users ====================

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return apiService.get(`/api/communication/users/search?q=${encodeURIComponent(query)}`);
  }

  async getOrganizationUsers(): Promise<ApiResponse<User[]>> {
    return apiService.get('/api/communication/users');
  }

  // ==================== File Upload ====================

  async uploadFile(formData: FormData): Promise<ApiResponse<{
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }>> {
    return apiService.post('/api/communication/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const communicationService = new CommunicationService();
