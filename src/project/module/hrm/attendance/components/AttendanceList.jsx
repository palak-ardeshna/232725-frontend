import React, { useMemo } from 'react';
import { EditOutlined, DeleteOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { Tag, Tooltip, Badge, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../../../../auth/services/authSlice';

const truncateText = (text, maxLength = 25) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;

    return (
        <Tooltip title={text}>
            <span className="truncated-text">{text.substring(0, maxLength)}...</span>
        </Tooltip>
    );
};

const AttendanceList = ({
    attendanceRecords,
    loading,
    onEdit,
    onDelete,
    onBulkDelete,
    pagination,
    employeeMap,
    viewMode,
    isAdmin
}) => {
    const userRole = useSelector(selectUserRole);
    const navigate = useNavigate();

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return dayjs(`2000-01-01T${timeString}`).format('hh:mm A');
    };

    const getStatusDisplay = (status) => {
        let color, dotColor, text;

        switch (status.toLowerCase()) {
            case 'present':
                color = '#52c41a'; // Green
                dotColor = '#52c41a';
                text = 'Present';
                break;
            case 'absent':
                color = '#f5222d'; // Red
                dotColor = '#f5222d';
                text = 'Absent';
                break;
            case 'half-day':
                color = '#faad14'; // Orange
                dotColor = '#faad14';
                text = 'Half-day';
                break;
            case 'leave':
                color = '#1890ff'; // Blue
                dotColor = '#1890ff';
                text = 'Leave';
                break;
            case 'holiday':
                color = '#722ed1'; // Purple
                dotColor = '#722ed1';
                text = 'Holiday';
                break;
            default:
                color = '#d9d9d9'; // Gray
                dotColor = '#d9d9d9';
                text = 'Unknown';
        }

        return (
            <div className="status-display">
                <Badge color={dotColor} text={text} />
            </div>
        );
    };

    const getAttendanceTypeDisplay = (type) => {
        if (!type) return '-';
        
        let color, text;
        
        switch (type) {
            case 'on-time':
                color = '#52c41a'; // Green
                text = 'On Time';
                break;
            case 'late':
                color = '#faad14'; // Orange
                text = 'Late Arrival';
                break;
            case 'early-leave':
                color = '#faad14'; // Orange
                text = 'Early Departure';
                break;
            case 'late-and-early-leave':
                color = '#f5222d'; // Red
                text = 'Late & Early';
                break;
            default:
                color = '#d9d9d9'; // Gray
                text = 'Unknown';
        }
        
        return (
            <Tag color={color} style={{ fontWeight: '500' }}>
                {text}
            </Tag>
        );
    };

    const navigateToAttendanceDetails = (record) => {
        navigate(`/${userRole}/hrm/attendance/details/${record.id}`);
    };

    const getWorkingHoursDisplay = (hours) => {
        if (!hours && hours !== 0) return '-';

        let dotColor = '#d9d9d9';
        if (hours < 4) {
            dotColor = '#f5222d'; // Red
        } else if (hours < 8) {
            dotColor = '#faad14'; // Orange
        } else {
            dotColor = '#52c41a'; // Green
        }

        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);

        let timeDisplay = '';
        if (wholeHours === 0) {
            timeDisplay = `${minutes} minutes`;
        } else if (wholeHours === 1) {
            timeDisplay = minutes > 0 ? `1 hour ${minutes} minutes` : '1 hour';
        } else {
            timeDisplay = minutes > 0 ? `${wholeHours} hours ${minutes} minutes` : `${wholeHours} hours`;
        }

        return (
            <div className="hours-display" style={{ display: 'flex', alignItems: 'center' }}>
                <div
                    style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        border: '1px solid var(--border-color)',
                        marginRight: '6px'
                    }}
                />
                <span style={{ fontWeight: '600' }}>
                    {timeDisplay}
                </span>
            </div>
        );
    };

    const dateDisplay = (date) => {
        if (!date) return '-';
        const dateObj = dayjs(date);
        return (
            <div className="date-display" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: '600' }}>{dateObj.format('DD MMM YYYY')}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{dateObj.format('dddd')}</div>
            </div>
        );
    };

    const timeRangeDisplay = (checkIn, checkOut) => {
        if (!checkIn && !checkOut) return '-';

        const formattedCheckIn = checkIn ? formatTime(checkIn) : '-';
        const formattedCheckOut = checkOut ? formatTime(checkOut) : '-';

        return (
            <div className="time-range-display" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="check-in">
                    <span style={{ fontWeight: '500', marginRight: '4px' }}>In:</span>
                    <span>{formattedCheckIn}</span>
                </div>
                <div className="check-out">
                    <span style={{ fontWeight: '500', marginRight: '4px' }}>Out:</span>
                    <span>{formattedCheckOut}</span>
                </div>
            </div>
        );
    };

    const getFields = useMemo(() => {
        const baseFields = [
            {
                name: 'date',
                title: 'Date',
                render: (date) => dateDisplay(date),
                sorter: (a, b) => new Date(a.date) - new Date(b.date)
            },
            {
                name: 'timeRange',
                title: 'Check In/Out',
                render: (_, record) => timeRangeDisplay(record.check_in, record.check_out)
            },
            {
                name: 'working_hours',
                title: 'Time',
                render: (hours) => getWorkingHoursDisplay(hours),
                sorter: (a, b) => {
                    const hoursA = a.working_hours || 0;
                    const hoursB = b.working_hours || 0;
                    return hoursA - hoursB;
                },
            },
            {
                name: 'attendance_type',
                title: 'Attendance',
                render: (type) => getAttendanceTypeDisplay(type),
                filters: [
                    { text: 'On Time', value: 'on-time' },
                    { text: 'Late Arrival', value: 'late' },
                    { text: 'Early Departure', value: 'early-leave' },
                    { text: 'Late & Early', value: 'late-and-early-leave' }
                ],
                onFilter: (value, record) => record.attendance_type === value
            },
            {
                name: 'status',
                title: 'Status',
                render: (status) => getStatusDisplay(status),
                filters: [
                    { text: 'Present', value: 'present' },
                    { text: 'Absent', value: 'absent' },
                    { text: 'Half-day', value: 'half-day' },
                    { text: 'Leave', value: 'leave' },
                    { text: 'Holiday', value: 'holiday' }
                ],
                onFilter: (value, record) => record.status === value
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
                            <div
                                className="employee-name"
                                style={{ fontWeight: '600', cursor: 'pointer' }}
                            >
                                {truncateText(employeeName, 30)}
                            </div>
                        );
                    },
                    sorter: (a, b) => {
                        const nameA = employeeMap[a.employee_id] || '';
                        const nameB = employeeMap[b.employee_id] || '';
                        return nameA.localeCompare(nameB);
                    }
                },
                ...baseFields
            ];
        }

        return baseFields;
    }, [isAdmin, employeeMap]);

    const actions = isAdmin ? [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'attendance',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'attendance',
            permission: 'delete'
        }
    ] : [];

    const getSearchableColumns = () => {
        if (isAdmin) {
            return ['employee_id', 'status'];
        }
        return ['status'];
    };

    const dateColumns = ['date'];

    const emptyState = {
        image: <CalendarOutlined style={{ fontSize: '48px', color: 'var(--primary-color)' }} />,
        description: isAdmin ? 'No attendance records found' : 'You have no attendance records',
    };

    return (
        <div className="attendance-list-container table-list">
            <CommonTable
                data={attendanceRecords.map(record => ({ ...record, key: record.id }))}
                columns={generateColumns(getFields, {
                    dateFields: dateColumns
                })}
                isLoading={loading}
                pagination={pagination}
                searchableColumns={getSearchableColumns()}
                dateColumns={dateColumns}
                rowSelection={isAdmin}
                onBulkDelete={isAdmin ? onBulkDelete : null}
                actionItems={actions}
                extraProps={{
                    itemName: 'attendance records',
                    rowClassName: 'attendance-row',
                    className: 'attendance-table',
                    emptyText: (
                        <Empty
                            image={emptyState.image}
                            description={emptyState.description}
                        />
                    ),
                }}
                module="attendance"
            />
        </div>
    );
};

export default AttendanceList;