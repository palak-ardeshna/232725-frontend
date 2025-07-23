import React from 'react';
import { publicModules } from '../config/permissions';

export const hasPermission = (userType, permissions, module, action = 'read') => {
    if (module === 'dashboard' || module === 'profile' || module === 'system') {
        return true;
    }

    if (publicModules.includes(module)) {
        return true;
    }

    // Admin users have access to everything
    if (userType === 'admin') {
        return true;
    }

    // For employees, check specific permissions
    return permissions?.[module]?.[action] === true;
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
    if (!items || !Array.isArray(items)) return [];

    return items.filter(item => hasPermission(userType, permissions, item.permission));
};

export const withPermission = (Component, module, action = 'read') => {
    return (props) => {
        const { userType, permissions } = props;
        if (!hasPermission(userType, permissions, module, action)) {
            return null;
        }
        return <Component {...props} />;
    };
}; 