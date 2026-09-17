import { useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Some OEM ROMs (e.g. Realme/ColorOS) can kill or recreate the host Activity
// while the native camera app is open, which orphans the pending camera
// promise so it never resolves. A blind fixed timeout would either fire too
// late or interrupt someone who is just slow to take the photo — so instead
// we only start the clock once the app is confirmed back in the foreground
// (the failure signature is specifically "we're back, but no result came
// through"). While the user is still in the camera, however long that
// takes, nothing here ever times out.
export const POST_RESUME_TIMEOUT_MS = 35000;
export const POST_RESUME_TIMEOUT_SECONDS = POST_RESUME_TIMEOUT_MS / 1000;

// Thrown instead of returning null so the caller can tell "timed out after
// resume" apart from "user cancelled" and show a message explaining why.
export class CameraTimeoutError extends Error {
    constructor() {
        super('CAMERA_TIMEOUT');
        this.name = 'CameraTimeoutError';
    }
}

const raceWithResumeTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return new Promise((resolve, reject) => {
        let settled = false;
        let resumeTimer: ReturnType<typeof setTimeout> | null = null;

        const cleanup = () => {
            if (resumeTimer) clearTimeout(resumeTimer);
            subscription.remove();
        };

        const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active' && !resumeTimer && !settled) {
                resumeTimer = setTimeout(() => {
                    if (!settled) {
                        settled = true;
                        cleanup();
                        reject(new CameraTimeoutError());
                    }
                }, timeoutMs);
            }
        });

        promise.then(
            (value) => {
                if (!settled) {
                    settled = true;
                    cleanup();
                    resolve(value);
                }
            },
            (error) => {
                if (!settled) {
                    settled = true;
                    cleanup();
                    reject(error);
                }
            }
        );
    });
};

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

        const result = await raceWithResumeTimeout(
            ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                cameraType: ImagePicker.CameraType.front,
            }),
            POST_RESUME_TIMEOUT_MS
        );

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
