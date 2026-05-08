import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchConversations,
  setSelectedConversation,
  clearUnread,
} from '../../store/slices/communicationSlice';
import { Conversation, User } from '../../types/communication';
import { formatRelativeTime } from '../../utils/dateUtils';

const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const { conversations, conversationsLoading, presenceMap, unreadTotal } = useAppSelector(
    (state) => state.communication
  );
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'group'>('all');

  useEffect(() => {
    dispatch(fetchConversations({}));
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchConversations({}));
  }, [dispatch]);

  const getConversationName = (conversation: Conversation): string => {
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

    return 'Unnamed Conversation';
  };

  const getOtherParticipant = (conversation: Conversation): User | null => {
    if (conversation.type !== 'direct') return null;

    const otherParticipant = conversation.participants.find((p) => {
      const participantId = typeof p.userId === 'string' ? p.userId : (p.userId as User)._id;
      return participantId !== user?.id;
    });

    if (otherParticipant && typeof otherParticipant.userId === 'object') {
      return otherParticipant.userId as User;
    }

    return null;
  };

  const getPresenceStatus = (conversation: Conversation): string => {
    const otherUser = getOtherParticipant(conversation);
    if (otherUser) {
      return presenceMap[otherUser._id] || 'offline';
    }
    return 'offline';
  };

  const getPresenceColor = (status: string): string => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'away':
        return '#FF9800';
      case 'busy':
      case 'dnd':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getMessagePreview = (conversation: Conversation): string => {
    if (!conversation.lastMessage) return 'No messages yet';

    const message = conversation.lastMessage;
    switch (message.type) {
      case 'text':
        return message.content?.text || '';
      case 'image':
        return '📷 Photo';
      case 'file':
        return '📎 File';
      case 'call':
        return '📞 Call';
      default:
        return message.content?.text || '';
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    // Filter by type
    if (filterType !== 'all' && conv.type !== filterType) return false;

    // Filter by search
    if (searchQuery.trim()) {
      const name = getConversationName(conv).toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const handleConversationPress = (conversation: Conversation) => {
    dispatch(setSelectedConversation(conversation._id));
    dispatch(clearUnread(conversation._id));
    navigation.navigate('Chat', { conversationId: conversation._id });
  };

  const handleNewConversation = () => {
    navigation.navigate('NewConversation');
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherParticipant(item);
    const presenceStatus = getPresenceStatus(item);

    return (
      <TouchableOpacity
        style={[styles.conversationItem, item.unreadCount > 0 && styles.unreadItem]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.type === 'direct' && otherUser?.profilePicture ? (
            <Image source={{ uri: otherUser.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, item.type !== 'direct' && styles.groupAvatar]}>
              {item.type === 'direct' ? (
                <Text style={styles.avatarText}>
                  {getConversationName(item).charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons name="people" size={24} color="#fff" />
              )}
            </View>
          )}
          {item.type === 'direct' && (
            <View
              style={[styles.presenceIndicator, { backgroundColor: getPresenceColor(presenceStatus) }]}
            />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, item.unreadCount > 0 && styles.unreadText]} numberOfLines={1}>
              {getConversationName(item)}
            </Text>
            <Text style={styles.timeText}>
              {formatRelativeTime(item.lastActivity)}
            </Text>
          </View>
          <View style={styles.conversationPreview}>
            <Text style={[styles.previewText, item.unreadCount > 0 && styles.unreadPreview]} numberOfLines={1}>
              {getMessagePreview(item)}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleNewConversation}>
            <Ionicons name="create-outline" size={24} color="#1976d2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'direct', 'group'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.filterTabActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterTabText, filterType === type && styles.filterTabTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversations list */}
      {conversationsLoading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={conversationsLoading} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <TouchableOpacity style={styles.startButton} onPress={handleNewConversation}>
                <Text style={styles.startButtonText}>Start a conversation</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={filteredConversations.length === 0 && styles.emptyListContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: '#1976d2',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadItem: {
    backgroundColor: '#fff8e1',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatar: {
    backgroundColor: '#9c27b0',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  presenceIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  unreadPreview: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ConversationsScreen;
