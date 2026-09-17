import { useState } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

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

// A fix rougher than this cannot be compared against an office geofence at
// all: an "approximate" permission grant or a cell-tower-only fix reports
// ~2000 m, and using it produces a false "you are 2 km away". Rather than
// return it we tell the user why and let them retry.
const USABLE_ACCURACY_METERS = 100;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isFixGoodEnough = (location: Location.LocationObject) => {
    const accuracy = location.coords.accuracy;
    const age = Date.now() - location.timestamp;
    return accuracy != null && accuracy <= ACCEPTABLE_ACCURACY_METERS && age <= MAX_FIX_AGE_MS;
};

// Android 12+ lets the user grant only "approximate" location, which Android
// blurs to roughly a 2 km grid. The grant can also be downgraded later from
// the app's permission page, which is what "it worked, then showed 2 km,
// then reinstalling fixed it" looks like.
const hasOnlyApproximateLocation = (permission: Location.LocationPermissionResponse) =>
    Platform.OS === 'android' && permission.android?.accuracy === 'coarse';

export const useLocation = () => {
    const { t } = useTranslation();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const openSettingsButton = { text: t('location.open_settings') || 'Open Settings', onPress: () => Linking.openSettings() };

    const requestPermissions = async () => {
        let permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
            setErrorMsg('Permission to access location was denied');
            Alert.alert(
                t('location.permission_denied_title') || 'Location Permission Required',
                t('location.permission_denied_desc') || 'Location access is required for attendance.',
                permission.canAskAgain
                    ? undefined
                    : [{ text: t('common.cancel') || 'Cancel', style: 'cancel' }, openSettingsButton]
            );
            return false;
        }

        if (hasOnlyApproximateLocation(permission)) {
            // Asking for the fine permission again while only the coarse one
            // is held makes Android show its own "upgrade to precise" popup,
            // so the user can fix this in one tap without leaving the app.
            // Android refuses to show it once the user has declined precise
            // twice; then only the Settings page can change it.
            permission = await Location.requestForegroundPermissionsAsync();

            if (!permission.granted || hasOnlyApproximateLocation(permission)) {
                setErrorMsg('Precise location permission was not granted');
                Alert.alert(
                    t('location.precise_required_title') || 'Precise Location Required',
                    permission.canAskAgain
                        ? (t('location.precise_required_desc') || 'Attendance needs your precise location. Please allow precise location and try again.')
                        : (t('location.precise_settings_desc') || 'Attendance needs your precise location. Open Settings and turn on "Use precise location" for this app.'),
                    [{ text: t('common.cancel') || 'Cancel', style: 'cancel' }, openSettingsButton]
                );
                return false;
            }
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

            const bestAccuracy = bestFix?.coords.accuracy;
            if (!bestFix || bestAccuracy == null || bestAccuracy > USABLE_ACCURACY_METERS) {
                setErrorMsg('Location accuracy is too low');
                Alert.alert(
                    t('location.imprecise_title') || 'Location Not Accurate Enough',
                    t('location.imprecise_desc', { meters: Math.round(bestAccuracy ?? 0) }) ||
                        `Your location is only accurate to about ${Math.round(bestAccuracy ?? 0)} m. Move near a window or outdoors, make sure Wi-Fi is on, then try again.`
                );
                setLoading(false);
                return null;
            }

            setErrorMsg(null);
            setLocation(bestFix);
            setLoading(false);
            return bestFix;
        } catch (error) {
            setErrorMsg('Could not fetch location');
            Alert.alert(
                t('location.fetch_failed_title') || 'Location Unavailable',
                t('location.fetch_failed_desc') || 'Could not get your current location. Make sure location is turned on and try again.'
            );
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
