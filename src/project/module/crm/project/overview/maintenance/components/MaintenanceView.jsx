import React from 'react';
import { Spin, Modal, Avatar, Badge, Tooltip, Typography, Tag } from 'antd';
import { FiTool, FiCalendar, FiDollarSign, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';
import dayjs from 'dayjs';

const { Text } = Typography;

const MaintenanceView = ({ maintenance, isLoading, visible, onClose }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return dayjs(timestamp).format('DD MMM YYYY');
    };

    // Function to truncate text
    const truncateText = (text, maxLength = 30) => {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;

        return (
            <Tooltip title={text}>
                <span className="truncated-text">{text.substring(0, maxLength)}...</span>
            </Tooltip>
        );
    };

    const modalTitle = (
        <div className="modal-header">
            <div className="modal-header-title">
                <FiTool /> Maintenance Details
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

    if (!maintenance) {
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
                    Maintenance record not found
                </div>
            </Modal>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'var(--text-error)';
            case 'Completed': return 'var(--text-success)';
            default: return 'var(--text-primary)';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Preventive': return 'var(--text-info)';
            case 'Corrective': return 'var(--text-warning)';
            case 'Other': return 'var(--text-secondary)';
            default: return 'var(--text-primary)';
        }
    };

    const formatCost = (cost, isFree) => {
        if (isFree || cost === 0 || !cost) {
            return (
                <div className="cost-display">
                    <Tag color="success" className="free-tag">Free</Tag>
                    <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>No charges applied</Text>
                </div>
            );
        }

        const amount = parseFloat(cost);
        return `₹${amount.toLocaleString('en-IN')}`;
    };

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
                            icon={<FiTool />}
                            style={{ backgroundColor: 'var(--primary-color)' }}
                        />
                        <Badge
                            status="processing"
                            color={getStatusColor(maintenance.status)}
                            className="status-badge"
                        />
                    </div>

                    <div className="basic-info">
                        <h2 className="name">
                            {truncateText(maintenance.title, 40)}
                        </h2>
                        <div className="badge-container">
                            <div className="badge">
                                <FiTool className="icon" style={{ color: getTypeColor(maintenance.type) }} />
                                <span className="text">{maintenance.type}</span>
                            </div>
                            <div className="badge">
                                <FiCheckCircle className="icon" style={{ color: getStatusColor(maintenance.status) }} />
                                <span className="text">{maintenance.status}</span>
                            </div>
                            {maintenance.is_free && (
                                <div className="badge">
                                    <FiDollarSign className="icon" style={{ color: 'var(--text-success)' }} />
                                    <span className="text">Free</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="details-container">

                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiDollarSign />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Cost</div>
                            <div className="detail-value">{formatCost(maintenance.cost, maintenance.is_free)}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiCalendar />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Schedule Date</div>
                            <div className="detail-value">{formatDate(maintenance.schedule_date)}</div>
                        </div>
                    </div>

                    {maintenance.performed_on && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiClock />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Performed On</div>
                                <div className="detail-value">{formatDate(maintenance.performed_on)}</div>
                            </div>
                        </div>
                    )}
                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiFileText />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Remarks</div>
                            <div className="detail-value">{maintenance.remarks || 'No remarks provided'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MaintenanceView; 