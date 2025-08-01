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
                companyName: '',
                companyEmail: '',
                companyPhone: '',
                companyCategory: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipcode: '',
                    country: ''
                },
                description: '',
                status: 'active',
                payment_status: 'unpaid',
                covertedAt: null
            };
        }

        return {
            companyName: initialValues.name || '',
            companyEmail: initialValues.email || '',
            companyPhone: initialValues.phone || '',
            companyCategory: initialValues.category || '',
            address: initialValues.address || {
                street: '',
                city: '',
                state: '',
                zipcode: '',
                country: ''
            },
            description: initialValues.description || '',
            status: initialValues.status || 'active',
            payment_status: initialValues.payment_status || 'unpaid'
        };
    };

    const handleFinish = (values) => {
        try {
            // Create a regular object for submission
            const formData = {
                companyName: values.companyName,
                companyEmail: values.companyEmail || '',
                companyPhone: values.companyPhone || '',
                companyCategory: values.companyCategory || '',
                address: values.address || {},
                description: values.description || '',
                payment_status: isEditing ? values.payment_status : 'unpaid',
                status: isEditing ? values.status : 'active'
            };
            
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
                name="companyName"
                label="Company Name"
                rules={[
                    { required: true, message: 'Please enter company name' },
                    { min: 2, message: 'Name must be at least 2 characters' }
                ]}
            >
                <Input placeholder="Enter company name" />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="companyEmail"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email address' }
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="companyPhone"
                        label="Phone"
                        rules={[
                            { required: true, message: 'Please enter phone number' }
                        ]}
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="companyCategory"
                label="Category"
            >
                <Input placeholder="Enter company category" />
            </Form.Item>

            <Form.Item label="Address">
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name={['address', 'street']}
                            noStyle
                        >
                            <Input placeholder="Street address" style={{ marginBottom: 16 }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={['address', 'city']}
                            noStyle
                        >
                            <Input placeholder="City" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={['address', 'state']}
                            noStyle
                        >
                            <Input placeholder="State" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={['address', 'zipcode']}
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