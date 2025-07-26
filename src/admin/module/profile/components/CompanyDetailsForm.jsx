import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Row, Col, Space } from 'antd';
import { RiUpload2Line } from 'react-icons/ri';
import {
    useUpdateCompanyDetailsMutation,
    useCreateCompanyDetailsMutation
} from '../../../../config/api/apiServices';

const CompanyDetailsForm = ({ initialValues, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [logoFile, setLogoFile] = useState(null);
    const [updateCompanyDetails] = useUpdateCompanyDetailsMutation();
    const [createCompanyDetails] = useCreateCompanyDetailsMutation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    const handleSubmit = async (values) => {
        try {
            setIsSubmitting(true);

            // Create FormData
            const formData = new FormData();

            // Add company name first
            if (!values.company_name || values.company_name.trim() === '') {
                message.error('Company name is required');
                setIsSubmitting(false);
                return;
            }

            // Add all form values to FormData
            Object.keys(values).forEach(key => {
                const value = values[key];
                if (value !== undefined && value !== null && value !== '') {
                    // Special handling for company_name
                    if (key === 'company_name') {
                        console.log('Adding company_name:', value);
                        formData.append('company_name', value);
                    } else {
                        formData.append(key, value.trim());
                    }
                }
            });

            // Add logo file if exists
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            // Log FormData contents for debugging
            console.log('Form Values:', values);
            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            const payload = {
                data: formData,
                isFormData: true
            };

            if (initialValues?.id) {
                payload.id = initialValues.id;
            }

            console.log('Sending payload:', payload);

            const mutation = initialValues?.id ? updateCompanyDetails : createCompanyDetails;
            const response = await mutation(payload).unwrap();

            if (response.success) {
                message.success(initialValues?.id ? 'Company details updated successfully' : 'Company details created successfully');
                onSuccess();
            } else {
                throw new Error(response.message || 'Failed to save company details');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            message.error(error?.data?.message || error.message || 'Failed to save company details');
        } finally {
            setIsSubmitting(false);
        }
    };

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }
        setLogoFile(file);
        return false;
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialValues}
        >
            <div className="profile-picture-uploader">
                <Upload
                    name="logo"
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    customRequest={() => { }}
                    style={{ borderRadius: '50%' }}
                >
                    {initialValues?.logo || logoFile ? (
                        <img
                            src={logoFile ? URL.createObjectURL(logoFile) : initialValues.logo}
                            alt="Company Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div>
                            <RiUpload2Line className="anticon" style={{ fontSize: '24px', color: '#1890ff' }} />
                        </div>
                    )}
                </Upload>
                <div className="profile-text">
                    <h4>Company Logo</h4>
                    <div className="upload-hint">Click to upload or change Company Logo</div>
                </div>
            </div>

            <Row gutter={[24, 0]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Form.Item
                        name="company_name"
                        label={<span style={{ color: '#fff' }}>Company Name</span>}
                        rules={[
                            { required: true, message: 'Please enter company name' },
                            { whitespace: false, message: 'Company name cannot be empty' }
                        ]}
                    >
                        <Input
                            placeholder="Enter company name"
                            style={{ backgroundColor: 'transparent', color: '#fff' }}
                        />
                    </Form.Item>
                </Col>

                <Col span={8}>
                    <Form.Item
                        name="registration_number"
                        label="Registration Number"
                    >
                        <Input placeholder="Enter registration number" />
                    </Form.Item>
                </Col>

                <Col span={8}>
                    <Form.Item
                        name="gst_number"
                        label="GST Number"
                    >
                        <Input placeholder="Enter GST number" />
                    </Form.Item>
                </Col>

                <Col span={8}>
                    <Form.Item
                        name="pan_number"
                        label="PAN Number"
                    >
                        <Input placeholder="Enter PAN number" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={[24, 0]} style={{ marginTop: 16 }}>
                <Col span={12}>
                    <Form.Item
                        name="contact_email"
                        label="Email"
                        rules={[{ type: 'email', message: 'Please enter valid email' }]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="contact_phone"
                        label="Phone"
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        name="website"
                        label="Website"
                    >
                        <Input placeholder="Enter website URL" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={[24, 0]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Form.Item
                        name="address_line1"
                        label="Address Line 1"
                    >
                        <Input.TextArea placeholder="Enter address line 1" rows={2} />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        name="address_line2"
                        label="Address Line 2"
                    >
                        <Input.TextArea placeholder="Enter address line 2" rows={2} />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="city"
                        label="City"
                    >
                        <Input placeholder="Enter city" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="state"
                        label="State"
                    >
                        <Input placeholder="Enter state" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="country"
                        label="Country"
                    >
                        <Input placeholder="Enter country" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="pincode"
                        label="Pincode"
                    >
                        <Input placeholder="Enter pincode" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={[24, 0]} style={{ marginTop: 16 }}>
                <Col span={12}>
                    <Form.Item
                        name="bank_name"
                        label="Bank Name"
                    >
                        <Input placeholder="Enter bank name" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="bank_account_number"
                        label="Account Number"
                    >
                        <Input placeholder="Enter account number" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="bank_ifsc"
                        label="IFSC Code"
                    >
                        <Input placeholder="Enter IFSC code" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item className="form-actions">
                <Space>
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                    >
                        Save Changes
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default CompanyDetailsForm;