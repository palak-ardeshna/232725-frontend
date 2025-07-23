import { createBaseApi } from './createBaseApi.js';
import { apiServiceNames } from './apiServices.js';

const apiServices = {};
const apiHooks = {};

apiServiceNames.forEach(name => {
    const api = createBaseApi({
        reducerPath: `${name}Api`,
        baseEndpoint: name,
        tagType: name.charAt(0).toUpperCase() + name.slice(1),
        extraEndpoints: (builder) => ({})
    });

    const apiName = `${name}Api`;
    apiServices[apiName] = api;

    const entityName = name.charAt(0).toUpperCase() + name.slice(1);
    const hookNames = {
        getAll: `useGet${entityName}sQuery`,
        getById: `useGet${entityName}Query`,
        create: `useCreate${entityName}Mutation`,
        update: `useUpdate${entityName}Mutation`,
        delete: `useDelete${entityName}Mutation`
    };

    apiHooks[hookNames.getAll] = api.useGetAllQuery;
    apiHooks[hookNames.getById] = api.useGetByIdQuery;
    apiHooks[hookNames.create] = api.useCreateMutation;
    apiHooks[hookNames.update] = api.useUpdateMutation;
    apiHooks[hookNames.delete] = api.useDeleteMutation;
});

export const getApiService = (name) => {
    const apiName = `${name}Api`;
    return apiServices[apiName];
};

export const getApiHooks = (name) => {
    const entityName = name.charAt(0).toUpperCase() + name.slice(1);
    const hookNames = {
        getAll: `useGet${entityName}sQuery`,
        getById: `useGet${entityName}Query`,
        create: `useCreate${entityName}Mutation`,
        update: `useUpdate${entityName}Mutation`,
        delete: `useDelete${entityName}Mutation`
    };

    return {
        getAll: apiHooks[hookNames.getAll],
        getById: apiHooks[hookNames.getById],
        create: apiHooks[hookNames.create],
        update: apiHooks[hookNames.update],
        delete: apiHooks[hookNames.delete]
    };
};

export const getApiHook = (name, hookType) => {
    const entityName = name.charAt(0).toUpperCase() + name.slice(1);
    const hookNames = {
        getAll: `useGet${entityName}sQuery`,
        getById: `useGet${entityName}Query`,
        create: `useCreate${entityName}Mutation`,
        update: `useUpdate${entityName}Mutation`,
        delete: `useDelete${entityName}Mutation`
    };

    const hookName = hookNames[hookType];
    return apiHooks[hookName];
};

export const apiEndpoints = {};

export { apiServices, apiHooks };