import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image, TextInput } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { userService } from '../../services/userService';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

const EmployeesScreen = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [employees, setEmployees] = useState<User[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadEmployees = useCallback(async () => {
        if (!user) return;

        // Try to get companyId from user object. 
        // Adjust based on actual user object structure.
        const companyId = user.company?.id || (user as any).companyId;

        if (!companyId) {
            console.error('Company ID not found for user');
            return;
        }

        try {
            setLoading(true);
            const response = await userService.getUsersByCompany(companyId);
            if (response.data && response.data.users) {
                // Check if it returns { users: [] } or just [] inside data, based on controller it seems to return data: { users: [] }
                // userController.js line 289: res.status(200).json({ status: ..., data: { users: users } });
                // So response.data.users is correct if using generic ApiResponse wrapper correctly.
                // However, apiService might return response.data directly? 
                // Let's assume apiService returns the full parsed JSON body as T.
                // So we need to match the backend structure: { status: 'Success', data: { users: [...] } }
                setEmployees(response.data.users || []);
                setFilteredEmployees(response.data.users || []);
            }
        } catch (error) {
            console.error('Failed to load employees', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text) {
            const lower = text.toLowerCase();
            const filtered = employees.filter(emp =>
                (emp.firstName?.toLowerCase().includes(lower) || '') ||
                (emp.lastName?.toLowerCase().includes(lower) || '') ||
                (emp.email?.toLowerCase().includes(lower) || '') ||
                (emp.FullName?.toLowerCase().includes(lower) || '')
            );
            setFilteredEmployees(filtered);
        } else {
            setFilteredEmployees(employees);
        }
    };

    const getInitials = (firstName: string = '', lastName: string = '') => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
                    )}
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.role}>{(item.role as any)?.name || item.role || 'Employee'}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]}>
                        {/* Assuming active if in list, or use item.status if available */}
                        <Text style={styles.statusText}>Active</Text>
                    </View>
                </View>
            </View>
            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={theme.colors.gray600} />
                    <Text style={styles.detailText}>{item.phone || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={16} color={theme.colors.gray600} />
                    <Text style={styles.detailText}>{(item as any).jobTitle || 'N/A'}</Text>
                </View>
            </View>
        </View>
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadEmployees();
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.gray600} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredEmployees}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No employees found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.textPrimary,
    },
    loader: {
        marginTop: 20,
    },
    listContainer: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    role: {
        fontSize: 14,
        color: theme.colors.gray600,
        marginBottom: 2,
    },
    email: {
        fontSize: 12,
        color: theme.colors.gray500,
    },
    statusContainer: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardDetails: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray100,
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    detailText: {
        fontSize: 12,
        color: theme.colors.gray600,
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: theme.colors.gray600,
        fontSize: 16,
    },
});

export default EmployeesScreen;
