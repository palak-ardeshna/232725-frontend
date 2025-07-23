import React, { useState } from 'react';
import { Tag, Space } from 'antd';
import { EditOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';

const SettingsList = ({ settings, onEdit, onRowClick, onReset, loading }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12); // Default to 12 months per page

    // Format number to display as integer or with .5 decimal
    const formatNumber = (value) => {
        if (value === undefined || value === null) return 0;

        // Check if the value is a whole number or has .5 decimal
        const numValue = parseFloat(value);
        if (Number.isInteger(numValue)) {
            return numValue;
        } else {
            // Round to 1 decimal place and remove trailing zeros
            const rounded = Math.round(numValue * 10) / 10;
            return rounded;
        }
    };

    const fields = [
        {
            name: 'month',
            title: 'Month',
            className: 'month-column',
            sorter: (a, b) => {
                const monthA = new Date(a.monthKey);
                const monthB = new Date(b.monthKey);
                return monthA - monthB;
            }
        },
        {
            name: 'monthData',
            title: 'Working Days',
            align: 'center',
            render: (monthData) => {
                return <span className="working-days">{formatNumber(monthData?.total_working_days) || 0}</span>;
            }
        },
        {
            name: 'monthData',
            title: 'Full Days',
            align: 'center',
            render: (monthData) => {
                return <Tag color="blue">{formatNumber(monthData?.full_working_days) || 0}</Tag>;
            }
        },
        {
            name: 'monthData',
            title: 'Half Days',
            align: 'center',
            render: (monthData) => {
                return <Tag color="orange">{formatNumber(monthData?.half_working_days) || 0}</Tag>;
            }
        },
        {
            name: 'monthData',
            title: 'Expected Hours',
            align: 'center',
            render: (monthData) => {
                return <span className="expected-hours">{formatNumber(monthData?.total_expected_hours) || 0}</span>;
            }
        },
        {
            name: 'monthData',
            title: 'Holidays',
            align: 'center',
            render: (monthData) => {
                const fullHolidays = monthData?.holidays?.full || 0;
                const halfHolidays = monthData?.holidays?.half || 0;

                return (
                    <Space>
                        {fullHolidays > 0 && <Tag color="blue">{formatNumber(fullHolidays)} Full</Tag>}
                        {halfHolidays > 0 && <Tag color="orange">{formatNumber(halfHolidays)} Half</Tag>}
                        {fullHolidays === 0 && halfHolidays === 0 && <span>-</span>}
                    </Space>
                );
            }
        }
    ];

    // Check if settings have real data (not temp ID)
    const hasRealSettings = settings.length > 0 && settings[0].id !== 'temp';

    // Create action items array
    const actionItems = [];

    // If no real settings exist, add the "Add" action for all rows
    if (!hasRealSettings) {
        actionItems.push({
            key: 'add',
            label: 'Add Settings',
            icon: <PlusOutlined />,
            handler: onEdit,
            module: 'settings',
            permission: 'create'
        });
    } else {
        // If real settings exist, add the "Edit" and "Reset" actions
        actionItems.push({
            key: 'edit',
            label: 'Edit Month Settings',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'settings',
            permission: 'update'
        });

        actionItems.push({
            key: 'reset',
            label: 'Reset Month to Default',
            icon: <ReloadOutlined />,
            handler: onReset,
            module: 'settings',
            permission: 'update',
            danger: true
        });
    }

    const columns = generateColumns(fields);

    // Handle pagination change
    const handlePaginationChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    return (
        <div className="table-list">
            <CommonTable
                data={settings.map(setting => ({ ...setting, key: setting.key || setting.monthKey }))}
                columns={columns}
                isLoading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: settings.length,
                    onChange: handlePaginationChange,
                    pageSizeOptions: ['12', '24', '36', '48', '60', '120', '240'],
                    showSizeChanger: true,
                    showQuickJumper: true,
                }}
                actionItems={actionItems}
                extraProps={{
                    itemName: 'settings',
                    className: 'settings-table'
                }}
                searchableColumns={['month']}
                onRowClick={onRowClick}
                module="settings"
            />
        </div>
    );
};

export default SettingsList; 