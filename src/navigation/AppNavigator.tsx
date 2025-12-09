import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus, logout } from '../store/slices/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { Loading } from '../components/common/Loading';
import MainNavigator from './MainNavigator';
import { apiService } from '../services/api';

export const AppNavigator = () => {
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
    const [checking, setChecking] = React.useState(true);

    useEffect(() => {
        checkAuth();

        // Set up logout callback for API 401 errors
        apiService.setLogoutCallback(() => {
            dispatch(logout());
        });
    }, []);

    const checkAuth = async () => {
        await dispatch(checkAuthStatus());
        setChecking(false);
    };

    if (checking) {
        return <Loading message="Loading..." />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};
