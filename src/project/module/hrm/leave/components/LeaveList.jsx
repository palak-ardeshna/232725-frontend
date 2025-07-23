import React, { useState } from 'react';
import { EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import { Tag, Card, Switch, message, Tooltip } from 'antd';
import ModuleGrid from '../../../../../components/ModuleGrid';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import dayjs from 'dayjs';
import { useUpdateLeaveMutation } from '../../../../../config/api/apiServices';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../../../../auth/services/authSlice';

const LeaveList = ({
    leaves,
    loading,
    onEdit,
    onDelete,
    onBulkDelete,
    pagination,
    employeeMap,
    viewMode,
    isAdmin
}) => {
    const [updateLeave] = useUpdateLeaveMutation();
    const userRole = useSelector(selectUserRole);

    const getHalfDayTypeLabel = (type) => {
        switch (type) {
            case 'first_half':
                return 'First Half';
            case 'second_half':
                return 'Second Half';
            default:
                return '';
        }
    };

    const calculateDuration = (startDate, endDate, isHalfDay) => {
        if (!startDate || !endDate) return 0;

        // If it's a half-day leave, return 0.5
        if (isHalfDay) return 0.5;

        const start = dayjs(startDate);
        const end = dayjs(endDate);

        // Calculate the difference in days
        const diffInDays = end.diff(start, 'day');

        // Add 1 to include both start and end dates in the duration
        // For example: 01/07/2025 to 02/07/2025 = 2 days (not 1)
        // For same date: 01/07/2025 to 01/07/2025 = 1 day
        return diffInDays + 1;
    };

    const handleStatusToggle = async (record, checked) => {
        try {
            const newStatus = checked ? 'approved' : 'rejected';
            await updateLeave({
                id: record.id,
                data: {
                    ...record,
                    status: newStatus
                }
            }).unwrap();
        } catch (error) {
            message.error('Failed to update leave status');
        }
    };

    const getFields = () => {
        const baseFields = [
            {
                name: 'leave_type',
                title: 'Leave Type',
                render: (text) => (
                    <div className="name-container">
                        <Tooltip title={text}>
                            <span className="name">
                                {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                            </span>
                        </Tooltip>
                    </div>
                )
            },
            {
                name: 'start_date',
                title: 'Start Date',
                render: (start_date) => dayjs(start_date).format('DD/MM/YYYY'),
                sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date),
                defaultSortOrder: 'ascend' // Default sort order is ascending
            },
            {
                name: 'end_date',
                title: 'End Date',
                render: (end_date) => dayjs(end_date).format('DD/MM/YYYY')
            },
            {
                name: 'duration',
                title: 'Duration ',
                render: (_, record) => {
                    const duration = calculateDuration(record.start_date, record.end_date, record.is_half_day);
                    return (
                        <span>
                            {duration} {duration === 1 || duration === 0.5 ? 'day' : 'days'}
                            {record.is_half_day && (
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                    Half Day - {getHalfDayTypeLabel(record.half_day_type)}
                                </Tag>
                            )}
                        </span>
                    );
                }
            },
            {
                name: 'status',
                title: 'Status',
                render: (status, record) => {
                    if (isAdmin) {
                        return (
                            <Switch
                                checked={status === 'approved'}
                                onChange={(checked) => handleStatusToggle(record, checked)}
                                checkedChildren="Approved"
                                unCheckedChildren="Rejected"
                            />
                        );
                    }

                    return <div>{status.charAt(0).toUpperCase() + status.slice(1)}</div>;
                },
                filters: [
                    { text: 'Approved', value: 'approved' },
                    { text: 'Rejected', value: 'rejected' },
                    { text: 'Pending', value: 'pending' }
                ],
                onFilter: (value, record) => record.status === value
            },
            {
                name: 'createdAt',
                title: 'Created At',
                render: (createdAt) => dayjs(createdAt).format('DD/MM/YYYY'),
                sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            }
        ];

        if (isAdmin) {
            return [
                {
                    name: 'employee_id',
                    title: 'Employee',
                    render: (employee_id) => {
                        const employeeName = employeeMap[employee_id] || 'Unknown';
                        return (
                            <div className="name-container">
                                <Tooltip title={employeeName}>
                                    <span className="name">
                                        {employeeName.length > 30 ? `${employeeName.substring(0, 30)}...` : employeeName}
                                    </span>
                                </Tooltip>
                            </div>
                        );
                    }
                },
                ...baseFields
            ];
        }

        return baseFields;
    };

    const fields = getFields();

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'leave',
            permission: 'update',
            shouldShow: (record) => {
                // For admin, always show edit button
                if (isAdmin) return true;

                // For non-admin, only show edit button if status is pending
                return record.status === 'pending';
            }
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'leave',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt', 'updatedAt', 'start_date', 'end_date']
    });

    const getSearchableColumns = () => {
        if (isAdmin) {
            return ['employee_id', 'leave_type', 'status'];
        }
        return ['leave_type', 'status'];
    };

    return (
        <div className="table-list">
            <CommonTable
                data={leaves}
                columns={columns}
                isLoading={loading}
                pagination={pagination}
                actionItems={actions}
                extraProps={{
                    itemName: 'leave requests',
                    onChange: (newPagination) => pagination.onChange(newPagination.current, newPagination.pageSize)
                }}
                searchableColumns={getSearchableColumns()}
                dateColumns={['createdAt', 'updatedAt', 'start_date', 'end_date']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="leave"
            />
        </div>
    );
};

export default LeaveList; 