import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const { Option } = Select;

const AdminForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const [form] = Form.useForm();
    const isEditing = initialValues?.id ? true : false;

    // Update form when initialValues change
    useEffect(() => {
        if (initialValues) {
            const preparedValues = prepareInitialValues();
            form.setFieldsValue(preparedValues);
        }
    }, [initialValues, form]);

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                username: '',
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phone: ''
            };
        }

        return {
            username: initialValues.username || '',
            email: initialValues.email || '',
            // Don't include password in edit mode
            ...(isEditing ? {} : { password: '' }),
            firstName: initialValues.firstName || '',
            lastName: initialValues.lastName || '',
            phone: initialValues.phone || '',
        };
    };

    const handleFinish = (values) => {
        try {
            // Create a regular object for submission
            const formData = {
                username: values.username,
                email: values.email || '',
                firstName: values.firstName || '',
                lastName: values.lastName || '',
                phone: values.phone || '',
            };
            
            // Only include password if it's provided (required for new admins)
            if (values.password) {
                formData.password = values.password;
            }
            
            // If editing, pass the ID
            if (isEditing && initialValues?.id) {
                formData.id = initialValues.id;
            }
            
            console.log('Submitting form with data:', formData);
            onSubmit(formData);
        } catch (error) {
            console.error('Error preparing form data:', error);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={prepareInitialValues()}
            className="admin-form"
        >
            <Form.Item
                name="username"
                label="Username"
                rules={[
                    { required: true, message: 'Please enter username' },
                    { min: 3, message: 'Username must be at least 3 characters' },
                    { max: 50, message: 'Username must be less than 50 characters' }
                ]}
            >
                <Input placeholder="Enter username" />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email address' }
                ]}
            >
                <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
                name="password"
                label="Password"
                rules={[
                    { required: !isEditing, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                ]}
            >
                <Input.Password placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"} />
            </Form.Item>

            <Form.Item
                name="firstName"
                label="First Name"
            >
                <Input placeholder="Enter first name" />
            </Form.Item>

            <Form.Item
                name="lastName"
                label="Last Name"
            >
                <Input placeholder="Enter last name" />
            </Form.Item>

            <Form.Item
                name="phone"
                label="Phone"
            >
                <Input placeholder="Enter phone number" />
            </Form.Item>

            {/* Only show status in edit mode */}
            {isEditing && (
                <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: 'Please select status' }]}
                >
                    <Select placeholder="Select status">
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                    </Select>
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
                        {isEditing ? 'Update Admin' : 'Create Admin'}
                    </Button>
                </Space>
            </div>
        </Form>
    );
};

export default AdminForm; 