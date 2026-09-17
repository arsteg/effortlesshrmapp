import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus, logout } from '../store/slices/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { Loading } from '../components/common/Loading';
import MainNavigator from './MainNavigator';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { STORAGE_PENDING_CLOCK_IN } from '../utils/constants';

export const AppNavigator = () => {
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
    const [checking, setChecking] = React.useState(true);
    const [initialRoute, setInitialRoute] = React.useState<string | undefined>(undefined);

    useEffect(() => {
        checkAuth();

        // Set up logout callback for API 401 errors
        apiService.setLogoutCallback(() => {
            dispatch(logout());
        });
    }, []);

    const checkAuth = async () => {
        await dispatch(checkAuthStatus());
        // If the OS killed the app while the clock-in camera was open, open
        // Attendance first so the interrupted clock-in is completed right away.
        const pendingClockIn = await storage.getItem(STORAGE_PENDING_CLOCK_IN);
        setInitialRoute(pendingClockIn ? 'Attendance' : undefined);
        setChecking(false);
    };

    if (checking) {
        return <Loading message="Loading..." />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainNavigator initialRouteName={initialRoute} /> : <AuthNavigator />}
        </NavigationContainer>
    );
};
