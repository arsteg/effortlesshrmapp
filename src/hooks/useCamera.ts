import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Used only for the manual-attendance-request photo attachment, a low-stakes
// flow where an interruption just means the user retries attaching a photo.
// The actual clock-in selfie no longer uses this: see
// src/components/attendance/SelfieCamera.tsx, which captures the photo
// in-app instead of handing off to a separate camera Activity, so the app
// can't be backgrounded (and killed by aggressive OEM battery managers)
// mid-capture in the first place.
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

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
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
