import React, { useState, useEffect, useRef } from 'react';
import { Form, TimePicker, Select, Button, Space, InputNumber, Row, Col, Divider, Spin, DatePicker, Typography, message } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, FieldTimeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AdvancedForm from '../../../../../components/AdvancedForm';
import * as Yup from 'yup';
import './settingsForm.scss';

const { Option } = Select;
const { Text } = Typography;

const SettingsForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const currentMonth = dayjs();
    const [selectedMonth, setSelectedMonth] = useState(initialValues?.currentMonth
        ? dayjs(initialValues.currentMonth, 'YYYY-MM')
        : currentMonth);
    const [calculatedValues, setCalculatedValues] = useState({
        total_working_days: initialValues?.monthData?.total_working_days || 0,
        full_working_days: initialValues?.monthData?.full_working_days || 0,
        half_working_days: initialValues?.monthData?.half_working_days || 0,
        total_expected_hours: initialValues?.monthData?.total_expected_hours || 0,
        holidays: initialValues?.monthData?.holidays || { full: 0, half: 0 }
    });
    const [isCalculating, setIsCalculating] = useState(false);
    const debounceTimerRef = useRef(null);
    const [monthlyData, setMonthlyData] = useState(initialValues?.monthly_settings || {});
    const [formInstance, setFormInstance] = useState(null);

    // Format number to display as integer or with decimal
    const formatNumber = (value) => {
        if (value === undefined || value === null) return 0;

        // Check if the value is a whole number or has decimal
        const numValue = parseFloat(value);
        if (Number.isInteger(numValue)) {
            return numValue;
        } else {
            // Round to 1 decimal place
            return Math.round(numValue * 10) / 10;
        }
    };

    const calculateWorkingHoursPerDay = (startTime, endTime) => {
        if (!startTime || !endTime || !startTime.isValid() || !endTime.isValid()) {
            return 9;
        }
        const startHour = startTime.hour() + (startTime.minute() / 60);
        const endHour = endTime.hour() + (endTime.minute() / 60);
        let workingHours = endHour - startHour;
        return formatNumber(workingHours);
    };

    const calculateWorkingDays = (month) => {
        if (!month || !month.isValid() || !formInstance) return;
        setIsCalculating(true);
        try {
            const year = month.year();
            const monthIndex = month.month();
            const daysInMonth = month.daysInMonth();
            const monthStr = month.format('YYYY-MM');
            let fullWorkingDays = 0;
            let halfWorkingDays = 0;
            let fullDayHolidays = 0;
            let halfDayHolidays = 0;
            const formValues = formInstance.getFieldsValue();
            const saturdayPolicy = formValues.saturday_policy || [];

            for (let day = 1; day <= daysInMonth; day++) {
                const date = dayjs(new Date(year, monthIndex, day));
                const dayOfWeek = date.day();
                if (dayOfWeek !== 0) {
                    if (dayOfWeek === 6) {
                        const weekNumber = Math.floor((day - 1) / 7);
                        const saturdayType = saturdayPolicy[weekNumber] || 'half-day';
                        if (saturdayType === 'full-day') {
                            fullWorkingDays += 1;
                        } else if (saturdayType === 'half-day') {
                            halfWorkingDays += 1;
                        }
                    } else {
                        fullWorkingDays += 1;
                    }
                }
            }

            if (initialValues?.holidays_detail && initialValues.holidays_detail.length > 0) {
                const currentMonthHolidays = initialValues.holidays_detail.filter(holiday => {
                    const holidayMonth = dayjs(holiday.start_date).format('YYYY-MM');
                    return holidayMonth === monthStr;
                });
                fullDayHolidays = currentMonthHolidays.filter(h => h.day_type === 'full').length;
                halfDayHolidays = currentMonthHolidays.filter(h => h.day_type === 'half').length;
                fullWorkingDays -= fullDayHolidays;
                for (let i = 0; i < halfDayHolidays; i++) {
                    if (fullWorkingDays > 0) {
                        fullWorkingDays -= 1;
                        halfWorkingDays += 1;
                    } else if (halfWorkingDays > 0) {
                        halfWorkingDays -= 1;
                    }
                }
            } else if (initialValues?.monthData?.holidays) {
                fullDayHolidays = initialValues.monthData.holidays.full || 0;
                halfDayHolidays = initialValues.monthData.holidays.half || 0;
                fullWorkingDays -= fullDayHolidays;
                for (let i = 0; i < halfDayHolidays; i++) {
                    if (fullWorkingDays > 0) {
                        fullWorkingDays -= 1;
                        halfWorkingDays += 1;
                    } else if (halfWorkingDays > 0) {
                        halfWorkingDays -= 1;
                    }
                }
            }

            fullWorkingDays = Math.max(0, fullWorkingDays);
            halfWorkingDays = Math.max(0, halfWorkingDays);

            // Total working days count (each day counts as 1, regardless of whether it's a full or half day)
            const totalDays = fullWorkingDays + halfWorkingDays;

            const formData = formInstance.getFieldsValue();
            const workingHoursPerDay = formData.working_hours_per_day || 9;
            const halfDayHours = formData.half_day_hours || 4.5;
            const totalExpectedHours = formatNumber((fullWorkingDays * workingHoursPerDay) + (halfWorkingDays * halfDayHours));

            const calculatedData = {
                working_hours_per_day: formatNumber(workingHoursPerDay),
                half_day_hours: formatNumber(halfDayHours),
                total_working_days: totalDays,
                full_working_days: fullWorkingDays,
                half_working_days: halfWorkingDays,
                total_expected_hours: totalExpectedHours,
                holidays: { full: fullDayHolidays, half: halfDayHolidays }
            };

            setCalculatedValues(calculatedData);

            // Store the calculated values for this month using the correct month string
            setMonthlyData(prevData => ({
                ...prevData,
                [monthStr]: calculatedData
            }));
        } catch (error) {
            console.error("Error calculating working days:", error);
        } finally {
            setIsCalculating(false);
        }
    };

    const prepareInitialValues = () => {
        const startTime = initialValues?.office_start_time
            ? dayjs(initialValues.office_start_time, 'HH:mm:ss')
            : dayjs('09:00:00', 'HH:mm:ss');
        const endTime = initialValues?.office_end_time
            ? dayjs(initialValues.office_end_time, 'HH:mm:ss')
            : dayjs('18:00:00', 'HH:mm:ss');
        const workingHoursPerDay = calculateWorkingHoursPerDay(startTime, endTime);
        const month = initialValues?.currentMonth
            ? dayjs(initialValues.currentMonth, 'YYYY-MM')
            : currentMonth;
        const lateThreshold = initialValues?.late_threshold
            ? dayjs(initialValues.late_threshold, 'HH:mm:ss')
            : dayjs('09:15:00', 'HH:mm:ss');
        const earlyLeaveThreshold = initialValues?.early_leave_threshold
            ? dayjs(initialValues.early_leave_threshold, 'HH:mm:ss')
            : dayjs('17:45:00', 'HH:mm:ss');

        if (!initialValues) {
            return {
                office_start_time: startTime,
                office_end_time: endTime,
                saturday_policy: ['half-day', 'half-day', 'half-day', 'full-day', 'off'],
                working_hours_per_day: workingHoursPerDay,
                half_day_hours: formatNumber(workingHoursPerDay / 2),
                current_month: month,
                late_threshold: lateThreshold,
                early_leave_threshold: earlyLeaveThreshold
            };
        }

        const monthData = initialValues.monthData || {
            working_hours_per_day: workingHoursPerDay,
            half_day_hours: formatNumber(workingHoursPerDay / 2),
            total_working_days: 0,
            full_working_days: 0,
            half_working_days: 0,
            total_expected_hours: 0,
            holidays: { full: 0, half: 0 }
        };

        return {
            ...initialValues,
            office_start_time: startTime,
            office_end_time: endTime,
            saturday_policy: initialValues.saturday_policy || ['half-day', 'half-day', 'half-day', 'full-day', 'off'],
            working_hours_per_day: monthData.working_hours_per_day || workingHoursPerDay,
            half_day_hours: monthData.half_day_hours || formatNumber(workingHoursPerDay / 2),
            current_month: month,
            late_threshold: lateThreshold,
            early_leave_threshold: earlyLeaveThreshold
        };
    };

    useEffect(() => {
        const month = initialValues?.currentMonth
            ? dayjs(initialValues.currentMonth, 'YYYY-MM')
            : currentMonth;
        setSelectedMonth(month);

        // Initialize monthly data
        if (initialValues?.monthly_settings) {
            setMonthlyData(initialValues.monthly_settings);
        } else {
            // If no monthly data exists, create an initial entry for the current month
            const monthStr = month.format('YYYY-MM');
            if (initialValues?.monthData) {
                setMonthlyData({
                    [monthStr]: initialValues.monthData
                });
            }
        }

        // Make sure the form's current_month field is set to the selected month
        if (formInstance) {
            formInstance.setFieldsValue({
                current_month: month
            });
        }

        if (initialValues?.monthData) {
            setCalculatedValues({
                total_working_days: initialValues.monthData.total_working_days || 0,
                full_working_days: initialValues.monthData.full_working_days || 0,
                half_working_days: initialValues.monthData.half_working_days || 0,
                total_expected_hours: initialValues.monthData.total_expected_hours || 0,
                holidays: initialValues.monthData.holidays || { full: 0, half: 0 }
            });
        } else if (month && month.isValid() && formInstance) {
            calculateWorkingDays(month);
        }
    }, [formInstance, initialValues]);

    const handleFinish = (values) => {
        try {
            // Get the selected month string in YYYY-MM format
            const monthStr = selectedMonth.format('YYYY-MM');

            // Always use the latest calculated values
            const monthData = {
                working_hours_per_day: formatNumber(values.working_hours_per_day) || 9,
                half_day_hours: formatNumber(values.half_day_hours) || 4.5,
                total_working_days: calculatedValues.total_working_days,
                full_working_days: calculatedValues.full_working_days,
                half_working_days: calculatedValues.half_working_days,
                total_expected_hours: calculatedValues.total_expected_hours,
                holidays: calculatedValues.holidays
            };

            const formattedValues = {
                office_start_time: values.office_start_time.format('HH:mm:ss'),
                office_end_time: values.office_end_time.format('HH:mm:ss'),
                saturday_policy: values.saturday_policy,
                late_threshold: values.late_threshold.format('HH:mm:ss'),
                early_leave_threshold: values.early_leave_threshold.format('HH:mm:ss'),
                monthly_settings: {
                    ...monthlyData,
                    [monthStr]: monthData
                }
            };
            onSubmit(formattedValues);
        } catch (error) {
            console.error("Error submitting form:", error);
            message.error("Failed to save settings. Please check your inputs and try again.");
        }
    };

    const onFormValuesChange = (changedValues, allValues) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Handle time changes
        if (changedValues.office_start_time || changedValues.office_end_time) {
            const startTime = allValues.office_start_time;
            const endTime = allValues.office_end_time;

            if (startTime && endTime && startTime.isValid() && endTime.isValid()) {
                const workingHours = calculateWorkingHoursPerDay(startTime, endTime);
                formInstance.setFieldsValue({
                    working_hours_per_day: workingHours,
                    half_day_hours: formatNumber(workingHours / 2)
                });
            }
        }

        // Handle working hours change
        if (changedValues.working_hours_per_day) {
            const value = changedValues.working_hours_per_day;
            if (value) {
                const halfDayHours = formatNumber(value / 2);
                formInstance.setFieldsValue({
                    half_day_hours: halfDayHours
                });
            }
        }

        // Handle month change
        if (changedValues.current_month) {
            const date = changedValues.current_month;
            setSelectedMonth(date);

            // Check if we already have data for this month
            const monthStr = date.format('YYYY-MM');
            const existingMonthData = monthlyData[monthStr];

            if (existingMonthData &&
                existingMonthData.total_working_days > 0 &&
                existingMonthData.full_working_days > 0) {
                // Only use stored values if they're valid (non-zero)
                setCalculatedValues({
                    total_working_days: existingMonthData.total_working_days || 0,
                    full_working_days: existingMonthData.full_working_days || 0,
                    half_working_days: existingMonthData.half_working_days || 0,
                    total_expected_hours: existingMonthData.total_expected_hours || 0,
                    holidays: existingMonthData.holidays || { full: 0, half: 0 }
                });

                // Update form values
                formInstance.setFieldsValue({
                    working_hours_per_day: existingMonthData.working_hours_per_day || 9,
                    half_day_hours: existingMonthData.half_day_hours || 4.5
                });
            } else {
                // Always calculate for new month or months with zeroed values
                debounceTimerRef.current = setTimeout(() => {
                    calculateWorkingDays(date);
                }, 300);
            }

            return;
        }

        // For all other changes, recalculate working days
        debounceTimerRef.current = setTimeout(() => {
            if (selectedMonth && selectedMonth.isValid()) {
                calculateWorkingDays(selectedMonth);
            }
        }, 300);
    };

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleResetMonth = () => {
        const month = selectedMonth;
        if (!month || !month.isValid() || !formInstance) return;

        const monthStr = month.format('YYYY-MM');
        const workingHoursPerDay = formInstance.getFieldValue('working_hours_per_day') || 9;
        const halfDayHours = formInstance.getFieldValue('half_day_hours') || 4.5;

        // Reset the values for this month to zeros
        const resetData = {
            working_hours_per_day: formatNumber(workingHoursPerDay),
            half_day_hours: formatNumber(halfDayHours),
            total_working_days: 0,
            full_working_days: 0,
            half_working_days: 0,
            total_expected_hours: 0,
            holidays: { full: 0, half: 0 }
        };

        // Update the monthly data with reset values
        setMonthlyData(prevData => ({
            ...prevData,
            [monthStr]: resetData
        }));

        // Update the calculated values display
        setCalculatedValues({
            total_working_days: 0,
            full_working_days: 0,
            half_working_days: 0,
            total_expected_hours: 0,
            holidays: { full: 0, half: 0 }
        });

        message.success(`Settings for ${month.format('MMMM YYYY')} have been reset to default values`);
    };

    const getPolicyDotColor = (policy) => {
        switch (policy) {
            case 'full-day': return '#1890ff';
            case 'half-day': return '#fa8c16';
            case 'off': return '#f5222d';
            default: return '#d9d9d9';
        }
    };

    // Section headers
    const renderSectionHeader = (icon, title) => (
        <div className="section-header">
            {icon} {title}
        </div>
    );

    // Render Office Hours section header
    const renderOfficeHoursHeader = () => renderSectionHeader(<ClockCircleOutlined />, "Office Hours");

    // Render Saturday Policy section header
    const renderSaturdayPolicyHeader = () => renderSectionHeader(<CalendarOutlined />, "Saturday Policy");

    // Render Working Hours section header
    const renderWorkingHoursHeader = () => renderSectionHeader(<FieldTimeOutlined />, "Working Hours");

    // Render Attendance Thresholds section header
    const renderAttendanceThresholdsHeader = () => renderSectionHeader(<ClockCircleOutlined />, "Attendance Thresholds");

    // Render Saturday Policy component
    const renderSaturdayPolicy = () => {
        // Calculate how many Saturdays are in the selected month
        const year = selectedMonth.year();
        const month = selectedMonth.month();
        const daysInMonth = selectedMonth.daysInMonth();

        // Find all Saturdays in the month
        const saturdays = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = dayjs(new Date(year, month, day));
            if (date.day() === 6) { // 6 is Saturday
                saturdays.push({
                    date,
                    day,
                    week: Math.floor((day - 1) / 7) + 1 // 1-indexed week number
                });
            }
        }

        return (
            <div className="saturday-policy-container">
                {renderSaturdayPolicyHeader()}
                <div className="section-description">
                    Set the working policy for Saturdays in each month.
                </div>
                <div className="saturday-policy">
                    {saturdays.map((saturday, index) => (
                        <div className="saturday-row" key={index}>
                            <div className="saturday-label">
                                {['First', 'Second', 'Third', 'Fourth', 'Fifth'][index]} Saturday
                                <span className="saturday-date">({saturday.date.format('MMM D')})</span>
                            </div>
                            <Form.Item
                                name={['saturday_policy', index]}
                                noStyle
                            >
                                <Select
                                    className="policy-select"
                                    dropdownClassName="saturday-dropdown"
                                    style={{ width: '100%' }}
                                    optionLabelProp="label"
                                >
                                    <Option
                                        value="half-day"
                                        label={
                                            <div className="select-label-with-dot">
                                                <span className="dot half-day-dot"></span>
                                                <span>Half Day</span>
                                            </div>
                                        }
                                    >
                                        <div className="select-option-with-dot">
                                            <span className="dot half-day-dot"></span>
                                            <span>Half Day</span>
                                        </div>
                                    </Option>
                                    <Option
                                        value="full-day"
                                        label={
                                            <div className="select-label-with-dot">
                                                <span className="dot full-day-dot"></span>
                                                <span>Full Day</span>
                                            </div>
                                        }
                                    >
                                        <div className="select-option-with-dot">
                                            <span className="dot full-day-dot"></span>
                                            <span>Full Day</span>
                                        </div>
                                    </Option>
                                    <Option
                                        value="off"
                                        label={
                                            <div className="select-label-with-dot">
                                                <span className="dot off-day-dot"></span>
                                                <span>Off</span>
                                            </div>
                                        }
                                    >
                                        <div className="select-option-with-dot">
                                            <span className="dot off-day-dot"></span>
                                            <span>Off</span>
                                        </div>
                                    </Option>
                                </Select>
                            </Form.Item>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render Calculated Values component
    const renderCalculatedValues = () => (
        <div className="calculated-values">
            <div className="calculated-values-header">
                <Text strong>Calculated Values</Text>
                {isCalculating && <Spin size="small" />}
            </div>
            <div className="calculated-values-grid">
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <div className="calculated-values-item">
                            <div className="calculated-values-item-label">Total Working Days</div>
                            <div className="calculated-values-item-value">{calculatedValues.total_working_days}</div>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className="calculated-values-item">
                            <div className="calculated-values-item-label">Full Working Days</div>
                            <div className="calculated-values-item-value">{calculatedValues.full_working_days}</div>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className="calculated-values-item">
                            <div className="calculated-values-item-label">Half Working Days</div>
                            <div className="calculated-values-item-value">{calculatedValues.half_working_days}</div>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className="calculated-values-item">
                            <div className="calculated-values-item-label">Total Expected Hours</div>
                            <div className="calculated-values-item-value">{formatNumber(calculatedValues.total_expected_hours)}</div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );

    const validationSchema = Yup.object().shape({
        office_start_time: Yup.mixed().required('Office start time is required'),
        office_end_time: Yup.mixed().required('Office end time is required'),
        current_month: Yup.mixed().required('Month is required'),
        working_hours_per_day: Yup.number().required('Working hours per day is required').positive('Must be positive'),
        half_day_hours: Yup.number().required('Half day hours is required').positive('Must be positive'),
        late_threshold: Yup.mixed().required('Late threshold is required'),
        early_leave_threshold: Yup.mixed().required('Early leave threshold is required')
    });

    const getFields = () => [
        {
            name: 'office_hours_header',
            type: 'custom',
            render: () => renderOfficeHoursHeader(),
            span: 24
        },
        {
            name: 'office_start_time',
            label: 'Office Start Time',
            type: 'custom',
            rules: [{ required: true, message: 'Please select office start time' }],
            render: () => (
                <TimePicker
                    format="hh:mm A"
                    className="time-picker"
                    minuteStep={5}
                    style={{ width: '100%' }}
                />
            ),
            span: 12
        },
        {
            name: 'office_end_time',
            label: 'Office End Time',
            type: 'custom',
            rules: [{ required: true, message: 'Please select office end time' }],
            render: () => (
                <TimePicker
                    format="hh:mm A"
                    className="time-picker"
                    minuteStep={5}
                    style={{ width: '100%' }}
                />
            ),
            span: 12
        },
        {
            name: 'saturday_policy_section',
            type: 'custom',
            render: () => renderSaturdayPolicy(),
            span: 24
        },
        {
            name: 'working_hours_header',
            type: 'custom',
            render: () => renderWorkingHoursHeader(),
            span: 24
        },
        {
            name: 'current_month',
            label: 'Month',
            type: 'custom',
            rules: [{ required: true, message: 'Please select month' }],
            render: () => (
                <div className="month-field">
                    <DatePicker
                        picker="month"
                        format="MMMM YYYY"
                        allowClear={false}
                        style={{ width: '100%' }}
                        defaultValue={selectedMonth}
                        value={selectedMonth}
                        onChange={(date) => {
                            if (date && date.isValid()) {
                                setSelectedMonth(date);
                                formInstance.setFieldsValue({ current_month: date });
                                setTimeout(() => calculateWorkingDays(date), 100);
                            }
                        }}
                    />
                    <Button
                        type="text"
                        icon={<ReloadOutlined />}
                        onClick={handleResetMonth}
                        size="small"
                        className="reset-month-btn"
                    >
                        Reset Month
                    </Button>
                </div>
            ),
            span: 12
        },
        {
            name: 'working_hours_per_day',
            label: 'Working Hours Per Day',
            type: 'number',
            rules: [
                { required: true, message: 'Please enter working hours per day' },
                {
                    validator(_, value) {
                        if (value && value > 0) {
                            return Promise.resolve();
                        }
                        return Promise.reject(new Error('Working hours must be greater than 0'));
                    },
                },
            ],
            min: 0,
            step: 0.5,
            precision: 1,
            span: 12
        },
        {
            name: 'half_day_hours',
            label: 'Half Day Hours',
            type: 'number',
            rules: [
                { required: true, message: 'Please enter half day hours' },
                {
                    validator(_, value) {
                        if (value && value > 0) {
                            return Promise.resolve();
                        }
                        return Promise.reject(new Error('Half day hours must be greater than 0'));
                    },
                },
            ],
            min: 0,
            step: 0.5,
            precision: 1,
            span: 12
        },
        {
            name: 'calculated_values',
            type: 'custom',
            render: () => renderCalculatedValues(),
            span: 24
        },
        {
            name: 'attendance_thresholds_header',
            type: 'custom',
            render: () => renderAttendanceThresholdsHeader(),
            span: 24
        },
        {
            name: 'late_threshold',
            label: 'Late Threshold',
            type: 'custom',
            rules: [{ required: true, message: 'Please select late threshold time' }],
            render: () => (
                <TimePicker
                    format="hh:mm A"
                    className="time-picker"
                    minuteStep={5}
                    style={{ width: '100%' }}
                />
            ),
            span: 12
        },
        {
            name: 'early_leave_threshold',
            label: 'Early Leave Threshold',
            type: 'custom',
            rules: [{ required: true, message: 'Please select early leave threshold time' }],
            render: () => (
                <TimePicker
                    format="hh:mm A"
                    className="time-picker"
                    minuteStep={5}
                    style={{ width: '100%' }}
                />
            ),
            span: 12
        }
    ];

    const initialFormValues = prepareInitialValues();

    return (
        <div className="settings-form-wrapper">
            <AdvancedForm
                initialValues={initialFormValues}
                isSubmitting={isSubmitting}
                onSubmit={handleFinish}
                onCancel={onCancel}
                fields={getFields()}
                validationSchema={validationSchema}
                className="settings-form"
                formRef={setFormInstance}
                layout="vertical"
                submitButtonText={initialValues ? 'Update' : 'Save'}
            />
        </div>
    );
};

export default SettingsForm; 