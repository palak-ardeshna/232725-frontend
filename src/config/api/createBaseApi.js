import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../store/baseQuery';

export const createBaseApi = ({
    reducerPath,
    baseEndpoint,
    tagType,
    extraEndpoints = {}
}) => {
    return createApi({
        reducerPath,
        baseQuery: baseQueryWithReauth,
        tagTypes: [tagType],
        endpoints: (builder) => ({
            getAll: builder.query({
                query: (params = {}) => ({
                    url: `/${baseEndpoint}`,
                    params: {
                        page: params?.page || 1,
                        limit: params?.limit || 10,
                        ...params
                    }
                }),
                providesTags: (result) =>
                    result?.data?.items
                        ? [
                            ...result.data.items.map(({ id }) => ({ type: tagType, id })),
                            { type: tagType, id: 'LIST' },
                        ]
                        : [{ type: tagType, id: 'LIST' }]
            }),
            getById: builder.query({
                query: (id) => `/${baseEndpoint}/${id}`,
                providesTags: (result, error, id) => [{ type: tagType, id }]
            }),
            create: builder.mutation({
                query: (payload) => {
                    if (payload?.isFormData) {
                        return {
                            url: `/${baseEndpoint}`,
                            method: 'POST',
                            body: payload.data,
                            formData: true,
                        };
                    }

                    return {
                        url: `/${baseEndpoint}`,
                        method: 'POST',
                        body: payload
                    };
                },
                invalidatesTags: [{ type: tagType, id: 'LIST' }]
            }),
            update: builder.mutation({
                query: ({ id, data, isFormData }) => {
                    if (isFormData) {
                        return {
                            url: `/${baseEndpoint}/${id}`,
                            method: 'PUT',
                            body: data,
                            formData: true,
                        };
                    }

                    return {
                        url: `/${baseEndpoint}/${id}`,
                        method: 'PUT',
                        body: data
                    };
                },
                invalidatesTags: (result, error, { id }) => [
                    { type: tagType, id },
                    { type: tagType, id: 'LIST' }
                ]
            }),
            delete: builder.mutation({
                query: (id) => ({
                    url: `/${baseEndpoint}/${id}`,
                    method: 'DELETE'
                }),
                invalidatesTags: (result, error, id) => [
                    { type: tagType, id },
                    { type: tagType, id: 'LIST' }
                ]
            }),
            ...extraEndpoints(builder)
        })
    });
};

export const generateCustomHooks = (api, entityName) => {
    const hooks = {};

    const hookMappings = {
        useGetAllQuery: `useGet${entityName}sQuery`,
        useGetByIdQuery: `useGet${entityName}Query`,
        useCreateMutation: `useCreate${entityName}Mutation`,
        useUpdateMutation: `useUpdate${entityName}Mutation`,
        useDeleteMutation: `useDelete${entityName}Mutation`
    };

    Object.entries(hookMappings).forEach(([defaultHook, customHook]) => {
        if (api[defaultHook]) {
            hooks[customHook] = api[defaultHook];
        }
    });

    Object.entries(api).forEach(([key, value]) => {
        if (key.startsWith('use') && !Object.keys(hookMappings).includes(key)) {
            hooks[key] = value;
        }
    });

    return hooks;
};