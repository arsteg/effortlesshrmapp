import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { saveToken, saveUserData, clearAuthData, getToken, getUserData } from '../../utils/storage';
import { LoginRequest, User, LoginResponse } from '../../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdminPortal: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isAdminPortal: false,
    isLoading: false,
    error: null,
};

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginRequest, { rejectWithValue }) => {
        try {
            console.log('Login thunk started', credentials.email);
            const response = await authService.login(credentials);
            console.log('Login response received', response);
            if (response.token && response.data && response.data.user) {
                console.log('Saving token...');
                await saveToken(response.token);
                console.log('Token saved. Saving user data...');
                await saveUserData(response.data);
                console.log('User data saved. Returning response.');
                return response;
            }
            throw new Error('Invalid response from server: Missing user data');
        } catch (error: any) {
            console.error('Login thunk error:', error);
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

export const checkAuthStatus = createAsyncThunk(
    'auth/checkStatus',
    async (_, { rejectWithValue }) => {
        try {
            const token = await getToken();
            const userData = await getUserData();

            if (token && userData) {
                return { token, user: userData.user };
            }
            return null;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await clearAuthData();
            return null;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        togglePortalMode: (state) => {
            state.isAdminPortal = !state.isAdminPortal;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = action.payload.data?.user || null;
                // Default to User portal, can switch if admin
                const user = action.payload.data?.user;
                if (user) {
                    let isAdmin = user.isAdmin;
                    if (!isAdmin && user.role) {
                        if (typeof user.role === 'string') {
                            isAdmin = user.role.toLowerCase() === 'admin';
                        } else if (typeof user.role === 'object' && (user.role as any).name) {
                            // Handle case where role is an object (e.g. { id: ..., name: 'Admin' })
                            isAdmin = (user.role as any).name.toLowerCase() === 'admin';
                        }
                    }
                    state.isAdminPortal = !!isAdmin;
                } else {
                    state.isAdminPortal = false;
                }
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Check auth status
        builder
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                if (action.payload) {
                    state.isAuthenticated = true;
                    state.token = action.payload.token;
                    state.user = action.payload.user;
                }
            });

        // Logout
        builder
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.isAdminPortal = false;
                state.error = null;
            });
    },
});

export const { clearError, togglePortalMode } = authSlice.actions;
export default authSlice.reducer;
