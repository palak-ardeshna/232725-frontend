import React from 'react';
import { Spin, Modal, Avatar, Badge } from 'antd';
import {
    RiContactsLine, RiMapPinLine, RiPhoneLine, RiMailLine,
    RiBuilding4Line, RiCalendarLine, RiMoneyDollarCircleLine,
    RiTimeLine, RiUser3Line, RiPriceTag3Line, RiInformationLine
} from 'react-icons/ri';

const ProjectView = ({ project, pipelineMap, stageMap, clientMap, sourceMap, categoryMap, statusMap, isLoading, visible, onClose }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const modalTitle = (
        <div className="modal-header">
            <div className="modal-header-title">
                <RiContactsLine /> Project Details
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

    if (!project) {
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
                    Project not found
                </div>
            </Modal>
        );
    }

    const pipelineName = pipelineMap[project.pipeline] || 'N/A';
    const stageName = stageMap[project.stage] || 'N/A';
    const clientName = clientMap[project.client] || 'N/A';
    const sourceName = sourceMap[project.source] || 'N/A';
    const categoryName = categoryMap[project.category] || 'N/A';
    const statusName = statusMap[project.status] || 'N/A';

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return '#f5222d';
            case 'medium':
                return '#faad14';
            case 'low':
                return '#52c41a';
            default:
                return '#1890ff';
        }
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
                            style={{ backgroundColor: getPriorityColor(project.priority) }}
                        >
                            {project.projectTitle?.charAt(0).toUpperCase() || 'P'}
                        </Avatar>
                        <Badge
                            status={project.is_active ? "success" : "error"}
                            className={`status-badge ${project.is_active ? 'active' : 'inactive'}`}
                        />
                    </div>

                    <div className="basic-info">
                        <h2 className="name">
                            {project.projectTitle || 'Untitled Project'}
                        </h2>
                        <div className="badge-container">
                            <div className="badge">
                                <RiPriceTag3Line className="icon" />
                                <span className="text">{statusName}</span>
                            </div>
                            <div className="badge" style={{ color: getPriorityColor(project.priority) }}>
                                <RiInformationLine className="icon" />
                                <span className="text">{project.priority || 'Normal'} Priority</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="details-container">
                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiMoneyDollarCircleLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Project Value</div>
                            <div className="detail-value">₹{parseFloat(project.projectValue || 0).toLocaleString('en-IN')}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiBuilding4Line />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Client</div>
                            <div className="detail-value">{clientName}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiUser3Line />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Pipeline / Stage</div>
                            <div className="detail-value">{pipelineName} / {stageName}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiCalendarLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Start Date</div>
                            <div className="detail-value">{formatDate(project.startDate)}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiCalendarLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">End Date</div>
                            <div className="detail-value">{formatDate(project.endDate)}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiMapPinLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Source</div>
                            <div className="detail-value">{sourceName}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiPriceTag3Line />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Category</div>
                            <div className="detail-value">{categoryName}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiTimeLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Created At</div>
                            <div className="detail-value">{formatDate(project.createdAt)}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiTimeLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Last Updated</div>
                            <div className="detail-value">{formatDate(project.updatedAt || project.createdAt)}</div>
                        </div>
                    </div>

                    {project.description && (
                        <div className="detail-item full-width">
                            <div className="detail-icon">
                                <RiInformationLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Description</div>
                                <div className="detail-value description">{project.description}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ProjectView; 