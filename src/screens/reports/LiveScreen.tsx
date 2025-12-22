import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../../theme';
import { Card } from '../../components/common/Card';
import { webSocketService, WebSocketNotificationType } from '../../services/webSocketService';
import { timeLogService } from '../../services/timeLogService';
import { useAppSelector } from '../../store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
    LiveScreen: { userIds: string[] };
};

type LiveScreenRouteProp = RouteProp<RootStackParamList, 'LiveScreen'>;

interface UserImage {
    userId: string;
    base64: string;
}

const LiveScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<LiveScreenRouteProp>();
    const { userIds } = route.params;
    const { user } = useAppSelector((state) => state.auth);

    const [images, setImages] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        // Start live tracking on backend
        timeLogService.createLiveScreenRecord(userIds)
            .catch(err => console.error('Failed to create live screen record:', err));

        // Connect and subscribe to screenshots
        webSocketService.connect(user.id);

        // Authenticate for all users to watch
        userIds.forEach(id => webSocketService.authenticate(id));

        const unsubscribe = webSocketService.subscribe(
            WebSocketNotificationType.SCREENSHOT,
            (message) => {
                if (message.contentType === 'image') {
                    const sourceId = message.sourceUserId;
                    if (sourceId) {
                        setImages(prev => ({ ...prev, [sourceId]: `data:image/jpeg;base64,${message.content}` }));
                    } else if (userIds.length === 1) {
                        // Fallback for older backend versions or single user view
                        setImages(prev => ({ ...prev, [userIds[0]]: `data:image/jpeg;base64,${message.content}` }));
                    } else {
                        // If multiple users and no sourceId, we can't be sure, 
                        // so we just update the first one as a last resort
                        setImages(prev => ({ ...prev, [userIds[0]]: `data:image/jpeg;base64,${message.content}` }));
                    }
                }
            }
        );

        setLoading(false);

        return () => {
            unsubscribe();
            // Stop live tracking on backend
            timeLogService.removeLiveScreenRecord(userIds)
                .catch(err => console.error('Failed to remove live screen record:', err));
        };
    }, [user?.id, userIds]);

    const renderItem = ({ item: userId }: { item: string }) => {
        const imageBase64 = images[userId];

        return (
            <Card style={styles.userCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.userIdText}>User ID: {userId}</Text>
                    {imageBase64 && <View style={styles.liveIndicator} />}
                </View>
                {imageBase64 ? (
                    <Image
                        source={{ uri: imageBase64 }}
                        style={styles.screenshot}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <ActivityIndicator color={theme.colors.primary} />
                        <Text style={styles.placeholderText}>Waiting for live feed...</Text>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('RealTime')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Live Monitoring</Text>
            </View>

            <FlatList
                data={userIds}
                renderItem={renderItem}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text>No users selected for live view.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
        paddingTop: 50, // Adjustment for status bar
    },
    backButton: {
        marginRight: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    listContent: {
        padding: theme.spacing.md,
    },
    userCard: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.gray50,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    userIdText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    liveIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.error,
    },
    screenshot: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: theme.colors.black,
    },
    placeholder: {
        width: '100%',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.gray100,
    },
    placeholderText: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
});

export default LiveScreen;
