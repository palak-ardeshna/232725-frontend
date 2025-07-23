import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, InputNumber, Switch, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import CommonForm from '../../../../../../../components/CommonForm';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const MaintenanceForm = ({ initialValues, onSubmit, onCancel, isSubmitting }) => {
    const [form] = Form.useForm();
    const [isFree, setIsFree] = useState(initialValues?.is_free || false);

    const processedValues = initialValues ? {
        ...initialValues,
        schedule_date: initialValues.schedule_date ? dayjs(initialValues.schedule_date) : null,
        performed_on: initialValues.performed_on ? dayjs(initialValues.performed_on) : null
    } : null;

    const handleFreeChange = (checked) => {
        setIsFree(checked);
        if (checked) {
            form.setFieldValue('cost', 0);
        }
    };

    // Auto-set is_free when cost is set to 0
    const handleCostChange = (value) => {
        if (value === 0) {
            form.setFieldValue('is_free', true);
            setIsFree(true);
        }
    };

    useEffect(() => {
        setIsFree(initialValues?.is_free || false);
    }, [initialValues]);

    return (
        <CommonForm
            form={form}
            initialValues={processedValues}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            submitButtonText={initialValues?.id ? "Save" : "Add Maintenance"}
            cancelButtonText="Cancel"
            className="maintenance-form"
        >
            <Form.Item name="project_id" hidden>
                <Input />
            </Form.Item>

            <Form.Item
                name="title"
                label={<span className="required-label">Title</span>}
                rules={[{ required: true, message: 'Please enter maintenance title' }]}
            >
                <Input placeholder="Enter maintenance title" />
            </Form.Item>

            <div className="form-row">
                <Form.Item
                    name="type"
                    label={<span className="required-label">Maintenance Type</span>}
                    rules={[{ required: true, message: 'Please select maintenance type' }]}
                    className="form-col"
                >
                    <Select placeholder="Select type">
                        <Option value="Preventive">Preventive</Option>
                        <Option value="Corrective">Corrective</Option>
                        <Option value="Other">Other</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="status"
                    label={<span className="required-label">Status</span>}
                    rules={[{ required: true, message: 'Please select status' }]}
                    className="form-col"
                >
                    <Select placeholder="Select status">
                        <Option value="Pending">Pending</Option>
                        <Option value="Completed">Completed</Option>
                    </Select>
                </Form.Item>
            </div>

            <div className="form-row">
                <Form.Item
                    name="schedule_date"
                    label={<span className="required-label">Schedule Date</span>}
                    rules={[{ required: true, message: 'Please select schedule date' }]}
                    className="form-col"
                >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item
                    name="performed_on"
                    label="Performed On"
                    className="form-col"
                >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
            </div>

            <div className="form-row">
                <Form.Item
                    name="is_free"
                    label={
                        <span>
                            Free Maintenance
                            <Tooltip title="Toggle if this maintenance is provided free of charge">
                                <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                        </span>
                    }
                    valuePropName="checked"
                    className="form-col"
                >
                    <Switch
                        checkedChildren="Free"
                        unCheckedChildren="Paid"
                        onChange={handleFreeChange}
                    />
                </Form.Item>

                <Form.Item
                    name="cost"
                    label={<span className={!isFree ? "required-label" : ""}>Cost</span>}
                    className="form-col"
                    tooltip={isFree ? "Cost is set to 0 for free maintenance" : "Enter the cost for this maintenance"}
                    rules={[
                        {
                            required: !isFree,
                            message: 'Please enter maintenance cost'
                        }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="0.00"
                        min={0}
                        precision={2}
                        addonBefore="₹"
                        formatter={value => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/(,*)/g, '')}
                        disabled={isFree}
                        onChange={handleCostChange}
                    />
                </Form.Item>
            </div>

            <Form.Item
                name="remarks"
                label="Remarks (optional)"
            >
                <TextArea rows={4} placeholder="Enter remarks or additional notes" />
            </Form.Item>
        </CommonForm>
    );
};

export default MaintenanceForm; 