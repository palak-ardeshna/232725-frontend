import React, { useState, useEffect } from 'react';
import { Badge, Empty, Spin, Typography, Tag, message, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { FiEye, FiDollarSign } from 'react-icons/fi';
import dayjs from 'dayjs';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns, generateActionItems } from '../../../../../../../utils/tableUtils.jsx';

const { Text } = Typography;

const MaintenanceList = ({
    maintenanceList = [],
    loading,
    onEdit,
    onDelete,
    onBulkDelete,
    updatingMaintenanceId,
    onView
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'var(--text-warning)';
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

    const fields = [
        {
            name: 'title',
            title: 'Title',
            sorter: true,
            render: (title) => (
                <div className="maintenance-title">
                    <Text strong>{title}</Text>
                </div>
            )
        },
        {
            name: 'cost',
            title: 'Cost',
            sorter: true,
            render: (cost, record) => {
                if (record.is_free || cost === 0 || !cost) {
                    return (
                        <div className="free-maintenance-label">
                            FREE
                        </div>
                    );
                }
                return (
                    <span className="value-amount">₹{parseFloat(cost).toLocaleString()}</span>
                );
            },
            filters: [
                { text: 'Free', value: true },
                { text: 'Paid', value: false }
            ],
            onFilter: (value, record) => record.is_free === value
        },
        {
            name: 'type',
            title: 'Type',
            sorter: true,
            filters: [
                { text: 'Preventive', value: 'Preventive' },
                { text: 'Corrective', value: 'Corrective' },
                { text: 'Other', value: 'Other' }
            ],
            render: (type) => (
                <Text style={{ color: getTypeColor(type), fontWeight: 500 }}>
                    {type}
                </Text>
            ),
            onFilter: (value, record) => record.type === value
        },
        {
            name: 'status',
            title: 'Status',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'Completed', value: 'Completed' }
            ],
            render: (status) => {
                if (!status) return '-';
                return <div className="status-container">
                    <Badge status="processing" color={getStatusColor(status)} />
                    <Text>{status}</Text>
                </div>;
            },
            onFilter: (value, record) => record.status === value
        },
        {
            name: 'schedule_date',
            title: 'Schedule Date',
            sorter: true,
            render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-'
        },
        {
            name: 'performed_on',
            title: 'Performed On',
            sorter: true,
            render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-'
        }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <FiEye size={16} />,
            handler: onView,
            module: 'maintenance',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'maintenance',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'maintenance',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields);
    const getActionItems = generateActionItems(actions);

    if (loading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
                <Text>Loading maintenance records...</Text>
            </div>
        );
    }

    return (
        <div className="maintenance-container">
            <div className="table-list">
                <CommonTable
                    data={maintenanceList.map((record, index) => ({ ...record, key: record.id || index }))}
                    columns={columns}
                    pagination={false}
                    extraProps={{
                        itemName: 'maintenance',
                        className: 'maintenance-table'
                    }}
                    searchableColumns={['title', 'status', 'type']}
                    rowSelection={true}
                    onBulkDelete={onBulkDelete}
                    actionItems={actions}
                    module="maintenance"
                    locale={{
                        emptyText: (
                            <div className="empty-state">
                                <Empty
                                    description="No maintenance records found"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </div>
                        )
                    }}
                    isLoading={loading}
                />
            </div>
        </div>
    );
};

export default MaintenanceList; 