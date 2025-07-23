import React from 'react';
import { EditOutlined, DeleteOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import { Badge, Tag, Avatar, Tooltip, Space } from 'antd';
import CommonTable from './CommonTable';
import { generateColumns } from '../utils/tableUtils.jsx';
import '../styles/_variables.scss';
import FancyLoader from './FancyLoader';
import moment from 'moment';

const CommonFollowUpList = ({
    followUps = [],
    isLoading = false,
    onEdit,
    onDelete,
    onBulkDelete,
    onView,
    usersData = [],
    rolesData = [],
}) => {
    const users = usersData?.data?.items || [];
    const roles = rolesData?.data?.items || [];

    const getUserFullInfo = (userId) => {
        if (!userId) return { name: 'Unknown User', role: '', initials: '?' };

        const user = users.find(user => user.id === userId);
        if (!user) return { name: 'Unknown User', role: '', initials: '?' };

        const name = user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.username || user.email || 'Unknown User';

        let role = '';
        if (user.role_id) {
            const userRole = roles.find(r => r.id === user.role_id);
            role = userRole ? userRole.role_name : '';
        }

        const initials = name.charAt(0).toUpperCase();

        return { name, role, initials };
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'completed':
                return 'success';
            case 'in_progress':
                return 'processing';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const formatMembers = (members) => {
        if (!members) return '-';

        try {
            let membersArray = [];

            if (typeof members === 'string') {
                try {
                    const parsed = JSON.parse(members);
                    membersArray = Array.isArray(parsed) ? parsed : [members];
                } catch (e) {
                    membersArray = [members];
                }
            } else if (Array.isArray(members)) {
                membersArray = members;
            } else {
                return '-';
            }

            if (membersArray.length === 0) return '-';

            return (
                <div className="member-avatars" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    {membersArray.map((memberId, index) => {
                        if (!memberId) return null;

                        const userInfo = getUserFullInfo(memberId);
                        const colorCode = 'var(--primary-color)';

                        return (
                            <Tooltip key={index} title={
                                <div>
                                    <div>{userInfo.name}</div>
                                    {userInfo.role && <div style={{ fontSize: '12px', opacity: 0.8 }}>{userInfo.role}</div>}
                                </div>
                            }>
                                <Avatar
                                    size="small"
                                    style={{
                                        backgroundColor: colorCode,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    {userInfo.initials}
                                </Avatar>
                            </Tooltip>
                        );
                    })}
                </div>
            );
        } catch (error) {
            return '-';
        }
    };

    const getReporterName = (reporterId) => {
        if (!reporterId) return <span className="no-leader">Not assigned</span>;

        const reporter = users.find(user => user.id === reporterId);
        if (!reporter) return <span className="no-leader">Unknown reporter</span>;

        let roleName = '';
        if (reporter.role_id) {
            const userRole = roles.find(r => r.id === reporter.role_id);
            roleName = userRole ? userRole.role_name : '';
        }

        const reporterName = reporter.first_name && reporter.last_name
            ? `${reporter.first_name} ${reporter.last_name}`
            : reporter.username || 'Unknown User';

        return (
            <div className="name-container dropdown-item">
                <Space align="center">
                    <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                        {reporterName ? reporterName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <Tooltip title={reporterName}>
                            <span className="name">
                                {reporterName.length > 20 ? `${reporterName.substring(0, 20)}...` : reporterName}
                            </span>
                        </Tooltip>
                        {roleName && (
                            <div className="role-badge">
                                <Badge status="processing" />
                                <Tooltip title={roleName}>
                                    <span className="role-text">
                                        {roleName.length > 15 ? `${roleName.substring(0, 15)}...` : roleName}
                                    </span>
                                </Tooltip>
                            </div>
                        )}
                    </Space>
                </Space>
            </div>
        );
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return moment(date).format('MMM D, YYYY');
    };

    const formatTime = (time) => {
        if (!time) return '-';
        return moment(time, 'HH:mm:ss').format('h:mm A');
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'var(--text-error)';
            case 'medium':
                return 'var(--text-warning)';
            case 'low':
                return 'var(--text-success)';
            default:
                return 'var(--text-primary)';
        }
    };

    const commonFields = [
        {
            name: 'subject',
            title: 'Subject',
            render: (text, record) => (
                <div className="title-container">
                    <Tooltip title={text}>
                        <span className="title" style={{
                            maxWidth: '250px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                        }}>
                            {text}
                        </span>
                    </Tooltip>
                </div>
            )
        },
        {
            name: 'status',
            title: 'Status',
            render: (status) => {
                if (!status) return '-';
                return (
                    <div className="status-container">
                        <Badge className="status-badge" status={getStatusBadge(status)} />
                        <span>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span>
                    </div>
                );
            }
        },
        {
            name: 'priority',
            title: 'Priority',
            render: (priority) => priority ?
                <span style={{ fontWeight: '600', color: getPriorityColor(priority) }}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                : null,
            filters: [
                { text: 'High', value: 'high' },
                { text: 'Medium', value: 'medium' },
                { text: 'Low', value: 'low' }
            ],
            onFilter: (value, record) => record.priority === value,
            filterSearch: true
        },
        {
            name: 'members',
            title: 'Members',
            render: (members) => formatMembers(members)
        }
    ];

    const taskFields = [
        ...commonFields,
        {
            name: 'date',
            title: 'Due Date',
            render: (date) => formatDate(date)
        },
        {
            name: 'meta',
            title: 'Reporter',
            render: (meta, record) => getReporterName(meta?.task_reporter)
        }
    ];

    const meetingFields = [
        ...commonFields,
        {
            name: 'date',
            title: 'Meeting Date',
            render: (date) => formatDate(date)
        },
        {
            name: 'meta',
            title: 'Meeting Type',
            render: (meta) => {
                const type = meta?.meeting_type;
                return type ? type.charAt(0).toUpperCase() + type.slice(1) : '-';
            }
        },
        {
            name: 'meta',
            title: 'Start Time',
            render: (meta) => formatTime(meta?.meeting_from_time)
        },
        {
            name: 'meta',
            title: 'End Time',
            render: (meta) => formatTime(meta?.meeting_to_time)
        }
    ];

    const callFields = [
        ...commonFields,
        {
            name: 'date',
            title: 'Call Date',
            render: (date) => formatDate(date)
        },
        {
            name: 'meta',
            title: 'Call Type',
            render: (meta) => {
                const type = meta?.call_type;
                return type ? type.charAt(0).toUpperCase() + type.slice(1) : '-';
            }
        },
        {
            name: 'meta',
            title: 'Duration',
            render: (meta) => meta?.call_duration ? `${meta.call_duration}` : '-'
        },
        {
            name: 'meta',
            title: 'Purpose',
            render: (meta) => meta?.call_purpose || '-'
        }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: onView
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete
        }
    ];

    const determineFollowUpType = () => {
        if (!followUps || followUps.length === 0) return 'task';
        const types = [...new Set(followUps.map(followup => followup.type))];
        return types.length === 1 ? types[0] : 'task';
    };

    const getFieldsForType = (type) => {
        switch (type) {
            case 'task':
                return taskFields;
            case 'meeting':
                return meetingFields;
            case 'call':
                return callFields;
            default:
                return commonFields;
        }
    };

    const currentType = determineFollowUpType();
    const fields = currentType ? getFieldsForType(currentType) : commonFields;
    const columns = generateColumns(fields);
    const followUpsArray = Array.isArray(followUps) ? followUps : [];

    if (isLoading) {
        return <FancyLoader />;
    }

    return (
        <div className="table-list">
            {isLoading ? (
                <FancyLoader />
            ) : (
                <CommonTable
                    data={followUps.map((followUp, index) => ({ ...followUp, key: followUp.id || index }))}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} follow-ups`
                    }}
                    actionItems={actions}
                    extraProps={{
                        itemName: 'follow-ups',
                        className: 'followup-table'
                    }}
                    searchableColumns={['subject', 'status', 'priority', 'date']}
                    rowSelection={true}
                    onBulkDelete={onBulkDelete}
                    module="followup"
                    onRowClick={onView}
                />
            )}
        </div>
    );
};

export default CommonFollowUpList;