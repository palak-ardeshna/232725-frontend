import { apiServices } from '../config/api/apiRegistry.js';

export const registerApiServices = (apiServiceNames = []) => {
    const reducers = {};
    const middleware = [];

    apiServiceNames.forEach(name => {
        const apiName = `${name}Api`;
        const api = apiServices[apiName];

        if (api) {
            reducers[api.reducerPath] = api.reducer;
            middleware.push(api.middleware);
        }
    });

    return { reducers, middleware };
};


