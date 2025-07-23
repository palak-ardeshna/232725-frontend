import React from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Avatar, Space, Tooltip } from 'antd';
import EmployeeCard from './EmployeeCard.jsx';
import CommonTable from '../../../../../components/CommonTable';
import ModuleGrid from '../../../../../components/ModuleGrid';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';

const truncateText = (text, maxLength = 25) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;

    return (
        <Tooltip title={text}>
            <span className="name">{text.substring(0, maxLength)}...</span>
        </Tooltip>
    );
};

const EmployeeList = ({
    employees,
    roleMap,
    designationMap,
    departmentMap,
    isLoading,
    viewMode,
    pagination,
    onEdit,
    onView,
    onDelete,
    onBulkDelete
}) => {
    const getInitials = (employee) => {
        if (!employee) return '';
        const firstInitial = employee.first_name ? employee.first_name.charAt(0).toUpperCase() : '';
        const lastInitial = employee.last_name ? employee.last_name.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial || (employee.username ? employee.username.charAt(0).toUpperCase() : '');
    };

    const fields = [
        {
            name: 'username',
            title: 'Username',
            sorter: (a, b) => (a.username || '').localeCompare(b.username || ''),
            render: (username, record) => {
                if (!record) return '-';
                return (
                    <div className="name-container">
                        <Space>
                            {record.profile_picture ?
                                <Avatar src={record.profile_picture} /> :
                                <Avatar>{getInitials(record)}</Avatar>
                            }
                            <Tooltip title={username || '-'}>
                                <span className="name">{username ? (username.length > 20 ? `${username.substring(0, 20)}...` : username) : '-'}</span>
                            </Tooltip>
                        </Space>
                    </div>
                );
            },
            width: '200px'
        },
        {
            name: 'email',
            title: 'Email',
            render: (email) => (
                <div className="name-container">
                    <Tooltip title={email || '-'}>
                        <span className="name">{email ? (email.length > 25 ? `${email.substring(0, 25)}...` : email) : '-'}</span>
                    </Tooltip>
                </div>
            )
        },
        {
            name: 'role_id',
            title: 'Role',
            render: (roleId) => truncateText(roleMap?.[roleId] || 'N/A', 20)
        },
        {
            name: 'department',
            title: 'Department',
            render: (departmentId) => truncateText(departmentMap?.[departmentId] || 'N/A', 20)
        },
        {
            name: 'designation',
            title: 'Designation',
            render: (designationId) => truncateText(designationMap?.[designationId] || 'N/A', 20)
        },
        {
            name: 'createdAt',
            title: 'Created At',
            sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: onView,
            module: 'employee',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'employee',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'employee',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt', 'updatedAt']
    });

    const renderEmployeeCard = (employee) => {
        if (!employee) return null;
        return (
            <EmployeeCard
                key={employee.id}
                employee={employee}
                roleName={roleMap?.[employee.role_id]}
                departmentName={departmentMap?.[employee.department]}
                designationName={designationMap?.[employee.designation]}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
            />
        );
    };

    if (viewMode === 'grid') {
        return (
            <ModuleGrid
                items={employees}
                renderItem={renderEmployeeCard}
                isLoading={isLoading}
                emptyMessage="No employees found"
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={employees}
                columns={columns}
                isLoading={isLoading}
                pagination={pagination}
                actionItems={actions}
                extraProps={{
                    itemName: 'employees',
                    onChange: (newPagination) => pagination.onChange(newPagination.current, newPagination.pageSize)
                }}
                searchableColumns={['username', 'email', 'department', 'designation']}
                dateColumns={['createdAt', 'updatedAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="employee"
            />
        </div>
    );
};

export default EmployeeList; 