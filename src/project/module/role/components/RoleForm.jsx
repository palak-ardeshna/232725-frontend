import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Form, Checkbox, Row, Col, Typography, Tabs, Card, Tooltip } from 'antd';
import AdvancedForm from '../../../../components/AdvancedForm';
import {
    moduleCategories,
    permissionTypes,
    parsePermissions,
    areAllModulePermissionsSelected,
    isAnyModulePermissionSelected,
    areAllCategoryPermissionsSelected,
    isAnyCategoryPermissionSelected,
    getCategoryModules,
    getModulesWithPermissionCount,
    publicModules
} from '../permissions.jsx';
import '../role.scss';

const { Text } = Typography;

const validationSchema = Yup.object().shape({
    role_name: Yup.string()
        .required('Role name is required')
        .matches(/^(?!\.).*[a-zA-Z0-9].*$/, 'Role name must contain letters or numbers, cannot be just a dot')
        .max(50, 'Role name must be less than 50 characters'),
});

const RoleForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const initialPermissions = parsePermissions(initialValues?.permissions);

    const [permissions, setPermissions] = useState(initialPermissions);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('crm');
    const [roleName, setRoleName] = useState(initialValues?.role_name || '');

    const handleTabChange = (newTab) => {
        const currentValues = form.getFieldsValue();
        setRoleName(currentValues.role_name);
        setActiveTab(newTab);
    };

    useEffect(() => {
        form.setFieldsValue({ role_name: roleName });
    }, [form, roleName, activeTab]);

    const updateRoleNameFromForm = () => {
        const currentValues = form.getFieldsValue();
        setRoleName(currentValues.role_name);
    };

    const isAnyOtherPermissionSelected = (module) => {
        return (
            permissions[module]?.create === true ||
            permissions[module]?.update === true ||
            permissions[module]?.delete === true
        );
    };

    const handleModulePermissionChange = (module, permission, checked) => {
        updateRoleNameFromForm();
        setPermissions(prev => {
            const updated = { ...prev };
            if (!updated[module]) {
                updated[module] = {};
            }

            updated[module][permission] = checked;

            if (checked && (permission === 'create' || permission === 'update' || permission === 'delete')) {
                updated[module]['read'] = true;
            }

            if (!checked) {
                const allFalse = permissionTypes.every(
                    type => type.key === permission || !updated[module][type.key]
                );
                if (allFalse) {
                    delete updated[module];
                }
            }

            return updated;
        });
    };

    const handleAllModulePermissions = (module, checked) => {
        updateRoleNameFromForm();
        setPermissions(prev => {
            const updated = { ...prev };

            if (checked) {
                if (!updated[module]) {
                    updated[module] = {};
                }
                permissionTypes.forEach(type => {
                    updated[module][type.key] = checked;
                });
            } else {
                if (updated[module]) {
                    delete updated[module];
                }
            }

            return updated;
        });
    };

    const handleAllCategoryPermissions = (category, checked) => {
        updateRoleNameFromForm();
        const allCategoryModules = getCategoryModules(category);
        // Filter out public modules
        const categoryModules = allCategoryModules.filter(module => !publicModules.includes(module.key));

        setPermissions(prev => {
            const updated = { ...prev };
            categoryModules.forEach(module => {
                if (checked) {
                    if (!updated[module.key]) {
                        updated[module.key] = {};
                    }
                    permissionTypes.forEach(type => {
                        updated[module.key][type.key] = checked;
                    });
                } else {
                    if (updated[module.key]) {
                        delete updated[module.key];
                    }
                }
            });
            return updated;
        });
    };

    const handleSubmit = (values) => {
        onSubmit({
            ...values,
            permissions: permissions
        });
    };

    const renderPermissionTable = (category) => {
        const allCategoryModules = getCategoryModules(category);
        // Filter out public modules
        const categoryModules = allCategoryModules.filter(module => !publicModules.includes(module.key));

        return (
            <div className="permission-table" style={{ width: '100%', overflow: 'auto' }}>
                <div className="permission-header">
                    <Row className="header-row" style={{ display: 'flex', width: '100%' }}>
                        <Col flex="280px" className="module-col">
                            <div className="module-header">
                                <Checkbox
                                    checked={areAllCategoryPermissionsSelected(permissions, category)}
                                    indeterminate={isAnyCategoryPermissionSelected(permissions, category) && !areAllCategoryPermissionsSelected(permissions, category)}
                                    onChange={(e) => handleAllCategoryPermissions(category, e.target.checked)}
                                >
                                    <Text strong>{moduleCategories.find(c => c.key === category)?.name}</Text>
                                </Checkbox>
                            </div>
                        </Col>
                        <Col flex="auto" style={{ display: 'flex' }}>
                            <div style={{ flex: '0 0 20%', textAlign: 'center' }} className="permission-header-col">All</div>
                            {permissionTypes.map(permission => (
                                <div style={{ flex: '0 0 20%', textAlign: 'center' }} key={permission.key} className="permission-header-col">
                                    {permission.name}
                                </div>
                            ))}
                        </Col>
                    </Row>
                </div>

                <div className="permission-body">
                    {categoryModules.map((module) => (
                        <Row key={module.key} className="module-row" style={{ display: 'flex', width: '100%' }}>
                            <Col flex="280px" className="module-col">
                                <div className="module-name">
                                    {module.name}
                                    {isAnyModulePermissionSelected(permissions, module.key) && (
                                        <span className="permission-count">
                                            ({Object.values(permissions[module.key] || {}).filter(Boolean).length})
                                        </span>
                                    )}
                                </div>
                            </Col>
                            <Col flex="auto" style={{ display: 'flex' }}>
                                <div style={{ flex: '0 0 20%', textAlign: 'center' }} className="permission-col">
                                    <Checkbox
                                        checked={areAllModulePermissionsSelected(permissions, module.key)}
                                        indeterminate={isAnyModulePermissionSelected(permissions, module.key) && !areAllModulePermissionsSelected(permissions, module.key)}
                                        onChange={(e) => handleAllModulePermissions(module.key, e.target.checked)}
                                    />
                                </div>
                                {permissionTypes.map(permission => {
                                    const isDisabled =
                                        permission.key === 'read' &&
                                        isAnyOtherPermissionSelected(module.key);

                                    return (
                                        <div style={{ flex: '0 0 20%', textAlign: 'center' }} key={permission.key} className="permission-col">
                                            <Tooltip
                                                title={isDisabled ? "Read permission required" : ""}
                                            >
                                                <Checkbox
                                                    checked={permissions[module.key]?.[permission.key] || false}
                                                    onChange={(e) => handleModulePermissionChange(module.key, permission.key, e.target.checked)}
                                                    disabled={isDisabled}
                                                />
                                            </Tooltip>
                                        </div>
                                    );
                                })}
                            </Col>
                        </Row>
                    ))}
                </div>
            </div>
        );
    };

    const formFields = [
        {
            name: 'role_name',
            label: 'Role Name',
            type: 'text',
            placeholder: 'Enter role name',
            rules: [
                { required: true, message: 'Please enter role name' },
                { max: 50, message: 'Role name must be less than 50 characters' }
            ],
            maxLength: 50,
            span: 24
        },
        {
            name: 'permissions',
            label: '',
            type: 'custom',
            span: 24,
            render: () => (
                <div className="permissions-section">
                    <Card className="permissions-card">
                        <Tabs
                            activeKey={activeTab}
                            onChange={handleTabChange}
                            type="card"
                            className="permission-tabs"
                            items={moduleCategories.map(category => ({
                                key: category.key,
                                label: (
                                    <span>
                                        {category.name}
                                        {isAnyCategoryPermissionSelected(permissions, category.key) && (
                                            <span className="permission-count">
                                                ({getModulesWithPermissionCount(permissions, category.key)})
                                            </span>
                                        )}
                                    </span>
                                ),
                                children: renderPermissionTable(category.key)
                            }))}
                        />
                    </Card>
                </div>
            )
        }
    ];

    return (
        <AdvancedForm
            form={form}
            fields={formFields}
            initialValues={{ role_name: roleName }}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            submitButtonText={initialValues ? 'Update Role' : 'Create Role'}
            loading={isSubmitting}
            validationSchema={validationSchema}
        />
    );
};

export default RoleForm;