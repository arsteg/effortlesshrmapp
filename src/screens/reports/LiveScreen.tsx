import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../../theme';
import { Card } from '../../components/common/Card';
import { webSocketService, WebSocketNotificationType } from '../../services/webSocketService';
import { timeLogService } from '../../services/timeLogService';
import { useAppSelector } from '../../store/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
    LiveScreen: { users: { id: string, name: string }[] };
};

type LiveScreenRouteProp = RouteProp<RootStackParamList, 'LiveScreen'>;

const LiveScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<LiveScreenRouteProp>();
    const { users } = route.params;
    const userIds = users.map(u => u.id);
    const { user } = useAppSelector((state) => state.auth);

    const [images, setImages] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
                        setImages(prev => ({ ...prev, [userIds[0]]: `data:image/jpeg;base64,${message.content}` }));
                    } else {
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

    const renderItem = ({ item: userItem }: { item: { id: string, name: string } }) => {
        const imageBase64 = images[userItem.id];

        return (
            <Card style={styles.userCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.userNameText}>{userItem.name}</Text>
                    {imageBase64 && (
                        <View style={styles.headerRight}>
                            <View style={styles.liveIndicator} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => imageBase64 && setSelectedImage(imageBase64)}
                    style={styles.imageContainer}
                >
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
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => (navigation as any).navigate('RealTime')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Live Monitoring</Text>
            </View>

            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text>No users selected for live view.</Text>
                    </View>
                }
            />

            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <Pressable style={styles.modalBackground} onPress={() => setSelectedImage(null)}>
                    <View style={styles.fullScreenContainer}>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setSelectedImage(null)}
                        >
                            <Ionicons name="close" size={32} color={theme.colors.white} />
                        </TouchableOpacity>
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullScreenImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </Pressable>
            </Modal>
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    userNameText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    liveText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.error,
    },
    liveIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.error,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: theme.colors.black,
    },
    screenshot: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
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
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    closeModalButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
});

export default LiveScreen;
