import { createApi } from '@reduxjs/toolkit/query/react';
import { createSlice } from '@reduxjs/toolkit';
import { baseQueryWithReauth } from '../../store/baseQuery';
import store from '../../store/store';
import { loginSuccess, loginFailure, loginStart, logout as logoutAction, updateUserRole, updateProfileStart, updateProfileSuccess, updateProfileFailure } from './authSlice';

const initialState = {
    success: false,
    message: '',
    data: null,
    error: null,
    isAuthenticated: false
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            return { ...state, ...action.payload };
        },
        clearCredentials: (state) => {
            return initialState;
        }
    }
});

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Auth', 'Role', 'Profile'],
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                dispatch(loginStart());
                try {
                    const { data: response } = await queryFulfilled;
                    if (response.success) {
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        localStorage.setItem('userType', response.data.user.userType?.replace(/\s+/g, '-') || 'admin');

                        dispatch(loginSuccess({
                            user: response.data.user,
                            token: response.data.token,
                            message: response.message
                        }));

                        let permissions = {};
                        if (response.data.user.permissions) {
                            try {
                                if (typeof response.data.user.permissions === 'string') {
                                    if (response.data.user.permissions !== '' && response.data.user.permissions !== '""') {
                                        permissions = JSON.parse(response.data.user.permissions);
                                    }
                                } else {
                                    permissions = response.data.user.permissions;
                                }
                            } catch (error) {
                                console.error('Failed to parse permissions from login response:', error);
                            }
                        }

                        dispatch(updateUserRole({
                            role_name: response.data.user.roleName || response.data.user.role_name,
                            permissions: permissions
                        }));
                    } else {
                        dispatch(loginFailure(response.message || 'Login failed'));
                    }
                } catch (error) {
                    dispatch(loginFailure(error.error?.message || 'Login failed'));
                }
            }
        }),
        adminLogin: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: {
                    id: credentials.email,
                    password: credentials.password,
                    userType: 'admin'
                },
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                dispatch(loginStart());
                try {
                    const { data: response } = await queryFulfilled;
                    if (response.success) {
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        localStorage.setItem('userType', response.data.user.userType?.replace(/\s+/g, '-') || 'admin');

                        dispatch(loginSuccess({
                            user: response.data.user,
                            token: response.data.token,
                            message: response.message
                        }));

                        let permissions = {};
                        if (response.data.user.permissions) {
                            try {
                                if (typeof response.data.user.permissions === 'string') {
                                    if (response.data.user.permissions !== '' && response.data.user.permissions !== '""') {
                                        permissions = JSON.parse(response.data.user.permissions);
                                    }
                                } else {
                                    permissions = response.data.user.permissions;
                                }
                            } catch (error) {
                                console.error('Failed to parse permissions from login response:', error);
                            }
                        }

                        dispatch(updateUserRole({
                            role_name: response.data.user.roleName || response.data.user.role_name,
                            permissions: permissions
                        }));
                    } else {
                        dispatch(loginFailure(response.message || 'Login failed'));
                    }
                } catch (error) {
                    dispatch(loginFailure(error.error?.message || 'Login failed'));
                }
            }
        }),
        employeeLogin: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: {
                    id: credentials.email,
                    password: credentials.password,
                    userType: 'employee'
                },
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                dispatch(loginStart());
                try {
                    const { data: response } = await queryFulfilled;
                    if (response.success) {
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        localStorage.setItem('userType', response.data.user.userType?.replace(/\s+/g, '-') || 'admin');

                        dispatch(loginSuccess({
                            user: response.data.user,
                            token: response.data.token,
                            message: response.message
                        }));

                        let permissions = {};
                        if (response.data.user.permissions) {
                            try {
                                if (typeof response.data.user.permissions === 'string') {
                                    if (response.data.user.permissions !== '' && response.data.user.permissions !== '""') {
                                        permissions = JSON.parse(response.data.user.permissions);
                                    }
                                } else {
                                    permissions = response.data.user.permissions;
                                }
                            } catch (error) {
                                console.error('Failed to parse permissions from login response:', error);
                            }
                        }

                        dispatch(updateUserRole({
                            role_name: response.data.user.roleName || response.data.user.role_name,
                            permissions: permissions
                        }));
                    } else {
                        dispatch(loginFailure(response.message || 'Login failed'));
                    }
                } catch (error) {
                    dispatch(loginFailure(error.error?.message || 'Login failed'));
                }
            }
        }),
        updateProfile: builder.mutation({
            query: (profileData) => {
                const userType = localStorage.getItem('userType') || 'admin';
                const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

                if (!userId) {
                    throw new Error('User ID not found');
                }

                const endpoint = userType === 'admin'
                    ? `/auth/update-profile`
                    : `/employee/${userId}`;

                const preparedData = { ...profileData };

                if (userType === 'admin') {
                    if (preparedData.first_name && !preparedData.firstName) {
                        preparedData.firstName = preparedData.first_name;
                        delete preparedData.first_name;
                    }

                    if (preparedData.last_name && !preparedData.lastName) {
                        preparedData.lastName = preparedData.last_name;
                        delete preparedData.last_name;
                    }
                }
                else {
                    if (preparedData.firstName && !preparedData.first_name) {
                        preparedData.first_name = preparedData.firstName;
                        delete preparedData.firstName;
                    }

                    if (preparedData.lastName && !preparedData.last_name) {
                        preparedData.last_name = preparedData.lastName;
                        delete preparedData.lastName;
                    }
                }

                return {
                    url: endpoint,
                    method: 'PUT',
                    body: preparedData
                };
            },
            async onQueryStarted(profileData, { dispatch, queryFulfilled }) {
                dispatch(updateProfileStart());
                try {
                    const { data: response } = await queryFulfilled;

                    if (response.success) {
                        let updatedUser;
                        const userType = localStorage.getItem('userType') || 'admin';

                        if (userType === 'admin') {
                            updatedUser = response.data.user || response.data;
                        } else {
                            updatedUser = response.data;
                        }

                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

                        const normalizedUser = {
                            ...currentUser,
                            ...updatedUser
                        };

                        localStorage.setItem('user', JSON.stringify(normalizedUser));

                        dispatch(updateProfileSuccess({
                            user: normalizedUser,
                            message: response.message
                        }));
                    }
                } catch (error) {
                    dispatch(updateProfileFailure(error.error?.message || 'Failed to update profile'));
                }
            }
        })
    })
});

export const {
    useLoginMutation,
    useAdminLoginMutation,
    useEmployeeLoginMutation,
    useUpdateProfileMutation
} = authApi;

export const selectAuth = (state) => state.auth;

export const useAuth = () => {
    const state = store.getState();
    return selectAuth(state);
};

export const handleLogin = async (credentials, loginMutation) => {
    try {
        const response = await loginMutation(credentials).unwrap();
        return response;
    } catch (error) {
        return {
            ...initialState,
            error: error.message || 'Login failed'
        };
    }
};

export const logout = () => (dispatch) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    dispatch(logoutAction());
};

export const updateProfile = (profileData) => async (dispatch) => {
    try {
        dispatch(updateProfileStart());

        const result = await store.dispatch(
            authApi.endpoints.updateProfile.initiate(profileData)
        );

        if (result.data && result.data.success) {
            return { success: true };
        } else {
            const errorMessage = result.error?.data?.message || 'Profile update failed';
            dispatch(updateProfileFailure(errorMessage));
            return { success: false, error: errorMessage };
        }
    } catch (error) {
        const errorMessage = error.message || 'Profile update failed';
        dispatch(updateProfileFailure(errorMessage));
        return { success: false, error: errorMessage };
    }
};