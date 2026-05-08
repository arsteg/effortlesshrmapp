import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
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
} from '../store/slices/communicationSlice';
import { communicationWsService } from '../services/communicationWebSocketService';
import { Message, CallSession } from '../types/communication';

/**
 * Hook to initialize and manage the communication WebSocket connection
 * Should be used in the root component when user is authenticated
 */
export function useCommunicationInit() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Connect to WebSocket
      communicationWsService.connect(user.id);

      // Set up event listeners
      const unsubscribers: (() => void)[] = [];

      // Connection events
      unsubscribers.push(
        communicationWsService.on('connected', () => {
          dispatch(setConnected(true));
        })
      );

      unsubscribers.push(
        communicationWsService.on('disconnected', () => {
          dispatch(setConnected(false));
        })
      );

      // Message events
      unsubscribers.push(
        communicationWsService.on('new_message', (data: { conversationId: string; message: Message }) => {
          dispatch(addMessage(data));
        })
      );

      unsubscribers.push(
        communicationWsService.on('message_updated', (message: Message) => {
          dispatch(updateMessage(message));
        })
      );

      unsubscribers.push(
        communicationWsService.on('message_deleted', (data: { conversationId: string; messageId: string }) => {
          dispatch(removeMessage(data));
        })
      );

      // Typing events
      unsubscribers.push(
        communicationWsService.on('user_typing', (data: { conversationId: string; userId: string }) => {
          dispatch(setUserTyping(data));

          // Auto-clear typing after 3 seconds
          setTimeout(() => {
            dispatch(clearUserTyping(data));
          }, 3000);
        })
      );

      unsubscribers.push(
        communicationWsService.on('user_stopped_typing', (data: { conversationId: string; userId: string }) => {
          dispatch(clearUserTyping(data));
        })
      );

      // Presence events
      unsubscribers.push(
        communicationWsService.on('presence_update', (data: { userId: string; status: string }) => {
          dispatch(updateUserPresence(data));
        })
      );

      // Call events
      unsubscribers.push(
        communicationWsService.on('incoming_call', (call: CallSession) => {
          dispatch(setIncomingCall(call));
        })
      );

      unsubscribers.push(
        communicationWsService.on('call_answered', (data: { callId: string }) => {
          dispatch(updateCallStatus({ callId: data.callId, status: 'active' }));
        })
      );

      unsubscribers.push(
        communicationWsService.on('call_declined', (data: { callId: string }) => {
          dispatch(updateCallStatus({ callId: data.callId, status: 'declined' }));
          dispatch(setIncomingCall(null));
        })
      );

      unsubscribers.push(
        communicationWsService.on('call_ended', (data: { callId: string }) => {
          dispatch(updateCallStatus({ callId: data.callId, status: 'ended' }));
          dispatch(setActiveCall(null));
          dispatch(setIncomingCall(null));
        })
      );

      // Cleanup
      return () => {
        unsubscribers.forEach((unsub) => unsub());
        communicationWsService.disconnect();
      };
    }
  }, [isAuthenticated, user?.id, dispatch]);
}

/**
 * Hook to get typing status for a conversation
 */
export function useTypingStatus(conversationId: string) {
  const typingUsers = useAppSelector(
    (state) => state.communication.typingUsers[conversationId] || []
  );

  return typingUsers;
}

/**
 * Hook to get presence status for a user
 */
export function usePresenceStatus(userId: string) {
  const status = useAppSelector(
    (state) => state.communication.presenceMap[userId] || 'offline'
  );

  return status;
}

/**
 * Hook to check if there's an active or incoming call
 */
export function useCallStatus() {
  const activeCall = useAppSelector((state) => state.communication.activeCall);
  const incomingCall = useAppSelector((state) => state.communication.incomingCall);

  return {
    activeCall,
    incomingCall,
    hasActiveCall: !!activeCall,
    hasIncomingCall: !!incomingCall,
  };
}

/**
 * Hook for sending typing indicators
 */
export function useTypingIndicator(conversationId: string) {
  const sendTyping = useCallback(() => {
    communicationWsService.startTyping(conversationId);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    communicationWsService.stopTyping(conversationId);
  }, [conversationId]);

  return { sendTyping, stopTyping };
}

export default useCommunicationInit;
