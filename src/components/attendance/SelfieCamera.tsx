import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface SelfieCameraProps {
    visible: boolean;
    onCapture: (uri: string) => void;
    onCancel: () => void;
}

// Full-screen, in-app camera for the attendance selfie. Deliberately not
// expo-image-picker's launchCameraAsync: that hands the whole screen to a
// separate camera Activity, which backgrounds this app and lets aggressive
// OEM battery managers (Realme/ColorOS especially) kill it mid-capture,
// silently losing the clock-in. Because the preview here renders inside our
// own still-foregrounded screen, the app is never backgrounded during
// capture, so that failure mode cannot happen.
export const SelfieCamera: React.FC<SelfieCameraProps> = ({ visible, onCapture, onCancel }) => {
    const { t } = useTranslation();
    const [permission, requestPermission] = useCameraPermissions();
    const [isReady, setIsReady] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    const handleCapture = async () => {
        if (!cameraRef.current || !isReady || capturing) return;
        setCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
            if (photo?.uri) {
                onCapture(photo.uri);
            }
        } catch (error) {
            console.error('Failed to capture selfie:', error);
        } finally {
            setCapturing(false);
            setIsReady(false);
        }
    };

    const handleClose = () => {
        setIsReady(false);
        onCancel();
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                {!permission ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.colors.white} />
                    </View>
                ) : !permission.granted ? (
                    <View style={styles.centered}>
                        <Ionicons name="camera-outline" size={48} color={theme.colors.white} />
                        <Text style={styles.permissionText}>
                            {t('attendance.camera_permission_required') || 'Camera access is required to take your attendance selfie.'}
                        </Text>
                        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                            <Text style={styles.permissionButtonText}>{t('common.allow') || 'Allow Camera'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelLink} onPress={handleClose}>
                            <Text style={styles.cancelLinkText}>{t('common.cancel') || 'Cancel'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            facing="front"
                            onCameraReady={() => setIsReady(true)}
                            onMountError={(e) => console.error('Camera mount error:', e.message)}
                        />
                        <View style={styles.overlay}>
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <Ionicons name="close" size={28} color={theme.colors.white} />
                            </TouchableOpacity>
                            <Text style={styles.hint}>
                                {t('attendance.selfie_hint') || 'Center your face and tap to capture'}
                            </Text>
                            <View style={styles.captureRow}>
                                <TouchableOpacity
                                    style={[styles.captureButton, (!isReady || capturing) && styles.captureButtonDisabled]}
                                    onPress={handleCapture}
                                    disabled={!isReady || capturing}
                                >
                                    {capturing ? (
                                        <ActivityIndicator color={theme.colors.white} />
                                    ) : (
                                        <View style={styles.captureButtonInner} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    permissionText: {
        color: theme.colors.white,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
    },
    permissionButtonText: {
        color: theme.colors.white,
        fontWeight: '700',
        fontSize: 15,
    },
    cancelLink: {
        marginTop: 20,
    },
    cancelLinkText: {
        color: theme.colors.gray400,
        fontSize: 14,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    closeButton: {
        alignSelf: 'flex-end',
        margin: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hint: {
        alignSelf: 'center',
        color: theme.colors.white,
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    captureRow: {
        alignItems: 'center',
        marginBottom: 36,
    },
    captureButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 4,
        borderColor: theme.colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.white,
    },
});
