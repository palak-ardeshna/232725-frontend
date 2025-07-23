import React from 'react';
import { useSelector } from 'react-redux';
import { hasPermission, parsePermissions } from './permissionUtils.jsx';
import PermissionGuard from '../components/PermissionGuard';
import { publicModules } from '../config/permissions';

export const generateColumns = (fields = [], options = {}) => {
    const { dateFields = [], dateFormat = {} } = options;

    return fields.map(field => {
        // If field already has a render function, preserve it
        if (field.render) {
            return {
                title: field.title || field.name.charAt(0).toUpperCase() + field.name.slice(1),
                dataIndex: field.name,
                key: field.name,
                ...field
            };
        }

        const column = {
            title: field.title || field.name.charAt(0).toUpperCase() + field.name.slice(1),
            dataIndex: field.name,
            key: field.name,
            render: (text, record) => {
                // Handle null/undefined values
                if (text === null || text === undefined) {
                    return '-';
                }

                // Handle date fields
                if (dateFields.includes(field.name)) {
                    const date = new Date(text);
                    const options = dateFormat[field.name] || { day: 'numeric', month: 'long', year: 'numeric' };
                    return date.toLocaleDateString('en-US', options);
                }

                // Default text rendering
                return text.toString();
            },
            ...field
        };

        return column;
    });
};

export const withPermissionCheck = (Component) => {
    return (props) => {
        const { module } = props;
        const user = useSelector(state => state.auth?.user);
        const userType = user?.userType;
        const permissions = parsePermissions(user?.permissions);

        if (!module) {
            return <Component {...props} />;
        }

        const canRead = hasPermission(userType, permissions, module, 'read');

        if (!canRead) {
            return null;
        }

        return <Component {...props} userType={userType} permissions={permissions} />;
    };
};

export const generateActionItems = (actions = [], handlers = {}) => {
    return (record) => {
        if (!Array.isArray(actions) || actions.length === 0) {
            return [];
        }

        try {
            return actions
                .map(action => {
                    if (action.shouldShow && !action.shouldShow(record)) {
                        return null;
                    }

                    const item = {
                        key: action.key || `action-${Math.random().toString(36).substring(2, 9)}`,
                        icon: action.icon || null,
                        danger: Boolean(action.danger),
                        onClick: () => {
                            try {
                                if (typeof action.handler === 'function') {
                                    action.handler(record);
                                } else if (handlers && typeof handlers[action.key] === 'function') {
                                    handlers[action.key](record);
                                }
                            } catch (error) {
                                console.error(`Error handling action ${action.key}:`, error);
                            }
                        }
                    };

                    // For public modules, always show the action without permission check
                    if (action.module && publicModules.includes(action.module)) {
                        item.label = action.label || action.key;
                    }
                    // For other modules, use PermissionGuard
                    else if (action.module && action.permission) {
                        item.label = (
                            <PermissionGuard module={action.module} action={action.permission}>
                                {action.label || action.key}
                            </PermissionGuard>
                        );
                    } else {
                        item.label = action.label || action.key;
                    }

                    return item;
                })
                .filter(Boolean);
        } catch (error) {
            console.error('Error generating action items:', error);
            return [];
        }
    };
}; 