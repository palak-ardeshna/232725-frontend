import React from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const { TextArea } = Input;

const InquiryForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const [form] = Form.useForm();

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                inquiryName: '',
                inquiryEmail: '',
                inquiryPhone: '',
                inquiryCategory: '',
                inquiryAddress: '',
                description: ''
            };
        }
        return { ...initialValues };
    };

    const handleFinish = (values) => {
        onSubmit(values);
    };

    // Email validation pattern
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    
    // Phone number validation pattern - supports various formats
    const phonePattern = /^(\+\d{1,3}[- ]?)?\d{10}$/;

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={prepareInitialValues()}
            className="inquiry-form"
        >
            <Form.Item
                name="inquiryName"
                label="Name"
                rules={[{ required: true, message: 'Please enter name' }]}
            >
                <Input placeholder="Enter name" />
            </Form.Item>

            <Form.Item
                name="inquiryEmail"
                label="Email"
                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
                <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
                name="inquiryPhone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
            >
                <Input placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item
                name="inquiryCategory"
                label="Category"
            >
                <Input placeholder="Enter category" />
            </Form.Item>

            <Form.Item
                name="inquiryAddress"
                label="Address"
            >
                <Input placeholder="Enter address" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Description"
            >
                <TextArea rows={4} placeholder="Enter description" />
            </Form.Item>

            {initialValues && (
                <>
                    <Form.Item
                        name="priority"
                        label="Priority"
                    >
                        <Select placeholder="Select priority" allowClear>
                            <Select.Option value="low">Low</Select.Option>
                            <Select.Option value="medium">Medium</Select.Option>
                            <Select.Option value="high">High</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: 'Please select status' }]}
                    >
                        <Select placeholder="Select status">
                            <Select.Option value="open">Open</Select.Option>
                            <Select.Option value="closed">Closed</Select.Option>
                        </Select>
                    </Form.Item>
                </>
            )}

            <div className="form-actions">
                <Space size={16}>
                    <Button onClick={onCancel} className="btn btn-secondary" type="default" disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting} className="btn btn-primary">
                        {initialValues ? 'Update Inquiry' : 'Create Inquiry'}
                    </Button>
                </Space>
            </div>
        </Form>
    );
};

export default InquiryForm;