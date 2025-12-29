import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

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
            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(location);
            setLoading(false);
            return location;
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
