import React from 'react';
import { Spin, Modal, Avatar, Badge, Tooltip, Typography, Divider } from 'antd';
import {
    FiClock, FiCalendar, FiFileText, FiUsers, FiAlertCircle,
    FiCheckCircle, FiPhone, FiVideo, FiMapPin, FiMail, FiLink
} from 'react-icons/fi';
import dayjs from 'dayjs';

const { Text } = Typography;

const CommonFollowUpView = ({ followUp, isLoading, visible, onClose, usersData = [], rolesData = [] }) => {
    const users = usersData?.data?.items || [];
    const roles = rolesData?.data?.items || [];

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return dayjs(timestamp).format('DD MMM YYYY');
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        return dayjs(time, 'HH:mm:ss').format('h:mm A');
    };

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                        {reporterName ? reporterName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                    </div>
                </div>
            </div>
        );
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'task':
                return <FiCheckCircle />;
            case 'meeting':
                return <FiVideo />;
            case 'call':
                return <FiPhone />;
            default:
                return <FiFileText />;
        }
    };

    const getTypeTitle = (type) => {
        switch (type) {
            case 'task':
                return 'Task Details';
            case 'meeting':
                return 'Meeting Details';
            case 'call':
                return 'Call Details';
            default:
                return 'Follow-up Details';
        }
    };

    const getInitials = () => {
        if (!followUp) return '?';

        const type = followUp.type || '';
        return type.charAt(0).toUpperCase();
    };

    const modalTitle = (
        <div className="modal-header">
            <div className="modal-header-title">
                {followUp && getTypeIcon(followUp.type)} {followUp && getTypeTitle(followUp.type)}
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <Modal
                title={modalTitle}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={700}
                className="common-modal modern-modal"
                maskClosable={true}
                centered
            >
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            </Modal>
        );
    }

    if (!followUp) {
        return (
            <Modal
                title={modalTitle}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={700}
                className="common-modal modern-modal"
                maskClosable={true}
                centered
            >
                <div className="error-container">
                    Follow-up not found
                </div>
            </Modal>
        );
    }

    const meta = followUp.meta || {};

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            className="common-modal modern-modal"
            maskClosable={true}
            centered
        >
            <div className="modern-view modern-modal-view">
                <div className="header">
                    <div className="avatar-container">
                        <Avatar
                            size={80}
                            className="avatar"
                            style={{ backgroundColor: 'var(--primary-color)' }}
                        >
                            {getInitials()}
                        </Avatar>
                        <Badge
                            status={getStatusBadge(followUp.status)}
                            className={`status-badge ${followUp.status}`}
                        />
                    </div>

                    <div className="basic-info">
                        <h2 className="name">
                            <Tooltip title={followUp.subject}>
                                <span style={{
                                    display: 'inline-block',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {followUp.subject.length > 30
                                        ? followUp.subject.substring(0, 30) + '...'
                                        : followUp.subject}
                                </span>
                            </Tooltip>
                        </h2>
                        <div className="badge-container">
                            <div className="badge">
                                <Badge status={getStatusBadge(followUp.status)} />
                                <span className="text" style={{ marginLeft: '6px' }}>{followUp.status.charAt(0).toUpperCase() + followUp.status.slice(1).replace('_', ' ')}</span>
                            </div>
                            {followUp.priority && (
                                <div className="badge" style={{ color: getPriorityColor(followUp.priority) }}>
                                    <Badge color={getPriorityColor(followUp.priority)} />
                                    <span className="text" style={{ marginLeft: '6px' }}>{followUp.priority.charAt(0).toUpperCase() + followUp.priority.slice(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="details-container">
                    {/* Common Details */}
                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiCalendar />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Date</div>
                            <div className="detail-value">{formatDate(followUp.date)}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiUsers />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Members</div>
                            <div className="detail-value">{formatMembers(followUp.members)}</div>
                        </div>
                    </div>

                    {/* Task Specific Details */}
                    {followUp.type === 'task' && meta.task_reporter && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiUsers />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Reporter</div>
                                <div className="detail-value">{getReporterName(meta.task_reporter)}</div>
                            </div>
                        </div>
                    )}

                    {/* Meeting Specific Details */}
                    {followUp.type === 'meeting' && (
                        <>
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <FiVideo />
                                </div>
                                <div className="detail-content">
                                    <div className="detail-label">Meeting Type</div>
                                    <div className="detail-value">{meta.meeting_type === 'online' ? 'Online' : 'Offline'}</div>
                                </div>
                            </div>

                            {meta.meeting_from_time && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <FiClock />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Time</div>
                                        <div className="detail-value">
                                            {formatTime(meta.meeting_from_time)}
                                            {meta.meeting_to_time && ` - ${formatTime(meta.meeting_to_time)}`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {meta.meeting_type === 'online' && meta.meeting_link && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <FiLink />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Meeting Link</div>
                                        <div className="detail-value">
                                            <Tooltip title={meta.meeting_link}>
                                                <a
                                                    href={meta.meeting_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-block',
                                                        maxWidth: '100%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {meta.meeting_link}
                                                </a>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {meta.meeting_type === 'offline' && meta.location && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <FiMapPin />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Location</div>
                                        <div className="detail-value">
                                            <Tooltip title={meta.location}>
                                                <div style={{
                                                    maxWidth: '100%',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {meta.location}
                                                </div>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {meta.agenda && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <FiFileText />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Agenda</div>
                                        <div className="detail-value">
                                            <Tooltip title={meta.agenda}>
                                                <div style={{
                                                    maxHeight: '80px',
                                                    overflow: 'auto',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {meta.agenda}
                                                </div>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Call Specific Details */}
                    {followUp.type === 'call' && (
                        <>
                            <div className="detail-item">
                                <div className="detail-icon">
                                    <FiPhone />
                                </div>
                                <div className="detail-content">
                                    <div className="detail-label">Call Type</div>
                                    <div className="detail-value">{meta.call_type === 'logged' ? 'Logged' : 'Scheduled'}</div>
                                </div>
                            </div>

                            {meta.call_duration && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <FiClock />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Duration</div>
                                        <div className="detail-value">{meta.call_duration}</div>
                                    </div>
                                </div>
                            )}

                            {meta.call_purpose && (
                                <div className="detail-item">
                                    <div className="detail-icon">
                                        <FiFileText />
                                    </div>
                                    <div className="detail-content">
                                        <div className="detail-label">Purpose</div>
                                        <div className="detail-value">
                                            <Tooltip title={meta.call_purpose}>
                                                <div style={{
                                                    maxWidth: '100%',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {meta.call_purpose}
                                                </div>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Description for all types */}
                    {followUp.description && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiFileText />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Description</div>
                                <div className="detail-value">
                                    <Tooltip title={followUp.description}>
                                        <div style={{
                                            maxHeight: '80px',
                                            overflow: 'auto',
                                            wordBreak: 'break-word'
                                        }}>
                                            {followUp.description}
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Call Notes */}
                    {followUp.type === 'call' && meta.call_notes && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiFileText />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Call Notes</div>
                                <div className="detail-value">
                                    <Tooltip title={meta.call_notes}>
                                        <div style={{
                                            maxHeight: '80px',
                                            overflow: 'auto',
                                            wordBreak: 'break-word'
                                        }}>
                                            {meta.call_notes}
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Created/Updated Info */}
                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiClock />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Created At</div>
                            <div className="detail-value">{formatDate(followUp.createdAt)}</div>
                        </div>
                    </div>

                    {followUp.updatedAt && followUp.updatedAt !== followUp.createdAt && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiClock />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Last Updated</div>
                                <div className="detail-value">{formatDate(followUp.updatedAt)}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CommonFollowUpView; 