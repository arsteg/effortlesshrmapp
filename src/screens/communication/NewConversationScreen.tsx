import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createConversation } from '../../store/slices/communicationSlice';
import { communicationService } from '../../services/communicationService';
import { User } from '../../types/communication';

const NewConversationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await communicationService.getOrganizationUsers();
      // Filter out current user
      const filteredUsers = response.data.filter((u: User) => u._id !== user?.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleUserSelection = (selectedUser: User) => {
    const isSelected = selectedUsers.find((u) => u._id === selectedUser._id);

    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== selectedUser._id));
    } else {
      if (!isGroup) {
        // For direct messages, only one user can be selected
        setSelectedUsers([selectedUser]);
      } else {
        setSelectedUsers([...selectedUsers, selectedUser]);
      }
    }
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;

    setCreating(true);
    try {
      const result = await dispatch(
        createConversation({
          type: isGroup ? 'group' : 'direct',
          participants: selectedUsers.map((u) => u._id),
          name: isGroup ? groupName.trim() || undefined : undefined,
        })
      ).unwrap();

      navigation.replace('Chat', { conversationId: result._id });
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  const canCreate = (): boolean => {
    if (selectedUsers.length === 0) return false;
    if (isGroup && selectedUsers.length < 2) return false;
    if (isGroup && !groupName.trim()) return false;
    return true;
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.find((u) => u._id === item._id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(item)}
        activeOpacity={0.7}
      >
        <View style={styles.userAvatar}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.firstName?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Conversation</Text>
        <TouchableOpacity
          style={[styles.createButton, !canCreate() && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!canCreate() || creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.createButtonText, !canCreate() && styles.createButtonTextDisabled]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Type toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeButton, !isGroup && styles.typeButtonActive]}
          onPress={() => {
            setIsGroup(false);
            setSelectedUsers(selectedUsers.slice(0, 1));
          }}
        >
          <Ionicons name="person-outline" size={20} color={!isGroup ? '#fff' : '#666'} />
          <Text style={[styles.typeButtonText, !isGroup && styles.typeButtonTextActive]}>Direct</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, isGroup && styles.typeButtonActive]}
          onPress={() => setIsGroup(true)}
        >
          <Ionicons name="people-outline" size={20} color={isGroup ? '#fff' : '#666'} />
          <Text style={[styles.typeButtonText, isGroup && styles.typeButtonTextActive]}>Group</Text>
        </TouchableOpacity>
      </View>

      {/* Group name input */}
      {isGroup && (
        <View style={styles.groupNameContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Group name"
            value={groupName}
            onChangeText={setGroupName}
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            horizontal
            data={selectedUsers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.selectedChip}
                onPress={() => toggleUserSelection(item)}
              >
                <Text style={styles.selectedChipText}>
                  {item.firstName} {item.lastName}
                </Text>
                <Ionicons name="close-circle" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          />
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Users list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
          contentContainerStyle={styles.usersList}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  createButtonTextDisabled: {
    color: '#999',
  },
  typeToggle: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#1976d2',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  groupNameContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  selectedContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  selectedList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  selectedChipText: {
    color: '#fff',
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usersList: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  userAvatar: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default NewConversationScreen;
