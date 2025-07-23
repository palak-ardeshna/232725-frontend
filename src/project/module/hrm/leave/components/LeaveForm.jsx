import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Space, Switch, Radio, message, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../../../../../auth/services/authSlice';

const { Option } = Select;
const { TextArea } = Input;

const leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Personal Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Bereavement Leave',
    'Compensatory Leave',
    'Study Leave',
    'Other'
];

const LeaveForm = ({ initialValues, isSubmitting, onSubmit, onCancel, employees = [], isAdmin, currentEmployeeId }) => {
    const [form] = Form.useForm();
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const [startDate, setStartDate] = useState(initialValues?.start_date ? dayjs(initialValues.start_date) : null);
    const [isHalfDay, setIsHalfDay] = useState(initialValues?.is_half_day || false);

    useEffect(() => {
        if (!initialValues) {
            if (!isAdmin) {
                // If we have a currentEmployeeId, use it directly
                if (currentEmployeeId) {
                    const currentEmployeeInfo = employees.find(emp => emp.id === currentEmployeeId);
                    if (currentEmployeeInfo) {
                        form.setFieldsValue({
                            employee_id: currentEmployeeId,
                            createdBy: getEmployeeName(currentEmployeeInfo)
                        });
                    }
                }
                // Fallback to finding by user properties if needed
                else if (currentUser && currentUser.id) {
                    const currentEmployeeInfo = employees.find(emp =>
                        emp.user_id === currentUser.id ||
                        emp.email === currentUser.email ||
                        emp.username === currentUser.username
                    );

                    form.setFieldsValue({
                        employee_id: currentEmployeeInfo?.id || currentUser.id,
                        createdBy: currentEmployeeInfo ?
                            getEmployeeName(currentEmployeeInfo) :
                            `${currentUser.username || currentUser.firstName || currentUser.email || currentUser.id}`
                    });
                }
            }
        }
    }, [currentUser, form, initialValues, isAdmin, employees, currentEmployeeId]);

    const getEmployeeName = (employee) => {
        if (employee.first_name || employee.last_name) {
            return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        }

        if (employee.firstName || employee.lastName) {
            return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        }

        return employee.username || employee.email || employee.employee_id || 'Unknown Employee';
    };

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                employee_id: isAdmin ? '' : (currentEmployeeId || currentUser?.id || ''),
                leave_type: '',
                status: 'pending',
                is_half_day: false,
                half_day_type: 'first_half',
                start_date: dayjs(),
                end_date: dayjs(),  // Set default end date same as start date
                reason: ''
            };
        }

        return {
            ...initialValues,
            createdBy: initialValues.createdBy || currentUser?.username || currentUser?.firstName || currentUser?.email || currentUser?.id || '',
            start_date: initialValues.start_date ? dayjs(initialValues.start_date) : null,
            end_date: initialValues.end_date ? dayjs(initialValues.end_date) : null,
            is_half_day: initialValues.is_half_day || false,
            half_day_type: initialValues.half_day_type || 'first_half'
        };
    };

    const handleFinish = (values) => {
        try {
            const updatedValues = {
                ...values,
                start_date: values.start_date.format('YYYY-MM-DD'),
                end_date: values.is_half_day
                    ? values.start_date.format('YYYY-MM-DD')
                    : values.end_date.format('YYYY-MM-DD')
            };
            onSubmit(updatedValues);
        } catch (error) {
            message.error('Failed to submit leave request');
        }
    };

    const disabledDate = (current) => {
        return current && current < dayjs().startOf('day');
    };

    const disabledEndDate = (current) => {
        if (!current || !startDate) {
            return false;
        }
        // Changed to allow same date as start date
        return current.isBefore(startDate);
    };

    const handleStartDateChange = (date) => {
        setStartDate(date);

        const endDate = form.getFieldValue('end_date');
        if (endDate && date && endDate.isBefore(date)) {
            // If end date is before new start date, set end date equal to start date
            form.setFieldsValue({ end_date: date });
        }

        if (isHalfDay && date) {
            form.setFieldsValue({ end_date: date });
        }
    };

    const handleHalfDayChange = (checked) => {
        setIsHalfDay(checked);

        if (checked) {
            const startDate = form.getFieldValue('start_date');
            if (startDate) {
                form.setFieldsValue({
                    end_date: startDate,
                    half_day_type: 'first_half'
                });
            }
        }
    };

    const handleEmployeeChange = (employeeId) => {
        const selectedEmployee = employees.find(emp => emp.id === employeeId);
        if (selectedEmployee) {
            form.setFieldsValue({
                createdBy: getEmployeeName(selectedEmployee)
            });
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={prepareInitialValues()}
            className="leave-form"
        >
            {!isAdmin && (
                <Form.Item
                    name="employee_id"
                    hidden
                >
                    <Input type="hidden" />
                </Form.Item>
            )}

            <Row gutter={16}>
                <Col span={12}>
                    {isAdmin ? (
                        <Form.Item
                            name="employee_id"
                            label="Employee"
                            rules={[{ required: true, message: 'Please select an employee' }]}
                        >
                            <Select
                                placeholder="Select employee"
                                onChange={handleEmployeeChange}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {employees.map(employee => (
                                    <Option key={employee.id} value={employee.id}>
                                        {getEmployeeName(employee)}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    ) : (
                        <Form.Item
                            name="createdBy"
                            label="Employee"
                            rules={[{ required: true, message: 'Please enter creator name' }]}
                        >
                            <Input disabled />
                        </Form.Item>
                    )}
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="leave_type"
                        label="Leave Type"
                        rules={[{ required: true, message: 'Please select leave type' }]}
                    >
                        <Select placeholder="Select leave type">
                            {leaveTypes.map(type => (
                                <Option key={type} value={type}>{type}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="is_half_day"
                        label="Half Day Leave"
                        valuePropName="checked"
                    >
                        <Switch
                            onChange={handleHalfDayChange}
                            checkedChildren="Yes"
                            unCheckedChildren="No"
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    {isHalfDay && (
                        <Form.Item
                            name="half_day_type"
                            label="Half Day Type"
                            rules={[{ required: isHalfDay, message: 'Please select half day type' }]}
                        >
                            <Radio.Group>
                                <Radio value="first_half">First Half (Morning)</Radio>
                                <Radio value="second_half">Second Half (Afternoon)</Radio>
                            </Radio.Group>
                        </Form.Item>
                    )}
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="start_date"
                        label="Start Date"
                        rules={[{ required: true, message: 'Please select start date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Select start date"
                            format="DD/MM/YYYY"
                            disabledDate={disabledDate}
                            onChange={handleStartDateChange}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="end_date"
                        label="End Date"
                        rules={[
                            { required: true, message: 'Please select end date' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const startDate = getFieldValue('start_date');

                                    if (!value || !startDate) {
                                        return Promise.resolve();
                                    }

                                    // Fixed condition to properly handle same dates
                                    if (value.isSame(startDate, 'day') || value.isAfter(startDate)) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(new Error('End date must be after or same as start date'));
                                },
                            }),
                        ]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Select end date"
                            format="DD/MM/YYYY"
                            disabledDate={disabledEndDate}
                            disabled={isHalfDay}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        name="reason"
                        label="Reason"
                        rules={[{ required: true, message: 'Please provide reason for leave' }]}
                    >
                        <TextArea rows={4} placeholder="Enter reason for leave" />
                    </Form.Item>
                </Col>
            </Row>

            <div className="form-actions">
                <Space size={16}>
                    <div>
                        <Button
                            onClick={onCancel}
                            className="btn btn-secondary"
                            type="default"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    </div>
                    <div>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSubmitting}
                            className="btn btn-primary"
                        >
                            {initialValues ? 'Update Leave' : 'Create Leave'}
                        </Button>
                    </div>
                </Space>
            </div>
        </Form>
    );
};

export default LeaveForm; 