import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { answerCall, declineCall } from '../../store/slices/communicationSlice';
import { useNavigation } from '@react-navigation/native';
import { User, CallSession } from '../../types/communication';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IncomingCallOverlayProps {
  visible: boolean;
  call: CallSession | null;
  onClose: () => void;
}

const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
  visible,
  call,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);

  if (!call) return null;

  const getCallerName = (): string => {
    if (typeof call.initiator === 'object') {
      const initiator = call.initiator as User;
      return `${initiator.firstName} ${initiator.lastName}`;
    }
    return 'Unknown';
  };

  const getCallerAvatar = (): string | undefined => {
    if (typeof call.initiator === 'object') {
      return (call.initiator as User).profilePicture;
    }
    return undefined;
  };

  const handleAnswer = async () => {
    try {
      await dispatch(answerCall(call._id)).unwrap();
      onClose();
      navigation.navigate('Call', {
        incomingCallId: call._id,
        callType: call.type,
      });
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await dispatch(declineCall(call._id));
      onClose();
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDecline}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.callerInfo}>
            <View style={styles.avatarContainer}>
              {getCallerAvatar() ? (
                <Image source={{ uri: getCallerAvatar() }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getCallerName().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.pulseRing} />
            </View>
            <Text style={styles.callerName}>{getCallerName()}</Text>
            <View style={styles.callTypeContainer}>
              <Ionicons
                name={call.type === 'video' ? 'videocam' : 'call'}
                size={18}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.callTypeText}>
                Incoming {call.type === 'video' ? 'video' : 'voice'} call
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
            >
              <Ionicons name="close" size={32} color="#fff" />
              <Text style={styles.actionLabel}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.answerButton]}
              onPress={handleAnswer}
            >
              <Ionicons
                name={call.type === 'video' ? 'videocam' : 'call'}
                size={32}
                color="#fff"
              />
              <Text style={styles.actionLabel}>Answer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#1976d2',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  pulseRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  callerName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callTypeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  answerButton: {
    backgroundColor: '#4caf50',
  },
  actionLabel: {
    position: 'absolute',
    bottom: -24,
    color: '#fff',
    fontSize: 12,
  },
});

export default IncomingCallOverlay;
