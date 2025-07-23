import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';
import {
    FiUser,
    FiPhone,
    FiMail,
    FiDollarSign,
    FiCalendar,
    FiInfo,
    FiActivity,
    FiFileText,
    FiFilter,
    FiLayers,
    FiTag,
    FiUsers,
    FiAward,
    FiMapPin
} from 'react-icons/fi';
import '../styles/GeneralDetailsTab.scss';

const GeneralDetailsTab = ({
    data,
    type,
    relatedData,
    classifications = {},
    onViewRelated,
    isClient = false
}) => {
    const navigate = useNavigate();

    if (!data) {
        return null;
    }

    const {
        pipelineName = 'Not Assigned',
        stageName = 'Not Assigned',
        sourceName = 'Not Specified',
        categoryName = 'Uncategorized',
        pipeline,
        stage,
        source,
        category
    } = classifications;

    // Use the explicit names if provided, otherwise use the values
    const displayPipelineName = pipelineName || pipeline || 'Not Assigned';
    const displayStageName = stageName || stage || 'Not Assigned';
    const displaySourceName = sourceName || source || 'Not Specified';
    const displayCategoryName = categoryName || category || 'Uncategorized';

    const getValueFieldName = () => {
        switch (type) {
            case 'lead':
                return 'leadValue';
            case 'project':
                return 'projectValue';
            case 'client':
                return 'value';
            default:
                return null;
        }
    };

    const getValueLabel = () => {
        switch (type) {
            case 'lead':
                return 'LEAD VALUE';
            case 'project':
                return 'PROJECT VALUE';
            case 'client':
                return 'CLIENT VALUE';
            default:
                return null;
        }
    };

    const getPriorityLabel = (priority) => {
        if (!priority) return type === 'lead' ? 'Medium Interest' : 'Medium Priority';

        switch (priority.toLowerCase()) {
            case 'high':
                return type === 'lead' ? 'High Interest' : 'High Priority';
            case 'medium':
                return type === 'lead' ? 'Medium Interest' : 'Medium Priority';
            case 'low':
                return type === 'lead' ? 'Low Interest' : 'Low Priority';
            default:
                return type === 'lead' ? 'Medium Interest' : 'Medium Priority';
        }
    };

    const getPriorityColor = (priority) => {
        if (!priority) return 'var(--text-warning)';

        switch (priority.toLowerCase()) {
            case 'high':
                return 'var(--text-error)';
            case 'medium':
                return 'var(--text-warning)';
            case 'low':
                return 'var(--text-success)';
            default:
                return 'var(--text-warning)';
        }
    };

    const getStatusLabel = (status) => {
        if (!status) return 'Active';

        switch (type) {
            case 'lead':
                return status.toLowerCase() === 'open' ? 'Open' : 'Closed';
            case 'project':
                return status.name || status;
            case 'contact':
            case 'client':
                return status.toLowerCase() === 'active' ? 'Active' : 'Inactive';
            default:
                return 'Active';
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'var(--text-info)';

        switch (type) {
            case 'lead':
                return status.toLowerCase() === 'open' ? 'var(--text-success)' : 'var(--text-error)';
            case 'project':
                const statusName = (status.name || status).toLowerCase();
                switch (statusName) {
                    case 'active':
                        return 'var(--text-blue)';
                    case 'completed':
                        return 'var(--text-success)';
                    case 'pending':
                        return 'var(--text-warning)';
                    case 'on hold':
                    case 'on-hold':
                        return 'var(--text-warning)';
                    case 'inactive':
                        return 'var(--text-secondary)';
                    case 'cancelled':
                        return 'var(--text-error)';
                    case 'overdue':
                        return 'var(--text-error)';
                    default:
                        return 'var(--text-info)';
                }
            case 'contact':
            case 'client':
                return status.toLowerCase() === 'active' ? 'var(--text-success)' : 'var(--text-error)';
            default:
                return 'var(--text-info)';
        }
    };

    const getRelatedTitle = () => {
        switch (type) {
            case 'lead':
                return isClient ? 'Client Details' : 'Contact Details';
            case 'project':
                return 'Client Details';
            default:
                return null;
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    const valueFieldName = getValueFieldName();
    const valueLabel = getValueLabel();

    return (
        <div className={`${type}-details general-details`}>
            {relatedData && (
                <>
                    <div className="section-title">
                        <span className="section-icon"><FiUser /></span>
                        {getRelatedTitle()}
                    </div>
                    <div
                        className="section-content contact-section clickable"
                        onClick={onViewRelated}
                    >
                        <div className="contact-info-row">
                            <div className="contact-info-item">
                                <div className="contact-info-icon">
                                    <FiUser />
                                </div>
                                <span>{relatedData.name}</span>
                            </div>
                            <div className="contact-info-item">
                                <div className="contact-info-icon">
                                    <FiPhone />
                                </div>
                                <span>{relatedData.phone}</span>
                            </div>
                            <div className="contact-info-item">
                                <div className="contact-info-icon">
                                    <FiMail />
                                </div>
                                <span>{relatedData.email}</span>
                            </div>
                            {relatedData.address && (
                                <div className="contact-info-item">
                                    <div className="contact-info-icon">
                                        <FiMapPin />
                                    </div>
                                    <span>
                                        {[
                                            relatedData.address?.city,
                                            relatedData.address?.state,
                                            relatedData.address?.country
                                        ].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            )}
                            <div className="contact-arrow">
                                <ArrowRightOutlined />
                            </div>
                        </div>
                    </div>
                    <div className="section-divider"></div>
                </>
            )}

            <div className="section-title">
                <span className="section-icon"><FiInfo /></span>
                {type.charAt(0).toUpperCase() + type.slice(1)} Information
            </div>
            <div className="fancy-cards-container">
                {valueFieldName && (
                    <div className="fancy-card value-card">
                        <div className="fancy-card-icon">
                            <FiDollarSign />
                        </div>
                        <div className="fancy-card-content">
                            <div className="fancy-card-label">{valueLabel}</div>
                            <div className="fancy-card-value inr-value formatted">{data[valueFieldName]?.toLocaleString() || '0'}</div>
                        </div>
                    </div>
                )}
                {(type === 'lead' || type === 'project') && (
                    <div className="fancy-card priority-card">
                        <div className="fancy-card-icon">
                            <FiAward />
                        </div>
                        <div className="fancy-card-content">
                            <div className="fancy-card-label">{type === 'lead' ? 'INTEREST LEVEL' : 'PRIORITY'}</div>
                            <div className="fancy-card-value">
                                <span className="priority-dot" style={{ backgroundColor: getPriorityColor(data.priority) }}></span>
                                {getPriorityLabel(data.priority)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="fancy-card status-card">
                    <div className="fancy-card-icon">
                        <FiActivity />
                    </div>
                    <div className="fancy-card-content">
                        <div className="fancy-card-label">STATUS</div>
                        <div className="fancy-card-value">
                            <span className="status-indicator" style={{ backgroundColor: getStatusColor(data.status) }}></span>
                            {getStatusLabel(data.status)}
                        </div>
                    </div>
                </div>

                <div className="fancy-card date-card">
                    <div className="fancy-card-icon">
                        <FiCalendar />
                    </div>
                    <div className="fancy-card-content">
                        <div className="fancy-card-label">CREATED ON</div>
                        <div className="fancy-card-value">{formatDate(data.createdAt)}</div>
                    </div>
                </div>

                {type === 'project' && (
                    <>
                        <div className="fancy-card date-card">
                            <div className="fancy-card-icon">
                                <FiCalendar />
                            </div>
                            <div className="fancy-card-content">
                                <div className="fancy-card-label">START DATE</div>
                                <div className="fancy-card-value">{formatDate(data.startDate)}</div>
                            </div>
                        </div>
                        <div className="fancy-card date-card">
                            <div className="fancy-card-icon">
                                <FiCalendar />
                            </div>
                            <div className="fancy-card-content">
                                <div className="fancy-card-label">END DATE</div>
                                <div className="fancy-card-value">{formatDate(data.endDate)}</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="section-divider"></div>
            <div className="section-title">
                <span className="section-icon"><FiFilter /></span>
                Classification
            </div>
            <div className="lead-properties-grid">
                <div className="lead-property-item">
                    <div className="property-icon">
                        <FiLayers />
                    </div>
                    <div className="property-content">
                        <div className="property-label">PIPELINE</div>
                        <div className="property-value">{displayPipelineName}</div>
                    </div>
                </div>

                <div className="lead-property-item">
                    <div className="property-icon">
                        <FiActivity />
                    </div>
                    <div className="property-content">
                        <div className="property-label">STAGE</div>
                        <div className="property-value">{displayStageName}</div>
                    </div>
                </div>

                <div className="lead-property-item">
                    <div className="property-icon">
                        <FiTag />
                    </div>
                    <div className="property-content">
                        <div className="property-label">SOURCE</div>
                        <div className="property-value">{displaySourceName}</div>
                    </div>
                </div>

                <div className="lead-property-item">
                    <div className="property-icon">
                        <FiUsers />
                    </div>
                    <div className="property-content">
                        <div className="property-label">CATEGORY</div>
                        <div className="property-value">{displayCategoryName}</div>
                    </div>
                </div>
            </div>

            {data.description && (
                <>
                    <div className="section-divider"></div>
                    <div className="section-title">
                        <span className="section-icon"><FiFileText /></span>
                        Description
                    </div>
                    <div className="section-content description-content">
                        <p>{data.description}</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default GeneralDetailsTab;
