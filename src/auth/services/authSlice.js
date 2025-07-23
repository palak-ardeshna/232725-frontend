import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token');
const user = localStorage.getItem('user');
const parsedUser = user ? JSON.parse(user) : null;

// Parse permissions from user object
let parsedPermissions = null;
if (parsedUser && parsedUser.permissions) {
    try {
        if (typeof parsedUser.permissions === 'string') {
            if (parsedUser.permissions === '' || parsedUser.permissions === '""') {
                parsedPermissions = {};
            } else {
                parsedPermissions = JSON.parse(parsedUser.permissions);
            }
        } else {
            parsedPermissions = parsedUser.permissions;
        }
    } catch (error) {
        console.error('Failed to parse permissions from localStorage:', error);
        parsedPermissions = {};
    }
}

const initialState = {
    user: parsedUser,
    token: token,
    isLoading: false,
    error: null,
    isLogin: false,
    message: null,
    success: false,
    userRole: parsedUser?.roleName || null,
    permissions: parsedPermissions
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            const { user, token, message } = action.payload;
            state.isLoading = false;
            state.user = user;
            state.token = token;
            state.isLogin = true;
            state.error = null;
            state.success = true;
            state.message = message;
            state.userRole = user?.roleName || null;
        },
        loginFailure: (state, action) => {
            return {
                ...initialState,
                error: action.payload,
                message: action.payload
            };
        },
        updateProfileStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        updateProfileSuccess: (state, action) => {
            const { user, message } = action.payload;
            state.isLoading = false;
            state.user = user;
            state.error = null;
            state.success = true;
            state.message = message;
        },
        updateProfileFailure: (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
            state.message = action.payload;
            state.success = false;
        },
        updateUserRole: (state, action) => {
            state.userRole = action.payload.role_name;
            // Parse the permissions if they're a string
            const permissions = typeof action.payload.permissions === 'string'
                ? JSON.parse(action.payload.permissions)
                : action.payload.permissions;
            state.permissions = permissions;
            if (state.user) {
                state.user = {
                    ...state.user,
                    roleName: action.payload.role_name,
                    permissions: permissions
                };
            }
            // Update localStorage with the updated user data
            localStorage.setItem('user', JSON.stringify(state.user));
        },
        logout: () => {
            localStorage.clear();
            return initialState;
        },
        clearError: (state) => {
            state.error = null;
            state.message = null;
        }
    },
    extraReducers: (builder) => {
        // Handle login success
        builder.addMatcher(
            (action) => action.type.endsWith('/fulfilled') && action.type.includes('login'),
            (state, action) => {
                state.isLoading = false;
                state.isLogin = true;
                state.token = action.payload.data.token;
                state.user = action.payload.data.user;
                state.userRole = action.payload.data.user?.roleName || null;
                state.permissions = action.payload.data.user?.permissions || null;
                state.success = true;

                // Store in localStorage
                localStorage.setItem('token', action.payload.data.token);
                localStorage.setItem('user', JSON.stringify(action.payload.data.user));
            }
        );
    }
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    updateProfileStart,
    updateProfileSuccess,
    updateProfileFailure,
    logout,
    clearError,
    updateUserRole
} = authSlice.actions;

export const selectCurrentUser = (state) => state.auth?.user || null;
export const selectCurrentToken = (state) => state.auth?.token || null;
export const selectAuthLoading = (state) => Boolean(state.auth?.isLoading);
export const selectAuthError = (state) => state.auth?.error || null;
export const selectIsLogin = (state) => Boolean(state.auth?.isLogin);
export const selectAuthMessage = (state) => state.auth?.message || null;
export const selectAuthSuccess = (state) => Boolean(state.auth?.success);
export const selectUserRole = (state) => state.auth?.userRole || null;



// Add selector for permissions
const selectUserPermissions = (state) => state.auth?.permissions || {};

export default authSlice.reducer;
export {
    selectUserPermissions
};