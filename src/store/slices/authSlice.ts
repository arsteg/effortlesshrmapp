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
            const response = await authService.login(credentials);
            if (response.token && response.data) {
                await saveToken(response.token);
                await saveUserData(response.data);
                return response;
            }
            throw new Error('Invalid response from server');
        } catch (error: any) {
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
                state.user = action.payload.data.user;
                // Default to User portal, can switch if admin
                state.isAdminPortal = false; 
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
