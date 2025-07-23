import React from 'react';
import { Modal, Spin, Avatar, Tabs, Table, Card, Typography, Tooltip } from 'antd';
import { RiShieldUserLine, RiTimeLine, RiFileListLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import {
    moduleCategories,
    permissionTypes,
    getModulesByCategory,
    parsePermissions,
    generatePermissionTableData
} from '../permissions.jsx';
import '../role.scss';

const RoleView = ({ role, isLoading, visible, onClose }) => {

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const getInitials = () => {
        if (!role || !role.role_name) return 'R';

        const nameParts = role.role_name.split(' ');
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return role.role_name[0].toUpperCase();
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
                <RiShieldUserLine /> Role Details
            </div>
        </div>
    );

    const renderPermissions = () => {
        if (!role?.permissions) return 'No permissions defined';

        try {
            const permissions = parsePermissions(role.permissions);

            if (Object.keys(permissions).length === 0) {
                return 'No permissions defined';
            }

            const tabItems = moduleCategories.map(category => {
                // Generate table data for this category
                const tableData = generatePermissionTableData(permissions, category.key);

                // Skip if no data for this category
                if (!tableData) return null;

                // Customize the column render functions for icons
                const customColumns = tableData.columns.map(column => {
                    if (['create', 'read', 'update', 'delete'].includes(column.key)) {
                        return {
                            ...column,
                            render: (value) => value ?
                                <RiCheckLine className="permission-allowed-icon" /> :
                                <RiCloseLine className="permission-denied-icon" />
                        };
                    } else if (column.key === 'module') {
                        return {
                            ...column,
                            render: (text) => <strong>{text}</strong>
                        };
                    }
                    return column;
                });

                return {
                    key: category.key,
                    label: category.name,
                    children: (
                        <Table
                            columns={customColumns}
                            dataSource={tableData.data}
                            pagination={false}
                            variant={false}
                            size="middle"
                            className="permission-table"
                            rowClassName={() => 'permission-table-row'}
                        />
                    )
                };
            }).filter(Boolean); // Remove null items

            return (
                <Tabs defaultActiveKey="crm" className="permission-tabs" items={tabItems} />
            );
        } catch (error) {
            return 'Error parsing permissions';
        }
    };

    return (
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
            {isLoading ? (
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            ) : role ? (
                <div className="modern-view modern-modal-view">
                    <div className="header">
                        <div className="avatar-container">
                            <Avatar
                                size={80}
                                className="avatar"
                            >
                                {getInitials()}
                            </Avatar>
                        </div>

                        <div className="basic-info">
                            <h2 className="name">
                                {role.role_name && role.role_name.length > 30 ? (
                                    <Tooltip title={role.role_name}>
                                        <span className="truncated-text">{role.role_name.substring(0, 30)}...</span>
                                    </Tooltip>
                                ) : (
                                    role.role_name || 'Unnamed Role'
                                )}
                            </h2>
                        </div>
                    </div>

                    <div className="details-container">
                        <div className="detail-item full-width">
                            <div className="detail-icon">
                                <RiFileListLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Permissions</div>
                                <div className="detail-value permission-details-container">
                                    {renderPermissions()}
                                </div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <RiTimeLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Created At</div>
                                <div className="detail-value">{formatDate(role?.createdAt)}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <RiTimeLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Last Updated</div>
                                <div className="detail-value">{formatDate(role?.updatedAt || role?.createdAt)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="error-container">
                    Role not found
                </div>
            )}
        </Modal>
    );
};

export default RoleView;