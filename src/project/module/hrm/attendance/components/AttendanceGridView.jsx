import React, { useMemo } from 'react';
import { Table, Spin, Tooltip, Pagination, Progress } from 'antd';
import dayjs from 'dayjs';
import { useGetHolidaysQuery, useGetLeavesQuery, useGetSettingsQuery } from '../../../../../config/api/apiServices';
import CommonTable from '../../../../../components/CommonTable';

const AttendanceGridView = ({
    attendanceRecords = [],
    loading = false,
    employeeMap = {},
    isAdmin = false,
    pagination,
    selectedMonth
}) => {
    const monthYear = dayjs(selectedMonth);

    const { data: holidaysData } = useGetHolidaysQuery({ limit: 100 });
    const { data: leavesData } = useGetLeavesQuery({ limit: 100 });
    const { data: settingsData } = useGetSettingsQuery({ 
        limit: 1 
    }, {
        refetchOnMountOrArgChange: true
    });

    // Removed debug settings data effect

    const holidays = useMemo(() => holidaysData?.data?.items || [], [holidaysData]);
    const leaves = useMemo(() => leavesData?.data?.items || [], [leavesData]);
    const settings = useMemo(() => {
        const settingsItem = settingsData?.data?.items?.[0] || null;
        return settingsItem;
    }, [settingsData]);

    const daysInMonth = useMemo(() => {
        const daysCount = monthYear.daysInMonth();
        const days = [];
        for (let i = 1; i <= daysCount; i++) {
            days.push(dayjs(`${monthYear.format('YYYY-MM')}-${i.toString().padStart(2, '0')}`));
        }
        return days;
    }, [monthYear]);

    const allEmployees = useMemo(() => {
        return Object.entries(employeeMap).map(([id, username]) => ({
            id,
            username
        }));
    }, [employeeMap]);
    const employees = useMemo(() => {
        if (!pagination) return allEmployees;

        const { current = 1, pageSize = 10 } = pagination;
        const startIndex = (current - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return allEmployees.slice(startIndex, endIndex);
    }, [allEmployees, pagination]);

    const employeeAttendance = useMemo(() => {
        if (!employees.length || !daysInMonth.length) {
            return {};
        }

        const attendanceMap = {};

        employees.forEach(emp => {
            attendanceMap[emp.id] = {
                totalHours: 0
            };

            daysInMonth.forEach(day => {
                attendanceMap[emp.id][day.format('YYYY-MM-DD')] = {
                    status: 'absent',
                    check_in: null,
                    check_out: null,
                    working_hours: null
                };
            });
        });

        holidays.forEach(holiday => {
            let startDate = dayjs(holiday.date || holiday.start_date);
            let endDate = holiday.end_date ? dayjs(holiday.end_date) : startDate;

            const daysDiff = endDate.diff(startDate, 'day') + 1;

            for (let i = 0; i < daysDiff; i++) {
                const holidayDate = startDate.add(i, 'day').format('YYYY-MM-DD');

                if (!daysInMonth.some(day => day.format('YYYY-MM-DD') === holidayDate)) {
                    continue;
                }

                employees.forEach(emp => {
                    if (attendanceMap[emp.id] && attendanceMap[emp.id][holidayDate]) {
                        attendanceMap[emp.id][holidayDate].status = 'holiday';
                        attendanceMap[emp.id][holidayDate].holidayName = holiday.name;
                    }
                });
            }
        });

        attendanceRecords.forEach(record => {
            const employeeId = record.employee_id;
            const date = dayjs(record.date).format('YYYY-MM-DD');

            if (attendanceMap[employeeId] && daysInMonth.some(day => day.format('YYYY-MM-DD') === date)) {
                if (record.working_hours) {
                    attendanceMap[employeeId].totalHours += parseFloat(record.working_hours);
                }
                
                if (attendanceMap[employeeId][date].status === 'holiday') {
                    attendanceMap[employeeId][date].check_in = record.check_in;
                    attendanceMap[employeeId][date].check_out = record.check_out;
                    attendanceMap[employeeId][date].working_hours = record.working_hours;
                    attendanceMap[employeeId][date].originalStatus = record.status;
                    attendanceMap[employeeId][date].attendance_type = record.attendance_type;
                } else {
                    attendanceMap[employeeId][date] = {
                        status: record.status,
                        check_in: record.check_in,
                        check_out: record.check_out,
                        working_hours: record.working_hours,
                        attendance_type: record.attendance_type
                    };
                }
            }
        });

        leaves.forEach(leave => {
            if (leave.status !== 'approved') return;

            const employeeId = leave.employee_id;
            if (!attendanceMap[employeeId]) return;

            const startDate = dayjs(leave.start_date);
            const endDate = dayjs(leave.end_date);

            const daysDiff = endDate.diff(startDate, 'day') + 1;

            for (let i = 0; i < daysDiff; i++) {
                const currentDate = startDate.add(i, 'day');
                const dateStr = currentDate.format('YYYY-MM-DD');

                if (attendanceMap[employeeId][dateStr]) {
                    if (attendanceMap[employeeId][dateStr].status === 'holiday') {
                        continue;
                    }

                    if (leave.is_half_day) {
                        attendanceMap[employeeId][dateStr].status = 'half-day';
                        attendanceMap[employeeId][dateStr].halfDayType = leave.half_day_type;
                    } else {
                        attendanceMap[employeeId][dateStr].status = 'leave';
                    }

                    attendanceMap[employeeId][dateStr].leaveType = leave.leave_type || leave.type;
                    attendanceMap[employeeId][dateStr].leaveStatus = leave.status;
                }
            }
        });

        return attendanceMap;
    }, [attendanceRecords, employees, daysInMonth, holidays, leaves]);

    const formatWorkingHours = (hours) => {
        if (!hours && hours !== 0) return 'N/A';

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

        return timeDisplay;
    };

    const columns = useMemo(() => [
        {
            title: 'Employee',
            dataIndex: 'employee',
            key: 'employee',
            fixed: 'left',
            width: 200,
            render: (text, record) => {
                const employeeId = record.key;
                const totalHours = employeeAttendance[employeeId]?.totalHours || 0;
                const percentage = expectedWorkingHours > 0 
                    ? Math.round((totalHours / expectedWorkingHours) * 100) 
                    : 0;
                
                return (
                    <div className="employee-details">
                        <div className="employee-info">
                            <span className="employee-name">{text}</span>
                            <div className="hours-container">
                                <Tooltip title={`${totalHours.toFixed(1)} / ${expectedWorkingHours} hours (${percentage}%)`}>
                                    <div className="hours-display">
                                        <span className="actual-hours" style={{ color: percentage >= 100 ? '#52c41a' : percentage >= 75 ? '#1890ff' : '#faad14' }}>
                                            {totalHours.toFixed(1)}
                                        </span>
                                        <span className="hours-separator">/</span>
                                        <span className="expected-hours">
                                            {expectedWorkingHours}
                                        </span>
                                        <span className="hours-unit">hrs</span>
                                    </div>
                                </Tooltip>
                            </div>
                        </div>
                        <Progress 
                            percent={percentage} 
                            size="small" 
                            showInfo={false}
                            strokeColor={percentage >= 100 ? '#52c41a' : percentage >= 75 ? '#1890ff' : '#faad14'}
                        />
                    </div>
                );
            }
        },
        ...daysInMonth.map(day => ({
            title: () => (
                <div className="date-column">
                    <div className="day-number">{day.format('DD')}</div>
                    <div className="day-name">{day.format('ddd')}</div>
                </div>
            ),
            dataIndex: day.format('YYYY-MM-DD'),
            key: day.format('YYYY-MM-DD'),
            width: 50,
            align: 'center',
            render: (attendance) => {
                if (!attendance) return null;

                let statusColor = '';
                let tooltipContent = '';
                let halfDayStyle = {};

                switch (attendance.status) {
                    case 'present':
                        statusColor = '#52c41a';
                        tooltipContent = `Present\nCheck In: ${attendance.check_in ? dayjs(`2000-01-01T${attendance.check_in}`).format('hh:mm A') : 'N/A'}\nCheck Out: ${attendance.check_out ? dayjs(`2000-01-01T${attendance.check_out}`).format('hh:mm A') : 'N/A'}\nHours: ${attendance.working_hours ? formatWorkingHours(attendance.working_hours) : 'N/A'}`;
                        
                        if (attendance.attendance_type) {
                            let typeText = '';
                            switch (attendance.attendance_type) {
                                case 'on-time':
                                    typeText = 'On Time';
                                    break;
                                case 'late':
                                    typeText = 'Late Arrival';
                                    break;
                                case 'early-leave':
                                    typeText = 'Early Departure';
                                    break;
                                case 'late-and-early-leave':
                                    typeText = 'Late & Early';
                                    break;
                                default:
                                    typeText = attendance.attendance_type;
                            }
                            tooltipContent += `\nAttendance: ${typeText}`;
                        }
                        break;
                    case 'absent':
                        statusColor = '#f5222d';
                        tooltipContent = 'Absent';
                        break;
                    case 'half-day':
                        statusColor = '#faad14';
                        tooltipContent = `Half-day${attendance.leaveType ? ` (${attendance.leaveType})` : ''}\nCheck In: ${attendance.check_in ? dayjs(`2000-01-01T${attendance.check_in}`).format('hh:mm A') : 'N/A'}\nCheck Out: ${attendance.check_out ? dayjs(`2000-01-01T${attendance.check_out}`).format('hh:mm A') : 'N/A'}\nHours: ${attendance.working_hours ? formatWorkingHours(attendance.working_hours) : 'N/A'}`;

                        if (attendance.halfDayType) {
                            let halfDayTypeLabel = attendance.halfDayType === 'first_half' ? 'First Half' : 'Second Half';
                            tooltipContent += `\n${halfDayTypeLabel}`;
                        }
                        break;
                    case 'leave':
                        statusColor = '#1890ff';
                        tooltipContent = `Leave${attendance.leaveType ? ` (${attendance.leaveType})` : ''}`;
                        break;
                    case 'holiday':
                        statusColor = '#722ed1';
                        tooltipContent = `Holiday${attendance.holidayName ? `: ${attendance.holidayName}` : ''}`;

                        if (attendance.originalStatus) {
                            tooltipContent += `\n(${attendance.originalStatus.charAt(0).toUpperCase() + attendance.originalStatus.slice(1)})`;
                            if (attendance.check_in || attendance.check_out) {
                                tooltipContent += `\nCheck In: ${attendance.check_in ? dayjs(`2000-01-01T${attendance.check_in}`).format('hh:mm A') : 'N/A'}\nCheck Out: ${attendance.check_out ? dayjs(`2000-01-01T${attendance.check_out}`).format('hh:mm A') : 'N/A'}`;
                            }
                        }
                        break;
                    default:
                        statusColor = '#d9d9d9';
                        tooltipContent = 'No record';
                }

                return (
                    <Tooltip title={tooltipContent}>
                        <div
                            className="attendance-status-dot"
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: statusColor,
                                margin: '0 auto'
                            }}
                        />
                    </Tooltip>
                );
            }
        }))
    ], [daysInMonth]);

    const tableData = useMemo(() => {
        return employees.map(employee => {
            const rowData = {
                key: employee.id,
                employee: employee?.username,
            };

            daysInMonth.forEach(day => {
                const dateStr = day.format('YYYY-MM-DD');
                rowData[dateStr] = employeeAttendance[employee.id]?.[dateStr] || null;
            });

            return rowData;
        });
    }, [employees, daysInMonth, employeeAttendance]);

    const legendComponent = useMemo(() => (
        <div className="legend">
            <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#52c41a' }}></div>
                <span>Present</span>
            </div>
            <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#f5222d' }}></div>
                <span>Absent</span>
            </div>
            <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#faad14' }}></div>
                <span>Half-day</span>
            </div>
            <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#1890ff' }}></div>
                <span>Leave</span>
            </div>
            <div className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: '#722ed1' }}></div>
                <span>Holiday</span>
            </div>
        </div>
    ), []);

    const customPagination = useMemo(() => {
        if (!pagination) return null;

        return {
            current: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
            total: Object.keys(employeeMap).length,
            onChange: pagination.onChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} employees`,
            pageSizeOptions: ['1', '5', '10', '20', '50'],
        };
    }, [pagination, employeeMap]);

    const expectedWorkingHours = useMemo(() => {
        if (!settings || !settings.expected_working_hours) {
            return 0;
        }
        
        let workingHoursData = settings.expected_working_hours;
        if (typeof workingHoursData === 'string') {
            try {
                workingHoursData = JSON.parse(workingHoursData);
            } catch (error) {
                return 0;
            }
        }
        
        if (!workingHoursData || typeof workingHoursData !== 'object') {
            return 0;
        }
        
        const hours = workingHoursData.total_expected_hours || 0;
        return hours;
    }, [settings]);

    return (
        <div className="attendance-grid-view">
            <div className="grid-header">
                <div className="month-display">
                    <h3>{monthYear.format('MMMM YYYY')}</h3>
                </div>
                {legendComponent}
            </div>

            {loading ? (
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    <div id="attendance-grid-table" className="table-list">
                        <CommonTable
                            columns={columns}
                            data={tableData}
                            pagination={customPagination}
                            scroll={{ x: 'max-content' }}
                            bordered={false}
                            size="middle"
                            loading={loading}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceGridView;