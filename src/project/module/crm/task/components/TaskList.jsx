import React from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined, BellOutlined } from '@ant-design/icons';
import { Tooltip, Space, Avatar, Badge } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../../components/CommonTable';
import ModuleGrid from '../../../../../components/ModuleGrid';
import TaskCard from './TaskCard';

const TaskList = ({
    tasks = [],
    userMap = {},
    isLoading = false,
    viewMode = 'list',
    currentPage = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
    onEdit,
    onView,
    onDelete,
    onBulkDelete,
    onSetReminder,
    users = [],
    employees = [],
    roles = [],
    designations = []
}) => {
    const getAssignedUserDetails = (userId) => {
        if (isLoading) {
            return { name: 'Loading...', designation: '', type: null };
        }

        if (!userId) {
            return { name: 'Unassigned', designation: '', type: null };
        }

        // Handle prefixed IDs like 'user_123' or 'employee_456'
        let type = null;
        let id = userId;

        if (typeof userId === 'string') {
            if (userId.startsWith('user_')) {
                type = 'user';
                id = userId.replace('user_', '');
            } else if (userId.startsWith('employee_')) {
                type = 'employee';
                id = userId.replace('employee_', '');
            }
        }

        // First check in users
        if (type === 'user' || !type) {
            const user = users.find(u => u.id === id || u.id === userId);
            if (user) {
                let designationName = '';
                if (user.designation_id) {
                    const userDesignation = designations.find(d => d.id === user.designation_id);
                    designationName = userDesignation ? userDesignation.designation : '';
                }

                // Only use username, not first_name and last_name
                const userName = user.username || 'Unnamed User';

                return { name: userName, designation: designationName, type: 'user' };
            }
        }

        // Then check in employees
        if (type === 'employee' || !type) {
            const employee = employees.find(e => e.id === id || e.id === userId);
            if (employee) {
                let designationName = '';
                
                if (employee.designation_id) {
                    const employeeDesignation = designations.find(d => d.id === employee.designation_id);
                    designationName = employeeDesignation ? employeeDesignation.designation : 'Employee';
                } else {
                    designationName = employee.designation || 'Employee';
                }

                // Only use username or employee_id, not first_name and last_name
                const employeeName = employee.username || employee.employee_id || 'Unnamed Employee';

                return { name: employeeName, designation: designationName, type: 'employee' };
            }
        }

        return { name: 'Unassigned', designation: '', type: null };
    };

    // Create columns directly instead of using generateColumns
    const columns = [
        {
            title: 'Title',
            dataIndex: 'taskName',
            key: 'taskName',
            render: (text) => (
                <div className="name-container">
                    <Tooltip title={text}>
                        <span className="name"><strong>{text.length > 30 ? `${text.substring(0, 30)}...` : text}</strong></span>
                    </Tooltip>
                </div>
            )
        },
        {
            title: 'Assigned To',
            dataIndex: 'assignedTo',
            key: 'assignedTo',
            width: '300px',
            render: (userId) => {
                const userDetails = getAssignedUserDetails(userId);
                return (
                    <div className="name-container dropdown-item">
                        <Space align="center">
                            <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                                {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                            <Space direction="vertical" size={0}>
                                <span className="name">{userDetails.name}</span>
                                {userDetails.designation && (
                                    <div className="role-badge">
                                        <Badge status={userDetails.type === 'user' ? "processing" : "default"} />
                                        <span className="role-text">{userDetails.designation}</span>
                                    </div>
                                )}
                            </Space>
                        </Space>
                    </div>
                );
            }
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority) => {
                const getPriorityColor = (priority) => {
                    switch (priority?.toLowerCase()) {
                        case 'high':
                            return 'error';
                        case 'medium':
                            return 'warning';
                        case 'low':
                            return 'success';
                        default:
                            return 'default';
                    }
                };

                return <Badge status={getPriorityColor(priority)} text={priority || 'Medium'} />;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const getStatusColor = (status) => {
                    switch (status?.toLowerCase()) {
                        case 'completed':
                            return 'success';
                        case 'in progress':
                            return 'processing';
                        case 'pending':
                            return 'warning';
                        case 'cancelled':
                            return 'error';
                        default:
                            return 'default';
                    }
                };

                return <Badge status={getStatusColor(status)} text={status || 'Pending'} />;
            }
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
        }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: onView,
            module: 'task',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'task',
            permission: 'update'
        },
        {
            key: 'reminder',
            label: 'Set Reminder',
            icon: <BellOutlined />,
            handler: onSetReminder,
            module: 'task',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'task',
            permission: 'delete'
        }
    ];

    const renderTaskCard = (task) => (
        <TaskCard
            key={task.id}
            task={task}
            userMap={userMap}
            onEdit={() => onEdit(task)}
            onView={() => onView(task)}
            onDelete={() => onDelete(task)}
        />
    );

    if (viewMode === 'grid') {
        return (
            <ModuleGrid
                items={tasks}
                renderItem={renderTaskCard}
                isLoading={isLoading}
                emptyMessage="No tasks found"
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={tasks.map(task => ({ ...task, key: task.id }))}
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
                    itemName: 'tasks',
                    className: 'task-table'
                }}
                searchableColumns={['taskName', 'description', 'status', 'priority']}
                dateColumns={['startDate', 'endDate', 'created_at', 'updated_at']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="task"
            />
        </div>
    );
};

export default TaskList;                                                  