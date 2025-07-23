import React from 'react';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';

const FilterCard = ({ filter, onEdit, onDelete }) => {

    const isSystemCreated = filter.created_by === 'SYSTEM';

    const getActionMenu = (filter) => {
        const menuItems = [
            {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Filter',
                onClick: () => onEdit(filter)
            }
        ];

        if (!isSystemCreated) {
            menuItems.push(
                {
                    type: 'divider'
                },
                {
                    key: 'delete',
                    icon: <DeleteOutlined style={{ color: 'var(--text-error)' }} />,
                    label: <span className="text-error">Delete Filter</span>,
                    danger: true,
                    onClick: () => onDelete(filter)
                }
            );
        }

        return { items: menuItems };
    };

    const renderActionButton = () => (
        <Dropdown
            menu={getActionMenu(filter)}
            trigger={['click']}
            placement="bottomRight"
            overlayClassName="filter-actions-dropdown"
        >
            <button className="action-button">
                <MoreOutlined />
            </button>
        </Dropdown>
    );

    const renderTypeLabel = (type) => (
        <span className={`filter-type-tag ${type || 'general'}`}>
            {type?.toUpperCase() || 'GENERAL'}
        </span>
    );

    const filterStats = [
        {
            label: 'Type',
            value: renderTypeLabel(filter.type)
        },
        {
            label: 'Created By',
            value: filter.created_by_display || filter.created_by || 'System'
        },
        {
            label: 'Created',
            value: new Date(filter.createdAt).toLocaleDateString()
        }
    ];

    return (
        <div className="filter-card">
            <div className="filter-card-header">
                <h3 className="filter-card-title">{filter.name}</h3>
                {renderActionButton()}
            </div>
            <div className="filter-card-content">
                {filterStats.map((stat, index) => (
                    <div key={index} className="filter-card-info">
                        <span className="stat-label">{stat.label}</span>
                        <span className="stat-value">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FilterCard; 