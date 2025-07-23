import React from 'react';
import { MdOutlineDescription, } from 'react-icons/md';
import { FaUserAlt } from 'react-icons/fa';
import { BsCalendarDate } from 'react-icons/bs';
import { RiPriceTag3Line } from 'react-icons/ri';
import ModuleCard from '../../../../../components/ModuleCard';
import { Badge, Space, Avatar } from 'antd';
import dayjs from 'dayjs';

const TaskCard = ({ task, userMap, onEdit, onView, onDelete, users = [], employees = [], roles = [], designations = [] }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return dayjs(timestamp).format('DD/MM/YYYY');
    };

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

    const getPriorityClass = (priority) => {
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

    const getAssignedUserDetails = (userId) => {
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

        return { name: userMap[userId] || 'Unassigned', designation: '', type: null };
    };

    const userDetails = getAssignedUserDetails(task.assignedTo);

    const infoItems = [
        {
            icon: <MdOutlineDescription />,
            content: task.description ? (task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description) : 'No description'
        },
        {
            icon: <FaUserAlt />,
            content: (
                <div className="name-container">
                    <Space align="center">
                        <Avatar style={{ backgroundColor: 'var(--primary-color)' }} size="small">
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
            )
        },
        {
            icon: <RiPriceTag3Line />,
            content: task.status || 'Pending',
            badge: true,
            badgeColor: getStatusColor(task.status)
        }
    ];

    const metaItems = [
        {
            icon: <BsCalendarDate />,
            content: `Start: ${formatDate(task.startDate)}`
        },
        {
            icon: <BsCalendarDate />,
            content: `End: ${formatDate(task.endDate)}`
        }
    ];

    return (
        <ModuleCard
            title={task.taskName}
            infoItems={infoItems}
            metaItems={metaItems}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            item={task}
            truncateTitle={true}
            statusBadge={
                <div className={`priority-tag ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                </div>
            }
            module="task"
        />
    );
};

export default TaskCard; 