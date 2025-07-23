import React from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import CommonTable from '../../../../components/CommonTable';
import { generateColumns } from '../../../../utils/tableUtils.jsx';
import { useGetEmployeesQuery } from '../../../../config/api/apiServices';

const RoleList = ({
    roles = [],
    isLoading = false,
    currentPage = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
    onEdit,
    onView,
    onDelete,
    onBulkDelete
}) => {
    const { data: employeesData } = useGetEmployeesQuery({
        page: 1,
        limit: 1000
    });

    const employees = employeesData?.data?.items || [];
    const rolesWithEmployees = new Set();
    employees.forEach(employee => {
        if (employee.role_id) {
            rolesWithEmployees.add(employee.role_id);
        }
    });

    const truncateText = (text, maxLength = 30) => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;

        return (
            <Tooltip title={text}>
                <span className="truncated-text">{text.substring(0, maxLength)}...</span>
            </Tooltip>
        );
    };

    const fields = [
        {
            name: 'role_name',
            title: 'Role Name',
            render: (text, record) => (
                <div className="name-container">
                    <span className="name">{truncateText(text, 25)}</span>
                </div>
            )
        },
        {
            name: 'permissions',
            title: 'Permissions',
            render: (permissions) => {
                if (!permissions) return "No permissions";

                try {
                    const permissionsObj = typeof permissions === 'string'
                        ? JSON.parse(permissions)
                        : permissions;

                    const moduleCount = Object.keys(permissionsObj).length;
                    if (moduleCount === 0) return "No permissions";

                    let summary = `${moduleCount} ${moduleCount === 1 ? 'module' : 'modules'}`;

                    return summary;
                } catch (error) {
                    return "Invalid format";
                }
            }
        },
        { name: 'createdAt', title: 'Created At' },
        { name: 'updatedAt', title: 'Updated At' }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: onView,
            module: 'role',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'role',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            shouldShow: (record) => !rolesWithEmployees.has(record.id) && record.role_name.toLowerCase() !== 'employee',
            module: 'role',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt', 'updatedAt']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={roles.map(role => ({ ...role, key: role.id }))}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'roles',
                    className: 'role-table'
                }}
                searchableColumns={['role_name']}
                dateColumns={['createdAt', 'updatedAt']}
                rowSelection={(record) => !rolesWithEmployees.has(record.id) && record.role_name.toLowerCase() !== 'employee'}
                onBulkDelete={onBulkDelete}
                module="role"
            />
        </div>
    );
};

export default RoleList; 