import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchMessages,
  sendMessage,
  markConversationAsRead,
} from '../../store/slices/communicationSlice';
import { communicationWsService } from '../../services/communicationWebSocketService';
import { Message, User, Conversation } from '../../types/communication';
import { formatTime, formatDateSeparator, isSameDay } from '../../utils/dateUtils';

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);

  const { conversationId } = route.params;

  const { conversations, messages, messagesLoading, hasMoreMessages, typingUsers, presenceMap } =
    useAppSelector((state) => state.communication);
  const { user } = useAppSelector((state) => state.auth);

  const conversation = conversations.find((c) => c._id === conversationId);
  const conversationMessages = messages[conversationId] || [];
  const typingInConversation = typingUsers[conversationId] || [];

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchMessages({ conversationId }));
      dispatch(markConversationAsRead(conversationId));
      communicationWsService.joinConversation(conversationId);
    }

    return () => {
      if (conversationId) {
        communicationWsService.leaveConversation(conversationId);
        if (isTyping) {
          communicationWsService.stopTyping(conversationId);
        }
      }
    };
  }, [conversationId, dispatch]);

  const getConversationName = (): string => {
    if (!conversation) return '';
    if (conversation.name) return conversation.name;

    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find((p) => {
        const participantId = typeof p.userId === 'string' ? p.userId : (p.userId as User)._id;
        return participantId !== user?.id;
      });

      if (otherParticipant && typeof otherParticipant.userId === 'object') {
        const otherUser = otherParticipant.userId as User;
        return `${otherUser.firstName} ${otherUser.lastName}`;
      }
    }

    return 'Conversation';
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

  const getPresenceStatus = (): string => {
    const otherUser = getOtherUser();
    if (otherUser) {
      return presenceMap[otherUser._id] || 'offline';
    }
    return 'offline';
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);

    // Handle typing indicator
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      communicationWsService.startTyping(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        communicationWsService.stopTyping(conversationId);
      }
    }, 2000);
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;

    setMessageText('');
    Keyboard.dismiss();

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      communicationWsService.stopTyping(conversationId);
    }

    await dispatch(sendMessage({ conversationId, text }));
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages[conversationId] && !messagesLoading && conversationMessages.length > 0) {
      const oldestMessage = conversationMessages[0];
      dispatch(fetchMessages({ conversationId, before: oldestMessage.createdAt }));
    }
  };

  const handleCall = (type: 'audio' | 'video') => {
    navigation.navigate('Call', { conversationId, callType: type });
  };

  const isOwnMessage = (message: Message): boolean => {
    const senderId = typeof message.senderId === 'string'
      ? message.senderId
      : (message.senderId as User)._id;
    return senderId === user?.id;
  };

  const getSenderName = (message: Message): string => {
    if (typeof message.senderId === 'object') {
      const sender = message.senderId as User;
      return `${sender.firstName} ${sender.lastName}`;
    }
    return 'Unknown';
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = isOwnMessage(item);
    const showDateSeparator =
      index === 0 ||
      !isSameDay(new Date(item.createdAt), new Date(conversationMessages[index - 1].createdAt));

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(new Date(item.createdAt))}
            </Text>
          </View>
        )}
        <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
          {!isOwn && conversation?.type !== 'direct' && (
            <Text style={styles.senderName}>{getSenderName(item)}</Text>
          )}
          <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
            {item.type === 'text' && (
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                {item.content?.text}
              </Text>
            )}
            {item.type === 'image' && item.attachments?.[0] && (
              <Image
                source={{ uri: item.attachments[0].url }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                {formatTime(new Date(item.createdAt))}
              </Text>
              {isOwn && (
                <Ionicons
                  name={item.readBy?.length ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={isOwn ? 'rgba(255,255,255,0.7)' : '#999'}
                  style={styles.readIndicator}
                />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => navigation.navigate('ConversationInfo', { conversationId })}
        >
          <View style={styles.headerAvatar}>
            {getOtherUser()?.profilePicture ? (
              <Image source={{ uri: getOtherUser()?.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getConversationName().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getConversationName()}
            </Text>
            {conversation?.type === 'direct' ? (
              <Text style={styles.headerSubtitle}>{getPresenceStatus()}</Text>
            ) : (
              <Text style={styles.headerSubtitle}>
                {conversation?.participants.length} members
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => handleCall('audio')}>
            <Ionicons name="call-outline" size={22} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => handleCall('video')}>
            <Ionicons name="videocam-outline" size={22} color="#1976d2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        inverted={false}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          messagesLoading ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#1976d2" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !messagesLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Send the first message!</Text>
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.messagesContainer,
          conversationMessages.length === 0 && styles.emptyMessagesContainer,
        ]}
      />

      {/* Typing indicator */}
      {typingInConversation.length > 0 && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
          <Text style={styles.typingText}>Someone is typing...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="attach" size={24} color="#666" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={handleTextChange}
          multiline
          maxLength={4096}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.sendButton, messageText.trim().length > 0 && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={messageText.trim().length === 0}
        >
          <Ionicons
            name="send"
            size={20}
            color={messageText.trim().length > 0 ? '#fff' : '#999'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerAvatar: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  messagesContainer: {
    padding: 16,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 2,
    marginLeft: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#1976d2',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
  },
  ownMessageText: {
    color: '#fff',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  readIndicator: {
    marginLeft: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1976d2',
    marginHorizontal: 1,
    opacity: 0.3,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 1,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#1976d2',
  },
});

export default ChatScreen;
