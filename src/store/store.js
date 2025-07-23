import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../auth/services/authSlice.js";
import { authApi } from "../auth/services/authApi.js";
import { setupListeners } from '@reduxjs/toolkit/query';
import { registerApiServices } from '../utils/storeUtils.js';
import { apiServiceNames } from '../config/api/apiServices.js';
import dashboardApi from "../project/services/dashboardApi.js";

const { reducers: apiReducers, middleware: apiMiddleware } = registerApiServices(apiServiceNames);

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth"]
};

const rootReducer = combineReducers({
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    ...apiReducers
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat(
            authApi.middleware,
            dashboardApi.middleware,
            ...apiMiddleware
        ),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

export default store; 