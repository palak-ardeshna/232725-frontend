import React from 'react';
import { Card, Tag, Row, Col, Spin, Empty, Typography, Tooltip, Badge } from 'antd';
import { ClockCircleOutlined, FieldTimeOutlined, CalendarOutlined } from '@ant-design/icons';
import { RiTimeLine, RiCalendarCheckLine, RiTimerLine, RiCalendarEventLine, RiCalendarTodoLine } from 'react-icons/ri';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const SettingsView = ({ settings, isLoading, selectedMonth, monthSelector }) => {
    if (isLoading) {
        return (
            <div className="settings-view-loading">
                <Spin size="large" />
            </div>
        );
    }

    if (!settings) {
        return <Empty description="No settings found" className="settings-empty" />;
    }

    // Format time values for display
    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return dayjs(timeString, 'HH:mm:ss').format('hh:mm A');
    };

    // Format number to display as integer or with decimal
    const formatNumber = (value) => {
        if (value === undefined || value === null) return 0;
        const numValue = parseFloat(value);
        return Number.isInteger(numValue) ? numValue : Math.round(numValue * 10) / 10;
    };

    // Get policy label with appropriate color
    const getPolicyTag = (policy) => {
        switch (policy) {
            case 'full-day': return <Tag color="blue">Full Day</Tag>;
            case 'half-day': return <Tag color="orange">Half Day</Tag>;
            case 'off': return <Tag color="red">Off</Tag>;
            default: return <Tag>Unknown</Tag>;
        }
    };

    // Get policy color for calendar display
    const getPolicyColor = (policy) => {
        switch (policy) {
            case 'full-day': return 'blue';
            case 'half-day': return 'orange';
            case 'off': return 'red';
            default: return 'default';
        }
    };

    // Get the month data
    const monthData = settings.monthData || {
        working_hours_per_day: 9,
        half_day_hours: 4.5,
        total_working_days: 0,
        full_working_days: 0,
        half_working_days: 0,
        total_expected_hours: 0,
        holidays: { full: 0, half: 0 }
    };

    // Parse saturday policy
    let saturdayPolicy;
    try {
        saturdayPolicy = typeof settings.saturday_policy === 'string'
            ? JSON.parse(settings.saturday_policy || '[]')
            : settings.saturday_policy || [];
    } catch (error) {
        console.error("Error parsing saturday_policy:", error);
        saturdayPolicy = [];
    }

    // Create a mini-calendar representation
    const monthName = selectedMonth ? dayjs(selectedMonth).format('MMMM YYYY') : 'Current Month';
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get current month first day and total days
    const currentDate = selectedMonth ? dayjs(selectedMonth) : dayjs();
    const firstDayOfMonth = currentDate.startOf('month');
    const totalDays = currentDate.daysInMonth();
    const startDay = firstDayOfMonth.day(); // 0 for Sunday, 1 for Monday, etc.

    // Create calendar grid
    const calendarDays = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= totalDays; i++) {
        calendarDays.push(i);
    }

    // Determine which Saturdays are which (1st, 2nd, etc.)
    const saturdayIndices = {};
    let saturdayCount = 0;
    for (let i = 1; i <= totalDays; i++) {
        const day = dayjs(`${currentDate.year()}-${currentDate.month() + 1}-${i}`);
        if (day.day() === 6) { // 6 is Saturday
            saturdayIndices[i] = saturdayCount;
            saturdayCount++;
        }
    }

    // Calculate total holidays
    const totalHolidays = (monthData.holidays?.full || 0) + (monthData.holidays?.half || 0);

    return (
        <div className="settings-view">
            {/* Modern Stats Dashboard */}
            <div className="modern-stats-dashboard">
                <div className="stats-header">
                    <div className="stats-icon">
                        <RiCalendarEventLine />
                    </div>
                    <div className="stats-title">Monthly Stats</div>
                    <div className="month-selector">
                        {monthSelector}
                    </div>
                </div>

                <div className="stats-cards-container">
                    {/* Stat Cards */}
                    <div className="stat-card total-days">
                        <div className="stat-value">{formatNumber(monthData.total_working_days)}</div>
                        <div className="stat-label">Total Days</div>
                    </div>

                    <div className="stat-card full-days">
                        <div className="stat-value">{formatNumber(monthData.full_working_days)}</div>
                        <div className="stat-label">Full Days</div>
                    </div>

                    <div className="stat-card half-days">
                        <div className="stat-value">{formatNumber(monthData.half_working_days)}</div>
                        <div className="stat-label">Half Days</div>
                    </div>

                    <div className="stat-card hours">
                        <div className="stat-value">{formatNumber(monthData.total_expected_hours)}</div>
                        <div className="stat-label">Hours</div>
                    </div>

                    <div className="stat-card holidays">
                        <div className="stat-value">{formatNumber(totalHolidays)}</div>
                        <div className="stat-label">Holidays</div>
                    </div>
                </div>

                <div className="time-info-container">
                    <div className="time-card office-hours">
                        <div className="time-card-header">
                            <RiTimeLine className="time-icon" />
                            <span>Office Hours</span>
                        </div>
                        <div className="time-value">
                            {formatTime(settings.office_start_time)} - {formatTime(settings.office_end_time)}
                        </div>
                        <div className="time-thresholds">
                            <div className="threshold">
                                <span className="threshold-dot late-dot"></span>
                                <span className="threshold-label">Late After:</span>
                                <span className="threshold-time">{formatTime(settings.late_threshold)}</span>
                            </div>
                            <div className="threshold">
                                <span className="threshold-dot early-dot"></span>
                                <span className="threshold-label">Early Before:</span>
                                <span className="threshold-time">{formatTime(settings.early_leave_threshold)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="time-card daily-hours">
                        <div className="time-card-header">
                            <RiTimerLine className="time-icon" />
                            <span>Daily Hours</span>
                        </div>
                        <div className="hours-container">
                            <div className="hour-block full-hour">
                                <div className="hour-value">{formatNumber(monthData.working_hours_per_day)}h</div>
                                <div className="hour-label">Full</div>
                            </div>
                            <div className="hour-block half-hour">
                                <div className="hour-value">{formatNumber(monthData.half_day_hours)}h</div>
                                <div className="hour-label">Half</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Row gutter={[16, 16]} className="settings-view-content">
                {/* Calendar View Card */}
                <Col xs={24}>
                    <Card
                        className="settings-card calendar-card"
                        title={null}
                    >
                        <div className="calendar-container">
                            <div className="calendar-header">
                                <div className="calendar-legend">
                                    <div className="legend-item">
                                        <div className="color-box working-day"></div>
                                        <span>Full Day</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="color-box half-day"></div>
                                        <span>Half Day</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="color-box off-day"></div>
                                        <span>Off Day</span>
                                    </div>
                                </div>
                            </div>

                            <div className="calendar-grid">
                                {/* Calendar header (days of week) */}
                                {daysOfWeek.map((day, index) => (
                                    <div key={`header-${index}`} className={`calendar-day-header ${index === 0 || index === 6 ? 'weekend' : ''}`}>
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar days */}
                                {calendarDays.map((day, index) => {
                                    // Empty cell
                                    if (day === null) {
                                        return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                                    }

                                    // Determine if this day is a Saturday with a policy
                                    const isSaturday = (index % 7) === 6;
                                    let saturdayPolicyValue = null;

                                    if (isSaturday && saturdayIndices[day] !== undefined &&
                                        saturdayPolicy && saturdayPolicy[saturdayIndices[day] % saturdayPolicy.length]) {
                                        saturdayPolicyValue = saturdayPolicy[saturdayIndices[day] % saturdayPolicy.length];
                                    }

                                    // Determine day class
                                    let dayClass = 'calendar-day';
                                    if ((index % 7) === 0) dayClass += ' sunday'; // Sunday
                                    if (isSaturday) dayClass += ' saturday'; // Saturday

                                    // Add policy class if this is a Saturday with a policy
                                    if (saturdayPolicyValue) {
                                        dayClass += ` ${saturdayPolicyValue}`;
                                    }

                                    // Determine text color class based on policy
                                    let textColorClass = '';
                                    if (isSaturday && saturdayPolicyValue) {
                                        if (saturdayPolicyValue === 'full-day') {
                                            textColorClass = 'text-full-day';
                                        } else if (saturdayPolicyValue === 'half-day') {
                                            textColorClass = 'text-half-day';
                                        } else if (saturdayPolicyValue === 'off') {
                                            textColorClass = 'text-off-day';
                                        }
                                    }

                                    return (
                                        <Tooltip
                                            key={`day-${day}`}
                                            title={isSaturday && saturdayPolicyValue ?
                                                `${['First', 'Second', 'Third', 'Fourth', 'Fifth'][saturdayIndices[day]]} Saturday: ${saturdayPolicyValue}` :
                                                null
                                            }
                                        >
                                            <div className={dayClass}>
                                                <span className={textColorClass}>{day}</span>
                                                {isSaturday && saturdayPolicyValue && (
                                                    <div className="day-tooltip">
                                                        {`${saturdayPolicyValue}`}
                                                    </div>
                                                )}
                                            </div>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SettingsView; 