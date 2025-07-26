import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space, Row, Col } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

const CompanyForm = ({ initialValues, isSubmitting, onSubmit, onCancel, isConversion = false }) => {
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
                name: '',
                email: '',
                phone: '',
                category: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    zipcode: ''
                },
                description: '',
                status: 'active',
                payment_status: 'unpaid'
            };
        }

        // Extract address or initialize with default values
        let address = initialValues.address || {};
        if (typeof address === 'string') {
            try {
                address = JSON.parse(address);
            } catch (e) {
                console.error('Error parsing address:', e);
                address = {};
            }
        }

        return {
            name: initialValues.name || '',
            email: initialValues.email || '',
            phone: initialValues.phone || '',
            category: initialValues.category || '',
            address: {
                street: address.street || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || '',
                zipcode: address.zipcode || ''
            },
            description: initialValues.description || '',
            payment_status: initialValues.payment_status || 'unpaid',
            status: initialValues.status || 'active',
        };
    };

    const handleFinish = (values) => {
        try {
            // Create a regular object for submission
            const formData = {
                name: values.name,
                email: values.email || '',
                phone: values.phone || '',
                category: values.category || '',
                description: values.description || '',
                // Set default values for payment_status and status when adding
                payment_status: isEditing ? values.payment_status : 'unpaid',
                status: isEditing ? values.status : 'active',
            };
            
            // Ensure address is a proper object
            formData.address = values.address || {};
            
            // If this is a conversion, pass the source inquiry ID
            if (isConversion && initialValues?.source_inquiry_id) {
                formData.source_inquiry_id = initialValues.source_inquiry_id;
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
            className="company-form"
        >
            <Form.Item
                name="name"
                label="Company Name"
                rules={[
                    { required: true, message: 'Please enter company name' },
                    { min: 2, message: 'Name must be at least 2 characters' },
                    { max: 100, message: 'Name must be less than 100 characters' }
                ]}
            >
                <Input placeholder="Enter company name" />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { type: 'email', message: 'Please enter a valid email address' }
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="phone"
                        label="Phone"
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="category"
                label="Category"
            >
                <Input placeholder="Enter company category" />
            </Form.Item>

            <Form.Item label="Address">
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name={['address', 'street']}
                            label="Street"
                            noStyle
                        >
                            <Input placeholder="Enter street address" style={{ marginBottom: 16 }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={['address', 'city']}
                            label="City"
                            noStyle
                        >
                            <Input placeholder="City" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={['address', 'state']}
                            label="State"
                            noStyle
                        >
                            <Input placeholder="State" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={['address', 'zipcode']}
                            label="Zipcode"
                            noStyle
                        >
                            <Input placeholder="Zipcode" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Form.Item
                            name={['address', 'country']}
                            label="Country"
                            noStyle
                        >
                            <Input placeholder="Country" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form.Item>

            <Form.Item
                name="description"
                label="Description"
            >
                <TextArea rows={4} placeholder="Enter company description" />
            </Form.Item>

            {/* Only show status and payment_status in edit mode */}
            {isEditing && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="payment_status"
                            label="Payment Status"
                            rules={[{ required: true, message: 'Please select payment status' }]}
                        >
                            <Select placeholder="Select payment status">
                                <Option value="paid">Paid</Option>
                                <Option value="unpaid">Unpaid</Option>
                                <Option value="pending">Pending</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
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
                    </Col>
                </Row>
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
                        {isConversion 
                            ? 'Convert to Company' 
                            : (isEditing ? 'Update Company' : 'Create Company')}
                    </Button>
                </Space>
            </div>
        </Form>
    );
};

export default CompanyForm; 