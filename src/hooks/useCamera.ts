import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const useCamera = () => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required for photo verification.');
            return false;
        }
        return true;
    };

    const takeSelfie = async () => {
        const permission = await requestPermissions();
        if (!permission) return null;

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            cameraType: ImagePicker.CameraType.front,
        });

        if (!result.canceled) {
            return result.assets[0].uri;
        }
        return null;
    };

    return {
        takeSelfie,
        requestPermissions,
    };
};
