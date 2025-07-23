import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Space } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../../../auth/services/authSlice';

const EditProfileForm = ({ initialValues, onCancel, onSubmit, isSubmitting }) => {
    const [form] = Form.useForm();
    const [profilePicture, setProfilePicture] = useState(initialValues?.profilePic || initialValues?.profile_picture || null);
    const [fileChanged, setFileChanged] = useState(false);
    const userRole = useSelector(selectUserRole);

    const handleSubmit = (values) => {
        const profileData = { ...values };

        if (profileData.firstName) {
            profileData.first_name = profileData.firstName;
            delete profileData.firstName;
        }

        if (profileData.lastName) {
            profileData.last_name = profileData.lastName;
            delete profileData.lastName;
        }

        if (fileChanged && profilePicture instanceof File) {
            profileData.profilePic = profilePicture;
        }

        Object.keys(profileData).forEach(key => {
            if (!profileData[key]) {
                delete profileData[key];
            }
        });

        onSubmit(profileData);
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

        if (isImage && isLt2M) {
            setProfilePicture(file);
            setFileChanged(true);
        }
        return false;
    };

    const getInitialValue = (field) => {
        if (!initialValues) return '';
        return initialValues[field] || '';
    };

    const getFirstName = () => getInitialValue('firstName') || getInitialValue('first_name');
    const getLastName = () => getInitialValue('lastName') || getInitialValue('last_name');

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{
                username: getInitialValue('username'),
                email: getInitialValue('email'),
                firstName: getFirstName(),
                lastName: getLastName(),
                phone: getInitialValue('phone'),
                address: getInitialValue('address'),
                city: getInitialValue('city'),
                state: getInitialValue('state'),
                country: getInitialValue('country'),
                zip_code: getInitialValue('zip_code'),
                branch: getInitialValue('branch'),
                department: getInitialValue('department'),
                designation: getInitialValue('designation')
            }}
            onFinish={handleSubmit}
        >
            <div className="profile-picture-uploader">
                <Upload
                    name="profilePic"
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    customRequest={() => { }}
                    style={{ borderRadius: '50%' }}
                >
                    {profilePicture ? (
                        <img
                            src={typeof profilePicture === 'string' ? profilePicture : URL.createObjectURL(profilePicture)}
                            alt="Profile"
                        />
                    ) : (
                        <div>
                            <CameraOutlined className="anticon" />
                        </div>
                    )}
                </Upload>
                <div className="profile-text">
                    <h4>Profile Picture</h4>
                    <div className="upload-hint">Click to upload or change Profile Picture</div>
                </div>
            </div>

            <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter your username' }]}
            >
                <Input placeholder="Username" />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                ]}
            >
                <Input placeholder="Email" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                    name="firstName"
                    label="First Name"
                    style={{ flex: 1 }}
                >
                    <Input placeholder="First Name" />
                </Form.Item>

                <Form.Item
                    name="lastName"
                    label="Last Name"
                    style={{ flex: 1 }}
                >
                    <Input placeholder="Last Name" />
                </Form.Item>
            </div>

            <Form.Item
                name="phone"
                label="Phone"
            >
                <Input placeholder="Phone Number" />
            </Form.Item>

            {(userRole === 'employee' || userRole === 'user') && (
                <>
                    <Form.Item
                        name="address"
                        label="Address"
                    >
                        <Input.TextArea placeholder="Address" rows={2} />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item
                            name="city"
                            label="City"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="City" />
                        </Form.Item>

                        <Form.Item
                            name="state"
                            label="State"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="State" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item
                            name="country"
                            label="Country"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Country" />
                        </Form.Item>

                        <Form.Item
                            name="zip_code"
                            label="ZIP Code"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="ZIP Code" />
                        </Form.Item>
                    </div>
                </>
            )}

            {userRole === 'employee' && (
                <>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item
                            name="branch"
                            label="Branch"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Branch" />
                        </Form.Item>

                        <Form.Item
                            name="department"
                            label="Department"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Department" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="designation"
                        label="Designation"
                    >
                        <Input placeholder="Designation" />
                    </Form.Item>
                </>
            )}

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

export default EditProfileForm; 