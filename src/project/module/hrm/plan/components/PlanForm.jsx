import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Switch, Row, Col } from 'antd';

const { Option } = Select;

const PlanForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const [form] = Form.useForm();
    const [isLifetime, setIsLifetime] = useState(initialValues?.isLifetime || false);
    const [isTrial, setIsTrial] = useState(initialValues?.isTrial || false);

    // Update form when initialValues change
    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(prepareInitialValues());
            setIsLifetime(initialValues.isLifetime || false);
            setIsTrial(initialValues.isTrial || false);
        }
    }, [initialValues]);

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                planName: '',
                price: 0,
                isLifetime: false,
                duration: 1,
                durationType: 'month',
                isTrial: false,
                trialDays: 0,
                isDefault: false
            };
        }

        return {
            ...initialValues
        };
    };

    const handleFinish = (values) => {
        // If lifetime is selected, ensure duration is 0
        if (values.isLifetime) {
            values.durationType = 'lifetime';
            values.duration = 0;
        }
        
        // If not a trial plan, set trial days to 0
        if (!values.isTrial) {
            values.trialDays = 0;
        }
        
        onSubmit(values);
    };

    const handleLifetimeChange = (checked) => {
        setIsLifetime(checked);
        if (checked) {
            form.setFieldsValue({ durationType: 'lifetime', duration: 0 });
        } else {
            form.setFieldsValue({ durationType: 'month', duration: 1 });
        }
    };

    const handleTrialChange = (checked) => {
        setIsTrial(checked);
        if (!checked) {
            form.setFieldsValue({ trialDays: 0 });
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={prepareInitialValues()}
            className="plan-form"
        >
            <Form.Item
                name="planName"
                label="Plan Name"
                rules={[
                    { required: true, message: 'Please enter plan name' }
                ]}
            >
                <Input placeholder="Enter plan name" />
            </Form.Item>

            <Form.Item
                name="price"
                label="Price (₹)"
                rules={[
                    { required: true, message: 'Please enter price' }
                ]}
            >
                <InputNumber 
                    style={{ width: '100%' }}
                    placeholder="Enter price"
                    min={0}
                />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="isLifetime"
                        label="Lifetime Plan"
                        valuePropName="checked"
                    >
                        <Switch 
                            onChange={handleLifetimeChange}
                        />
                    </Form.Item>
                </Col>
            </Row>

            {!isLifetime && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="duration"
                            label="Duration"
                            rules={[
                                { required: !isLifetime, message: 'Please enter duration' }
                            ]}
                        >
                            <InputNumber 
                                style={{ width: '100%' }}
                                placeholder="Enter duration"
                                min={1}
                                disabled={isLifetime}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="durationType"
                            label="Duration Type"
                            rules={[
                                { required: true, message: 'Please select duration type' }
                            ]}
                        >
                            <Select disabled={isLifetime}>
                                <Option value="day">Day(s)</Option>
                                <Option value="month">Month(s)</Option>
                                <Option value="year">Year(s)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            )}

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="isTrial"
                        label="Trial Plan"
                        valuePropName="checked"
                    >
                        <Switch onChange={handleTrialChange} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="isDefault"
                        label="Default Plan"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Col>
            </Row>

            {isTrial && (
                <Form.Item
                    name="trialDays"
                    label="Trial Days"
                    rules={[
                        { required: isTrial, message: 'Please enter trial days' },
                        { type: 'number', min: 1, message: 'Trial days must be at least 1' }
                    ]}
                >
                    <InputNumber 
                        style={{ width: '100%' }}
                        placeholder="Enter trial days"
                        min={1}
                    />
                </Form.Item>
            )}

            <div className="form-actions">
                <Space size={16}>
                    <Button
                        onClick={onCancel}
                        className="btn btn-secondary"
                        type="default"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        className="btn btn-primary"
                    >
                        {initialValues?.id ? 'Update Plan' : 'Create Plan'}
                    </Button>
                </Space>
            </div>
        </Form>
    );
};

export default PlanForm; 