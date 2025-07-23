import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, Upload, Row, Col, message, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const CompanyForm = ({ initialValues, isSubmitting, onSubmit, onCancel, isConversion = false }) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const isEditing = initialValues?.id ? true : false;

    console.log('CompanyForm initialValues:', initialValues);

    // Update form when initialValues change (for inquiry conversion)
    useEffect(() => {
        if (initialValues) {
            console.log('Setting form fields with prepared values');
            const preparedValues = prepareInitialValues();
            console.log('Prepared values:', preparedValues);
            form.setFieldsValue(preparedValues);
        }
    }, [initialValues, form]);

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                name: '',
                email: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    zipcode: ''
                },
                payment_status: 'unpaid',
                status: 'inactive',
                extra_details: {
                    description: '',
                    industry: '',
                    company_size: '',
                    company_type: '',
                    founded_year: null,
                    website: '',
                    headquarters: ''
                }
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
        
        // Extract extra_details or initialize with default values
        let extra_details = initialValues.extra_details || {};
        if (typeof extra_details === 'string') {
            try {
                extra_details = JSON.parse(extra_details);
            } catch (e) {
                console.error('Error parsing extra_details:', e);
                extra_details = {};
            }
        }

        console.log('Parsed address:', address);
        console.log('Parsed extra_details:', extra_details);

        return {
            name: initialValues.name || '',
            email: initialValues.email || '',
            phone: initialValues.phone || '',
            address: {
                street: address.street || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || '',
                zipcode: address.zipcode || ''
            },
            payment_status: initialValues.payment_status || 'unpaid',
            status: initialValues.status || 'inactive',
            extra_details: {
                description: extra_details.description || '',
                industry: extra_details.industry || '',
                company_size: extra_details.company_size || '',
                company_type: extra_details.company_type || '',
                founded_year: extra_details.founded_year || null,
                website: extra_details.website || '',
                headquarters: extra_details.headquarters || ''
            }
        };
    };

    const handleFinish = (values) => {
        try {
            console.log('Form submitted with values:', values);
            const formData = new FormData();
            
            // Add basic fields
            formData.append('name', values.name);
            formData.append('email', values.email || '');
            formData.append('phone', values.phone || '');
            formData.append('payment_status', values.payment_status);
            formData.append('status', values.status);
            
            // Process address - ensure it's a valid object before stringifying
            if (values.address) {
                const addressObj = {
                    street: values.address.street || '',
                    city: values.address.city || '',
                    state: values.address.state || '',
                    country: values.address.country || '',
                    zipcode: values.address.zipcode || ''
                };
                formData.append('address', JSON.stringify(addressObj));
            }
            
            // Process extra_details - ensure it's a valid object before stringifying
            if (values.extra_details) {
                const extraDetailsObj = {
                    description: values.extra_details.description || '',
                    industry: values.extra_details.industry || '',
                    company_size: values.extra_details.company_size || '',
                    company_type: values.extra_details.company_type || '',
                    founded_year: values.extra_details.founded_year || null,
                    website: values.extra_details.website || '',
                    headquarters: values.extra_details.headquarters || ''
                };
                formData.append('extra_details', JSON.stringify(extraDetailsObj));
            }
            
            // Process logo upload
            if (values.logo?.fileList?.length > 0) {
                formData.append('logo', values.logo.fileList[0].originFileObj);
            }
            
            // If this is a conversion, pass the source inquiry ID
            if (isConversion && initialValues?.source_inquiry_id) {
                formData.append('source_inquiry_id', initialValues.source_inquiry_id);
            }
            
            // If editing, pass the ID
            if (isEditing && initialValues?.id) {
                formData.append('id', initialValues.id);
            }
            
            console.log('Submitting form with FormData');
            onSubmit(formData);
        } catch (error) {
            console.error('Error preparing form data:', error);
            message.error('Error preparing form data. Please try again.');
        }
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
        }
        return isImage && isLt2M;
    };

    const industryOptions = [
        'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
        'Retail', 'Real Estate', 'Media', 'Transportation', 'Energy',
        'Agriculture', 'Hospitality', 'Entertainment', 'Construction', 'Other'
    ];

    const companySizeOptions = [
        '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
    ];

    const companyTypeOptions = [
        'Public', 'Private', 'Startup', 'Non-profit', 'Government', 'Educational'
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={prepareInitialValues()}
            className="company-form"
        >
            {isConversion && (
                <Alert
                    message="Converting Inquiry to Company"
                    description="You are converting an inquiry to a company. The inquiry will be deleted after the company is created."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            
            {/* Hidden field to store source inquiry ID */}
            {isConversion && initialValues?.source_inquiry_id && (
                <Form.Item name="source_inquiry_id" hidden>
                    <Input />
                </Form.Item>
            )}
            
            <Row gutter={16}>
                <Col span={16}>
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
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="logo"
                        label="Company Logo"
                        valuePropName="file"
                        getValueFromEvent={normFile}
                    >
                        <Upload 
                            name="logo" 
                            listType="picture"
                            beforeUpload={beforeUpload}
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Upload Logo</Button>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>

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

            {/* Extra Details Section - Only show when editing */}
            {isEditing && (
                <>
                    <h3>Additional Information</h3>

                    <Form.Item
                        name={['extra_details', 'description']}
                        label="Description"
                    >
                        <TextArea rows={4} placeholder="Enter company description" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name={['extra_details', 'industry']}
                                label="Industry"
                            >
                                <Select placeholder="Select industry" allowClear>
                                    {industryOptions.map(industry => (
                                        <Option key={industry} value={industry}>{industry}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name={['extra_details', 'company_size']}
                                label="Company Size"
                            >
                                <Select placeholder="Select company size" allowClear>
                                    {companySizeOptions.map(size => (
                                        <Option key={size} value={size}>{size}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name={['extra_details', 'company_type']}
                                label="Company Type"
                            >
                                <Select placeholder="Select company type" allowClear>
                                    {companyTypeOptions.map(type => (
                                        <Option key={type} value={type}>{type}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name={['extra_details', 'founded_year']}
                                label="Founded Year"
                            >
                                <Input type="number" placeholder="Enter founded year" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name={['extra_details', 'website']}
                                label="Website"
                            >
                                <Input placeholder="https://example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name={['extra_details', 'headquarters']}
                                label="Headquarters"
                            >
                                <Input placeholder="Enter headquarters location" />
                            </Form.Item>
                        </Col>
                    </Row>
                </>
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