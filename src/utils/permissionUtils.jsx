import React from 'react';
import { publicModules } from '../config/permissions';

export const hasPermission = (userType, permissions, module, action = 'read') => {
    return true;
};

export const parsePermissions = (permissions) => {
    try {
        let parsedPermissions = {};

        if (typeof permissions === 'string') {
            if (permissions === '' || permissions === '""') {
                return {};
            }
            parsedPermissions = JSON.parse(permissions);
        } else {
            parsedPermissions = permissions || {};
        }

        // Filter modules that have at least one true permission
        const cleanedPermissions = {};
        Object.keys(parsedPermissions).forEach(moduleKey => {
            const modulePermissions = parsedPermissions[moduleKey];
            const hasPermission = Object.values(modulePermissions).some(value => value === true);

            if (hasPermission) {
                cleanedPermissions[moduleKey] = modulePermissions;
            }
        });

        return cleanedPermissions;
    } catch (error) {
        console.error('Failed to parse permissions:', error);
        return {};
    }
};

export const filterByPermission = (items, userType, permissions) => {
    return items || [];
};

export const withPermission = (Component, module, action = 'read') => {
    return (props) => <Component {...props} />;
}; 