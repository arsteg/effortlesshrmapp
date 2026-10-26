import React from 'react';
import { useCommunicationInit } from '../hooks/useCommunication';

interface CommunicationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes the communication WebSocket connection
 * when the user is authenticated. This should wrap the main app content.
 */
export function CommunicationProvider({ children }: CommunicationProviderProps) {
  // Initialize communication WebSocket connection
  useCommunicationInit();

  return <>{children}</>;
}

export default CommunicationProvider;
