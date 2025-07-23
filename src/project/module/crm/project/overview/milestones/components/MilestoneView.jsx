import React from 'react';
import { Spin, Modal, Avatar, Badge, Tooltip, Typography, Divider } from 'antd';
import { FiFlag, FiCalendar, FiDollarSign, FiPercent, FiClock, FiUsers, FiCheckCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const MilestoneView = ({ milestone, isLoading, visible, onClose, project }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return dayjs(timestamp).format('DD MMM YYYY');
    };

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
                <FiFlag /> Milestone Details
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

    if (!milestone) {
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
                    Milestone not found
                </div>
            </Modal>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'var(--warning-color)';
            case 'In Progress': return 'var(--info-color)';
            case 'Completed': return 'var(--success-color)';
            case 'Overdue': return 'var(--error-color)';
            default: return 'var(--text-primary)';
        }
    };

    const formatPaymentTriggerValue = () => {
        if (!milestone.payment_trigger_value) return 'N/A';

        if (milestone.payment_type === 'unconditional' || milestone.payment_trigger_type === 'fixed_amount') {
            // Format as currency for fixed amounts
            const amount = parseFloat(milestone.payment_trigger_value);
            return `₹ ${amount.toLocaleString('en-IN')}`;
        } else if (milestone.payment_trigger_type === '%') {
            // Format as percentage
            return `${milestone.payment_trigger_value}%`;
        }

        return milestone.payment_trigger_value;
    };

    const formatPaymentRequestStage = () => {
        if (!milestone.payment_request_stage) return 'N/A';

        return milestone.payment_request_stage
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getAssignedMembers = () => {
        if (!milestone.assigned_to || milestone.assigned_to.length === 0) {
            return 'No members assigned';
        }

        if (Array.isArray(milestone.assigned_to)) {
            return `${milestone.assigned_to.length} member(s) assigned`;
        }

        return 'Members assigned';
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
                            icon={<FiFlag />}
                            style={{ backgroundColor: 'var(--primary-color)' }}
                        />
                        <Badge
                            status="processing"
                            color={getStatusColor(milestone.status)}
                            className="status-badge"
                        />
                    </div>

                    <div className="basic-info">
                        <h2 className="name">
                            {truncateText(milestone.title, 40)}
                        </h2>
                        <div className="badge-container">
                            <div className="badge">
                                <FiDollarSign className="icon" style={{ color: 'var(--primary-color)' }} />
                                <span className="text">{milestone.payment_type === 'conditional' ? 'Conditional' : 'Unconditional'}</span>
                            </div>
                            <div className="badge">
                                <FiCheckCircle className="icon" style={{ color: getStatusColor(milestone.status) }} />
                                <span className="text">{milestone.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="details-container">

                    {milestone.description && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiFileText />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Description</div>
                                <div className="detail-value">{milestone.description}</div>
                            </div>
                        </div>
                    )}

                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiCalendar />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Due Date</div>
                            <div className="detail-value">{formatDate(milestone.due_date)}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiPercent />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Progress</div>
                            <div className="detail-value">
                                {milestone.payment_type === 'unconditional' ? '100%' : `${milestone.progress_percent || 0}%`}
                            </div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiDollarSign />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Payment Amount</div>
                            <div className="detail-value">{formatPaymentTriggerValue()}</div>
                        </div>
                    </div>

                    {milestone.payment_type === 'conditional' && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiClock />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Payment Stage</div>
                                <div className="detail-value">{formatPaymentRequestStage()}</div>
                            </div>
                        </div>
                    )}

                    <div className="detail-item">
                        <div className="detail-icon">
                            <FiUsers />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Assigned To</div>
                            <div className="detail-value">{getAssignedMembers()}</div>
                        </div>
                    </div>

                    {milestone.reschedule_count > 0 && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <FiAlertCircle />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Rescheduled</div>
                                <div className="detail-value">{milestone.reschedule_count} time(s)</div>
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </Modal>
    );
};

export default MilestoneView; 