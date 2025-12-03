import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Loading } from '../components/common/Loading';

export const AppNavigator = () => {
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
    const [checking, setChecking] = React.useState(true);

    useEffect(() => {
        checkAuth();
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
