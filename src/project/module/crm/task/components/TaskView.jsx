import React, { useEffect, useState, useMemo } from 'react';
import { Spin, Modal, Tag, Avatar, Badge, Table, Space, Tooltip, Button, message, Timeline, Descriptions, List } from 'antd';
import {
    RiTaskLine,
    RiCalendarLine,
    RiTimeLine,
    RiUserLine,
    RiAlarmLine,
    RiFileTextLine,
    RiPriceTag3Line,
    RiFileLine,
    RiFile2Line,
    RiFileExcelLine,
    RiFilePdfLine,
    RiFileImageLine,
    RiFileZipLine,
    RiFileWordLine,
    RiEyeLine,
    RiDownloadLine,
    RiDeleteBin6Line,
    RiCheckLine,
    RiFileListLine,
    RiArrowRightLine
} from 'react-icons/ri';
import dayjs from 'dayjs';
import { LoadingOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../common/theme/ThemeContext';
import { useSelector } from 'react-redux';
import { useGetEmployeesQuery } from '../../../../../config/api/apiServices';
import ErrorBoundary from '../../../../../components/ErrorBoundary';

const TaskHistory = ({ history = [], employees = {} }) => {
    // Make sure history is an array regardless of the input format
    const ensureArray = (historyData) => {
        if (!historyData) return [];

        if (typeof historyData === 'string') {
            try {
                const parsed = JSON.parse(historyData);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Error parsing history string:', e);
                return [];
            }
        }

        return Array.isArray(historyData) ? historyData : [];
    };

    const historyArray = ensureArray(history);

    if (!historyArray.length) return null;

    // Sort history in reverse chronological order (newest first)
    const sortedHistory = [...historyArray].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'var(--text-success)';
            case 'in progress':
                return 'var(--text-info)';
            case 'pending':
            case 'open':
                return 'var(--text-warning)';
            case 'cancelled':
                return 'var(--text-error)';
            default:
                return 'var(--text-info)';
        }
    };

    const formatStatus = (status) => {
        if (status === null) return 'New';
        return status;
    };

    // Fallback function to get user name if not in history
    const getUserName = (record) => {
        // First try to use userName directly from the history record
        if (record.userName) {
            return record.userName;
        }

        const userId = record.userId;
        if (!userId) return 'System';

        // If userId starts with employee_ prefix or is a direct ID
        if (userId.startsWith('employee_') && employees[userId.replace('employee_', '')]) {
            const employee = employees[userId.replace('employee_', '')];
            return employee.username || 'Employee';
        }

        // Check in employees object directly
        if (employees[userId]) {
            const employee = employees[userId];
            return employee.username || 'Employee';
        }

        // Special case for admin users
        if (userId === 'SmaqadBR5DAayvWZeqiPxr1') {
            return 'Admin User';
        }

        return 'Unknown User';
    };

    return (
        <div className="task-history">
            <h3 className="task-history-title">Status History</h3>
            <div className="timeline-container">
                <div className="timeline-line"></div>

                {sortedHistory.map((record, index) => (
                    <div key={index} className="timeline-item">
                        <div className={`timeline-dot ${record.to?.toLowerCase() === 'completed' ? 'completed' : ''}`}>
                            {record.to?.toLowerCase() === 'completed' && <RiCheckLine />}
                        </div>

                        <div className="timeline-content">
                            <div className="status-transition">
                                <span className="status-from" style={{ color: getStatusColor(record.from) }}>
                                    {formatStatus(record.from)}
                                </span>
                                {' '}<RiArrowRightLine className="arrow-icon" />{' '}
                                <span className="status-to" style={{ color: getStatusColor(record.to) }}>
                                    {formatStatus(record.to)}
                                </span>
                            </div>
                            <div className="timeline-meta">
                                <RiTimeLine className="meta-icon" />
                                {dayjs(record.date).format('MMM D, YYYY [at] h:mm A')}
                            </div>
                            <div className="timeline-user">
                                <RiUserLine className="meta-icon" />
                                {getUserName(record)}
                            </div>
                            {record.reason && (
                                <div className="timeline-reason">
                                    <RiFileListLine className="reason-icon" />
                                    <span>{record.reason}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TaskView = ({
    task,
    userMap,
    isLoading,
    visible,
    onClose,
    onDeleteFile,
    fileDeleteStates,
    isDrawerContent = false,
    isInDrawer = false,
    roles,
    employees,
    designations = []
}) => {
    const { isDark, theme } = useTheme();
    const themeColor = getThemeColor();
    const currentUser = useSelector(state => state.auth.user);

    // Fetch admin users (this is the current user from auth state)
    const adminUsers = useSelector(state => {
        return state.auth.user ? { [state.auth.user.id]: state.auth.user } : {};
    });

    // Handle task history data
    const processTaskHistory = (taskData) => {
        if (!taskData) return [];

        let historyData = taskData.statusHistory;

        if (typeof historyData === 'string') {
            try {
                historyData = JSON.parse(historyData);
            } catch (e) {
                console.error('Error parsing task history:', e);
                historyData = [];
            }
        }

        return Array.isArray(historyData) ? historyData : [];
    };

    const taskHistory = processTaskHistory(task);

    // Fetch all employees
    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({
        page: 1,
        limit: 1000
    });

    // Create maps for employees
    const [employeesMap, setEmployeesMap] = useState({});

    useEffect(() => {
        if (employeesData?.data?.items) {
            const map = {};
            employeesData.data.items.forEach(employee => {
                // Store with both formats: with and without prefix
                map[employee.id] = employee;
                map[`employee_${employee.id}`] = employee;
            });
            setEmployeesMap(map);
        }
    }, [employeesData]);

    // Combine all user sources
    const combinedUsers = useMemo(() => {
        return {
            ...employeesMap,
            ...adminUsers,
            // Special case for admin user
            'SmaqadBR5DAayvWZeqiPxr1': {
                id: 'SmaqadBR5DAayvWZeqiPxr1',
                username: 'Admin User'
            }
        };
    }, [employeesMap, adminUsers]);

    if (!visible) return null;

    // Helper to get current theme color
    function getThemeColor() {
        const themeOptions = [
            { value: 'theme-default', color: '#19a7ce' },
            { value: 'theme-pink', color: '#ec4899' },
            { value: 'theme-red', color: '#ef4444' },
            // Default to pink if theme not found
            { value: 'default', color: '#E91E63' }
        ];

        const currentTheme = themeOptions.find(t => t.value === theme) || themeOptions.find(t => t.value === 'theme-default');
        return currentTheme?.color || '#E91E63';
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            return dayjs(timestamp).format('DD MMM YYYY');
        } catch (error) {
            return 'N/A';
        }
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

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'red';
            case 'medium':
                return 'orange';
            case 'low':
                return 'green';
            default:
                return 'default';
        }
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return <RiFileLine />;
        const extension = fileName.split('.').pop().toLowerCase();

        switch (extension) {
            case 'pdf':
                return <RiFilePdfLine className="file-icon-pdf" />;
            case 'xls':
            case 'xlsx':
            case 'csv':
                return <RiFileExcelLine className="file-icon-excel" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
                return <RiFileImageLine className="file-icon-image" />;
            case 'zip':
            case 'rar':
                return <RiFileZipLine className="file-icon-zip" />;
            case 'doc':
            case 'docx':
                return <RiFileWordLine className="file-icon-word" />;
            default:
                return <RiFile2Line />;
        }
    };

    const modalTitle = (
        <div className="modal-header">
            <div className="modal-header-title">
                <RiTaskLine /> Task Details
            </div>
        </div>
    );

    if (isLoading) {
        return isDrawerContent ? (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        ) : (
            <Modal
                title={modalTitle}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={700}
                className={`common-modal modern-modal ${isDark ? 'dark-theme-modal' : ''}`}
                maskClosable={true}
                centered
            >
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            </Modal>
        );
    }

    if (!task) {
        return isDrawerContent ? (
            <div className="error-container">
                Task not found
            </div>
        ) : (
            <Modal
                title={modalTitle}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={700}
                className={`common-modal modern-modal ${isDark ? 'dark-theme-modal' : ''}`}
                maskClosable={true}
                centered
            >
                <div className="error-container">
                    Task not found
                </div>
            </Modal>
        );
    }

    const hasAttachments = task.attachments &&
        (Array.isArray(task.attachments) ? task.attachments.length > 0 : true);

    const getAssignedUserDetails = (userId) => {
        if (!userId) {
            return { name: 'Unassigned', designation: '', type: null };
        }

        // Handle prefixed IDs
        let id = userId;
        if (typeof userId === 'string' && userId.startsWith('employee_')) {
            id = userId.replace('employee_', '');
        }

        // Check in combined users (employees and admin)
        const user = combinedUsers[id] || combinedUsers[userId];
        if (user) {
            let designationName = '';
            if (user.designation_id) {
                const userDesignation = designations ? designations.find(d => d.id === user.designation_id) : null;
                designationName = userDesignation ? userDesignation.designation : '';
            }

            return {
                name: user.username || 'Unnamed Employee',
                designation: designationName || user.designation || 'Employee',
                type: 'employee'
            };
        }

        return { name: userMap[userId] || 'Unassigned', designation: '', type: null };
    };

    const taskViewContent = (
        <div className="modern-view modern-modal-view">
            <div className="header">
                <div className="avatar-container">
                    <Avatar
                        size={80}
                        className="avatar"
                        icon={<RiTaskLine />}
                        style={{ backgroundColor: themeColor }}
                    />
                    <Badge
                        status={task.status?.toLowerCase() === 'completed' ? 'success' :
                            task.status?.toLowerCase() === 'in progress' ? 'processing' :
                                task.status?.toLowerCase() === 'pending' ? 'warning' : 'error'}
                        className="status-badge"
                    />
                </div>

                <div className="basic-info">
                    <h2 className="name">{task.taskName}</h2>
                    <div className="badge-container">
                        <div className="badge status-badge-container">
                            <RiPriceTag3Line className="icon" />
                            <span color={getStatusColor(task.status)} style={{ margin: 0, fontSize: '14px', padding: '2px 8px' }}>{task.status || 'Pending'}</span>
                        </div>
                        {task.priority && (
                            <div className="badge" style={{
                                backgroundColor: getPriorityColor(task.priority) === 'red' ? (isDark ? '#ff7875' : '#ff4d4f') :
                                    getPriorityColor(task.priority) === 'orange' ? (isDark ? '#ffc069' : '#faad14') :
                                        getPriorityColor(task.priority) === 'green' ? (isDark ? '#73d13d' : '#52c41a') : (isDark ? '#d9d9d9' : '#d9d9d9')
                            }}>
                                <RiAlarmLine className="icon" />
                                <span className="text">{task.priority}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="details-container">
                <div className="detail-item">
                    <div className="detail-icon">
                        <RiFileTextLine />
                    </div>
                    <div className="detail-content">
                        <div className="detail-label">Description</div>
                        <div className="detail-value">{task.description || 'No description provided'}</div>
                    </div>
                </div>

                <div className="detail-item">
                    <div className="detail-icon">
                        <RiUserLine />
                    </div>
                    <div className="detail-content">
                        <div className="detail-label">Assigned To</div>
                        <div className="detail-value">
                            {(() => {
                                const userDetails = getAssignedUserDetails(task.assignedTo);
                                return (
                                    <div className="name-container">
                                        <Space align="center">
                                            <Avatar style={{ backgroundColor: themeColor }}>
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
                            })()}
                        </div>
                    </div>
                </div>

                {hasAttachments && (
                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiPriceTag3Line />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Attachments</div>
                            <div className="detail-value attachments-list">
                                <Table
                                    dataSource={(() => {
                                        if (!task.attachments) return [];

                                        if (typeof task.attachments === 'string') {
                                            try {
                                                const parsed = JSON.parse(task.attachments);
                                                if (Array.isArray(parsed)) {
                                                    return parsed.map((attachment, index) => ({
                                                        key: index,
                                                        fileName: attachment.file_name || `Attachment ${index + 1}`,
                                                        fileUrl: attachment.file_url,
                                                        attachment
                                                    }));
                                                } else if (parsed) {
                                                    return [{
                                                        key: 0,
                                                        fileName: parsed.file_name || 'Attachment',
                                                        fileUrl: parsed.file_url,
                                                        attachment: parsed
                                                    }];
                                                }
                                            } catch (e) {
                                                console.error('Failed to parse attachments:', e);
                                                return [];
                                            }
                                        }

                                        if (Array.isArray(task.attachments)) {
                                            return task.attachments.map((attachment, index) => ({
                                                key: index,
                                                fileName: attachment.file_name || `Attachment ${index + 1}`,
                                                fileUrl: attachment.file_url,
                                                attachment
                                            }));
                                        }

                                        if (typeof task.attachments === 'object' && task.attachments !== null) {
                                            return [{
                                                key: 0,
                                                fileName: task.attachments.file_name || 'Attachment',
                                                fileUrl: task.attachments.file_url,
                                                attachment: task.attachments
                                            }];
                                        }

                                        return [];
                                    })()}
                                    columns={[
                                        {
                                            title: 'Type',
                                            dataIndex: 'fileName',
                                            key: 'type',
                                            width: 100,
                                            render: (fileName) => (
                                                <div className="file-icon">
                                                    {getFileIcon(fileName)}
                                                </div>
                                            )
                                        },
                                        {
                                            title: 'File Name',
                                            dataIndex: 'fileName',
                                            key: 'name',
                                            render: (fileName) => (
                                                <div className="file-name">
                                                    {fileName}
                                                </div>
                                            )
                                        },
                                        {
                                            title: 'Actions',
                                            dataIndex: 'fileUrl',
                                            key: 'actions',
                                            width: 120,
                                            render: (fileUrl, record) => (
                                                <Space>
                                                    {fileUrl && (
                                                        <>
                                                            <Tooltip title="View File">
                                                                <a
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="action-button"
                                                                >
                                                                    <RiEyeLine />
                                                                </a>
                                                            </Tooltip>
                                                            <Tooltip title="Delete File">
                                                                <a
                                                                    onClick={() => onDeleteFile({
                                                                        fileUrl: record.fileUrl,
                                                                        fileName: record.fileName,
                                                                        attachment: record.attachment
                                                                    })}
                                                                    className="action-button delete-button"
                                                                    style={{
                                                                        color: '#ff4d4f',
                                                                        cursor: fileDeleteStates[record.fileUrl] ? 'not-allowed' : 'pointer'
                                                                    }}
                                                                >
                                                                    {fileDeleteStates[record.fileUrl] ? <LoadingOutlined /> : <RiDeleteBin6Line />}
                                                                </a>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Space>
                                            )
                                        }
                                    ]}
                                    pagination={false}
                                    size="small"
                                    className="table-list"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="detail-item">
                    <div className="detail-icon">
                        <RiCalendarLine />
                    </div>
                    <div className="detail-content">
                        <div className="detail-label">Start Date</div>
                        <div className="detail-value">{task.startDate ? dayjs(task.startDate).format('DD MMM YYYY') : 'Not set'}</div>
                    </div>
                </div>

                <div className="detail-item">
                    <div className="detail-icon">
                        <RiCalendarLine />
                    </div>
                    <div className="detail-content">
                        <div className="detail-label">End Date</div>
                        <div className="detail-value">{task.endDate ? dayjs(task.endDate).format('DD MMM YYYY') : 'Not set'}</div>
                    </div>
                </div>

                <div className="detail-item">
                    <div className="detail-icon">
                        <RiTimeLine />
                    </div>
                    <div className="detail-content">
                        <div className="detail-label">Created At</div>
                        <div className="detail-value">{formatDate(task.createdAt)}</div>
                    </div>
                </div>

                <div className="detail-item">
                    <div className="detail-icon">
                        <RiTimeLine />
                    </div>
                    <div className="detail-content">
                        <div className="detail-label">Last Updated</div>
                        <div className="detail-value">{formatDate(task.updatedAt || task.createdAt)}</div>
                    </div>
                </div>
            </div>

            {/* Only show status history if it exists and has entries */}
            {taskHistory && Array.isArray(taskHistory) && taskHistory.length > 0 && (
                <div className="section-divider">
                    <TaskHistory
                        history={taskHistory}
                        employees={combinedUsers}
                    />
                </div>
            )}
        </div>
    );

    return isDrawerContent ? (
        taskViewContent
    ) : (
        <ErrorBoundary>
            <Modal
                title={modalTitle}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={800}
                className="common-modal modern-modal"
                maskClosable={true}
                centered
            >
                {taskViewContent}
            </Modal>
        </ErrorBoundary>
    );
};

export default TaskView;