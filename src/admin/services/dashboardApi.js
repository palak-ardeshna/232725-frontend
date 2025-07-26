import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../store/baseQuery.js';

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Dashboard'],
    endpoints: (builder) => ({
        getDashboardData: builder.query({
            query: () => ({
                url: 'dashboard/',
                method: 'GET',
            }),
            providesTags: ['Dashboard'],
        }),
    }),
});

export const {
    useGetDashboardDataQuery,
} = dashboardApi;

export default dashboardApi; 