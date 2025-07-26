import React from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const { TextArea } = Input;

const InquiryForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const [form] = Form.useForm();

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                status: 'new',
                source: 'website'
            };
        }

        return {
            ...initialValues
        };
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
                name="name"
                label="Name"
                rules={[
                    { required: true, message: 'Please enter name' },
                    { min: 3, message: 'Name must be at least 3 characters' },
                    { max: 50, message: 'Name must be less than 50 characters' }
                ]}
            >
                <Input placeholder="Enter name" />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: 'Please enter email' },
                    { 
                        pattern: emailPattern, 
                        message: 'Please enter a valid email address (e.g., example@domain.com)' 
                    }
                ]}
            >
                <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
                name="phone"
                label="Phone"
                rules={[
                    { required: true, message: 'Please enter phone number' },
                    { 
                        pattern: phonePattern, 
                        message: 'Please enter a valid 10-digit phone number (e.g., 98xxxxxxx or +91 98xxxxxxx)' 
                    }
                ]}
            >
                <Input placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item
                name="subject"
                label="Subject"
                rules={[
                    { required: true, message: 'Please enter subject' },
                    { max: 100, message: 'Subject must be less than 100 characters' }
                ]}
            >
                <Input placeholder="Enter subject" />
            </Form.Item>

            <Form.Item
                name="message"
                label="Message"
                rules={[
                    { required: true, message: 'Please enter message' }
                ]}
            >
                <TextArea rows={4} placeholder="Enter message" />
            </Form.Item>

            <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
            >
                <Select placeholder="Select status">
                    <Select.Option value="new">New</Select.Option>
                    <Select.Option value="in_progress">In Progress</Select.Option>
                    <Select.Option value="resolved">Resolved</Select.Option>
                    <Select.Option value="closed">Closed</Select.Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="source"
                label="Source"
            >
                <Select placeholder="Select source">
                    <Select.Option value="website">Website</Select.Option>
                    <Select.Option value="email">Email</Select.Option>
                    <Select.Option value="phone">Phone</Select.Option>
                    <Select.Option value="social">Social Media</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
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
                            {initialValues ? 'Update Inquiry' : 'Create Inquiry'}
                        </Button>
                    </div>
                </Space>
            </div>
        </Form>
    );
};

export default InquiryForm; 