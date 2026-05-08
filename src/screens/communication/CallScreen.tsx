import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  initiateCall,
  endCall,
  setActiveCall,
} from '../../store/slices/communicationSlice';
import { communicationWsService } from '../../services/communicationWebSocketService';
import { communicationService } from '../../services/communicationService';
import { formatDuration } from '../../utils/dateUtils';
import { User, CallSession } from '../../types/communication';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CallScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const { conversationId, callType, incomingCallId } = route.params || {};

  const { conversations, activeCall, incomingCall } = useAppSelector(
    (state) => state.communication
  );
  const { user } = useAppSelector((state) => state.auth);

  const conversation = conversations.find((c) => c._id === conversationId);
  const currentCall = activeCall || incomingCall;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<string>(incomingCallId ? 'incoming' : 'calling');

  const durationIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Initialize call
    if (incomingCallId) {
      // Joining existing call
      setCallStatus('connecting');
    } else if (conversationId) {
      // Starting new call
      startNewCall();
    }

    // Subscribe to call events
    const unsubCallEnded = communicationWsService.on('call_ended', handleCallEnded);
    const unsubCallAnswered = communicationWsService.on('call_answered', handleCallAnswered);

    return () => {
      unsubCallEnded();
      unsubCallAnswered();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startNewCall = async () => {
    if (!conversation) return;

    const participants = conversation.participants
      .map((p) => (typeof p.userId === 'string' ? p.userId : (p.userId as User)._id))
      .filter((id) => id !== user?.id);

    try {
      const result = await dispatch(
        initiateCall({
          type: callType,
          participants,
          conversationId,
        })
      ).unwrap();

      communicationWsService.joinCallRoom(result._id);
      setCallStatus('ringing');
    } catch (error) {
      console.error('Failed to initiate call:', error);
      Alert.alert('Error', 'Failed to start call');
      navigation.goBack();
    }
  };

  const handleCallAnswered = (data: any) => {
    setCallStatus('active');
    startDurationTimer();
  };

  const handleCallEnded = (data: any) => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    dispatch(setActiveCall(null));
    navigation.goBack();
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleEndCall = async () => {
    if (currentCall) {
      try {
        await dispatch(endCall(currentCall._id));
        communicationWsService.leaveCallRoom(currentCall._id);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    navigation.goBack();
  };

  const toggleMute = async () => {
    setIsMuted(!isMuted);
    if (currentCall) {
      await communicationService.updateParticipantState(currentCall._id, {
        hasAudio: isMuted, // Toggling, so current value is opposite
      });
    }
  };

  const toggleVideo = async () => {
    setIsVideoOff(!isVideoOff);
    if (currentCall) {
      await communicationService.updateParticipantState(currentCall._id, {
        hasVideo: isVideoOff, // Toggling, so current value is opposite
      });
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real app, this would toggle the audio output
  };

  const getOtherUser = (): User | null => {
    if (!conversation || conversation.type !== 'direct') return null;

    const otherParticipant = conversation.participants.find((p) => {
      const participantId = typeof p.userId === 'string' ? p.userId : (p.userId as User)._id;
      return participantId !== user?.id;
    });

    if (otherParticipant && typeof otherParticipant.userId === 'object') {
      return otherParticipant.userId as User;
    }

    return null;
  };

  const getCallPartnerName = (): string => {
    const otherUser = getOtherUser();
    if (otherUser) {
      return `${otherUser.firstName} ${otherUser.lastName}`;
    }
    if (conversation?.name) {
      return conversation.name;
    }
    return 'Unknown';
  };

  const getStatusText = (): string => {
    switch (callStatus) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'active':
        return formatDuration(callDuration);
      case 'incoming':
        return 'Incoming call';
      default:
        return callStatus;
    }
  };

  const otherUser = getOtherUser();

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background}>
        {callType === 'video' && !isVideoOff ? (
          // Placeholder for video - in a real app, this would be the RTCView
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>Video Stream</Text>
          </View>
        ) : (
          <View style={styles.audioBackground} />
        )}
      </View>

      {/* Call info */}
      <View style={styles.callInfo}>
        <View style={styles.avatarContainer}>
          {otherUser?.profilePicture ? (
            <Image source={{ uri: otherUser.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {getCallPartnerName().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.callerName}>{getCallPartnerName()}</Text>
        <Text style={styles.callStatus}>{getStatusText()}</Text>
      </View>

      {/* Local video preview (for video calls) */}
      {callType === 'video' && !isVideoOff && (
        <View style={styles.localVideoContainer}>
          <View style={styles.localVideoPlaceholder}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Top row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color={isMuted ? '#f44336' : '#fff'}
            />
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {callType === 'video' && (
            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={toggleVideo}
            >
              <Ionicons
                name={isVideoOff ? 'videocam-off' : 'videocam'}
                size={24}
                color={isVideoOff ? '#f44336' : '#fff'}
              />
              <Text style={styles.controlLabel}>{isVideoOff ? 'Start Video' : 'Stop Video'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-low'}
              size={24}
              color="#fff"
            />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>

        {/* End call button */}
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Ionicons name="call" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#666',
    fontSize: 18,
  },
  audioBackground: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  callInfo: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  callerName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  localVideoContainer: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 48,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 32,
  },
  controlButton: {
    alignItems: 'center',
    width: 72,
  },
  controlButtonActive: {
    // Style for active state
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    transform: [{ rotate: '135deg' }],
  },
});

export default CallScreen;
