import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Switch, message, Tooltip, Tag } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import { holidayApi } from '../../../../../config/api/apiServices';

const HolidayList = ({
    holidays,
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete,
    refetchHolidays
}) => {
    const [updateHoliday, { isLoading: isUpdatingLeaveType }] = holidayApi.useUpdateMutation();

    const handleLeaveTypeChange = async (checked, record) => {
        const newLeaveType = checked ? 'paid' : 'unpaid';
        try {
            await updateHoliday({
                id: record.id,
                data: { 
                    leave_type: newLeaveType, 
                    holiday_name: record.holiday_name,
                    is_half_day: record.is_half_day,
                    half_day_type: record.half_day_type
                }
            }).unwrap();
            refetchHolidays();
        } catch (error) {
            message.error(`Failed to update leave type for '${record.holiday_name}': ${error.data?.message || error.message}`);
        }
    };

    const getHalfDayTypeLabel = (type) => {
        switch (type) {
            case 'first_half':
                return 'Morning';
            case 'second_half':
                return 'Afternoon';
            default:
                return '';
        }
    };

    const calculateDuration = (startDate, endDate, isHalfDay) => {
        if (!startDate || !endDate) return 0;

        // If it's a half-day holiday, return 0.5
        if (isHalfDay) return 0.5;

        const start = dayjs(startDate);
        const end = dayjs(endDate);

        // Calculate the difference in days and add 1 to include both start and end dates
        return end.diff(start, 'day') + 1;
    };

    const fields = [
        {
            name: 'holiday_name',
            title: 'Holiday Name',
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
            render: (date) => dayjs(date).format('DD/MM/YYYY')
        },
        {
            name: 'end_date',
            title: 'End Date',
            render: (date) => dayjs(date).format('DD/MM/YYYY')
        },
        {
            name: 'duration',
            title: 'Duration',
            render: (text, record) => {
                const duration = calculateDuration(record.start_date, record.end_date, record.is_half_day);
                return (
                    <div className="duration-container">
                        <div className="duration-text-wrapper">
                            <span className="duration-days">
                                {duration} {duration === 1 || duration === 0.5 ? 'day' : 'days'}
                            </span>
                            {record.is_half_day && (
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                    Half Day - {getHalfDayTypeLabel(record.half_day_type)}
                                </Tag>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            name: 'leave_type',
            title: 'Leave Type',
            render: (leave_type, record) => (
                <Switch
                    checked={leave_type === 'paid'}
                    onChange={(checked) => handleLeaveTypeChange(checked, record)}
                    checkedChildren="Paid"
                    unCheckedChildren="Unpaid"
                    loading={isUpdatingLeaveType}
                />
            )
        }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'holiday',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'holiday',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['start_date', 'end_date']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={holidays.map(holiday => ({ ...holiday, key: holiday.id }))}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'holidays',
                    className: 'holiday-table'
                }}
                searchableColumns={['holiday_name', 'leave_type']}
                dateColumns={['start_date', 'end_date']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="holiday"
            />
        </div>
    );
};

export default HolidayList;