import React, { useState } from 'react';
import { Form, Input, DatePicker, Select, Button, Space, Switch, Radio, message, Row, Col } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

const HolidayForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const [form] = Form.useForm();
    const [startDate, setStartDate] = useState(initialValues?.start_date ? dayjs(initialValues.start_date) : null);
    const [isHalfDay, setIsHalfDay] = useState(initialValues?.is_half_day || false);

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                holiday_name: '',
                start_date: null,
                end_date: null,
                leave_type: '',
                is_half_day: false,
                half_day_type: 'first_half'
            };
        }

        return {
            ...initialValues,
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
            message.error('Failed to create holiday');
        }
    };

    const disabledEndDate = (current) => {
        if (!current || !startDate) {
            return false;
        }
        return current.isBefore(startDate, 'day');
    };

    const handleStartDateChange = (date) => {
        setStartDate(date);

        const endDate = form.getFieldValue('end_date');
        if (endDate && date && endDate.isBefore(date, 'day')) {
            form.setFieldsValue({ end_date: null });
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

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={prepareInitialValues()}
            className="holiday-form"
        >
            <Form.Item
                name="holiday_name"
                label="Holiday Name"
                rules={[
                    { required: true, message: 'Please enter holiday name' },
                    { min: 3, message: 'Holiday name must be at least 3 characters' },
                    { max: 50, message: 'Holiday name must be less than 50 characters' }
                ]}
            >
                <Input placeholder="Enter holiday name" />
            </Form.Item>

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
                                    if (!value || !getFieldValue('start_date') ||
                                        value.isAfter(getFieldValue('start_date')) ||
                                        value.isSame(getFieldValue('start_date'))) {
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
                        name="is_half_day"
                        label="Half Day"
                        valuePropName="checked"
                    >
                        <Switch onChange={handleHalfDayChange} />
                    </Form.Item>
                </Col>
            </Row>
            
            {isHalfDay && (
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="half_day_type"
                            label="Half Day Type"
                            rules={[
                                { required: isHalfDay, message: 'Please select half day type' }
                            ]}
                        >
                            <Radio.Group>
                                <Radio value="first_half">Morning</Radio>
                                <Radio value="second_half">Afternoon</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                </Row>
            )}

            <Form.Item
                name="leave_type"
                label="Type"
                rules={[{ required: true, message: 'Please select leave type' }]}
            >
                <Select placeholder="Select leave type" className="leave-type-select">
                    <Select.Option value="paid">Paid Leave</Select.Option>
                    <Select.Option value="unpaid">Unpaid Leave</Select.Option>
                </Select>
            </Form.Item>

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
                            {initialValues ? 'Update Holiday' : 'Create Holiday'}
                        </Button>
                    </div>
                </Space>
            </div>
        </Form>
    );
};

export default HolidayForm;