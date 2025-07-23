import React from 'react';
import { Tabs, Spin, Empty, Button, Space, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import '../styles/ModuleOverview.scss';

const ModuleOverview = ({
    title,
    titleIcon,
    tabItems,
    isLoading,
    error,
    data,
    backPath,
    backText,
    loadingText = 'Loading information...',
    errorText = 'Error loading information',
    emptyText = 'No information available',
    className = '',
    defaultActiveTabKey = 'general',
    truncateTitle = false,
    titleMaxLength = 40,
    headerActions = [],
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(backPath);
    };

    const renderTitle = () => {
        if (!title) return '';

        if (truncateTitle && title.length > titleMaxLength) {
            return (
                <Tooltip title={title}>
                    <span className="truncated-title">{title.substring(0, titleMaxLength)}...</span>
                </Tooltip>
            );
        }

        return title;
    };

    if (isLoading) {
        return (
            <div className={`module-overview-page ${className}`}>
                <div className="module-overview-loading">
                    <Spin size="large" />
                    <p>{loadingText}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`module-overview-page ${className}`}>
                <div className="module-overview-error">
                    <Empty
                        description={errorText}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button type="primary" onClick={handleBack} className="btn btn-primary" style={{ marginTop: 16 }}>
                        <ArrowLeftOutlined /> <span>{backText}</span>
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={`module-overview-page ${className}`}>
                <div className="module-overview-empty">
                    <Empty description={emptyText} />
                    <Button type="primary" onClick={handleBack} className="btn btn-primary" style={{ marginTop: 16 }}>
                        <ArrowLeftOutlined /> <span>{backText}</span>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`module-overview-page ${className}`}>
            <div className="module-overview-header">
                <div className="header-left">
                    <h1 className="module-heading">
                        {titleIcon && <span className="title-icon">{titleIcon}</span>}
                        <span className="title-text">{renderTitle()}</span>
                    </h1>
                </div>
                <div className="header-right">
                    <Space size={10}>
                        {headerActions.map((action, index) => (
                            action.className && action.className.includes('btn-icon') ? (
                                <div
                                    key={index}
                                    onClick={action.onClick}
                                    className={action.className}
                                >
                                    <span className="inner-icon">{action.icon}</span>
                                    {action.label && <span>{action.label}</span>}
                                </div>
                            ) : (
                                <Button
                                    key={index}
                                    onClick={action.onClick}
                                    icon={action.icon}
                                    type={action.type || "default"}
                                    className={action.className || "btn btn-primary"}
                                >
                                    <span className="btn-text">{action.label}</span>
                                </Button>
                            )
                        ))}
                    </Space>
                </div>
            </div>
            <div className="module-overview">
                <Tabs defaultActiveKey={defaultActiveTabKey} items={tabItems} />
            </div>
        </div>
    );
};

ModuleOverview.propTypes = {
    title: PropTypes.string.isRequired,
    titleIcon: PropTypes.node,
    tabItems: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.node.isRequired,
            children: PropTypes.node.isRequired
        })
    ).isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.object,
    data: PropTypes.object,
    backPath: PropTypes.string.isRequired,
    backText: PropTypes.string.isRequired,
    loadingText: PropTypes.string,
    errorText: PropTypes.string,
    emptyText: PropTypes.string,
    className: PropTypes.string,
    defaultActiveTabKey: PropTypes.string,
    truncateTitle: PropTypes.bool,
    titleMaxLength: PropTypes.number,
    headerActions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            onClick: PropTypes.func.isRequired,
            icon: PropTypes.node,
            type: PropTypes.string,
            className: PropTypes.string
        })
    )
};

export default ModuleOverview; 