import { useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

// Android/Play Services can satisfy a location request with a cached
// "last known location" instead of a live GPS fix, especially right after
// app start before GPS has locked on. That cached value can be stale (from
// wherever the phone last got a fix) and wildly wrong for geofencing. These
// thresholds make sure we only trust a fix that is both precise and fresh,
// retrying a few times to give GPS a chance to warm up rather than
// silently accepting the first (possibly stale) answer.
const MAX_ATTEMPTS = 3;
const ACCEPTABLE_ACCURACY_METERS = 50;
const MAX_FIX_AGE_MS = 10000;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isFixGoodEnough = (location: Location.LocationObject) => {
    const accuracy = location.coords.accuracy;
    const age = Date.now() - location.timestamp;
    return accuracy != null && accuracy <= ACCEPTABLE_ACCURACY_METERS && age <= MAX_FIX_AGE_MS;
};

export const useLocation = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const requestPermissions = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            Alert.alert('Permission Denied', 'Location access is required for attendance.');
            return false;
        }
        return true;
    };

    const getCurrentLocation = async () => {
        setLoading(true);
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            setLoading(false);
            return null;
        }

        try {
            let bestFix: Location.LocationObject | null = null;

            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                const fix = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest,
                });

                if (!bestFix || (fix.coords.accuracy ?? Infinity) < (bestFix.coords.accuracy ?? Infinity)) {
                    bestFix = fix;
                }

                if (isFixGoodEnough(fix)) {
                    break;
                }

                if (attempt < MAX_ATTEMPTS) {
                    await sleep(RETRY_DELAY_MS);
                }
            }

            setLocation(bestFix);
            setLoading(false);
            return bestFix;
        } catch (error) {
            setErrorMsg('Could not fetch location');
            setLoading(false);
            return null;
        }
    };

    return {
        location,
        errorMsg,
        loading,
        getCurrentLocation,
        requestPermissions,
    };
};
