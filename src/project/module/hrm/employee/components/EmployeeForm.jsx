import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import AdvancedForm, { ModalTitle } from '../../../../../components/AdvancedForm';
import { Button, Modal, Form, Input, Select, Space } from 'antd';
import { userApi } from '../../../../../config/api/apiServices';
import { RiContactsLine } from 'react-icons/ri';
import { DeleteOutlined } from '@ant-design/icons';
import DepartmentForm from '../../department/components/DepartmentForm';
import { departmentApi } from '../../../../../config/api/apiServices';
import DesignationForm from '../../designation/components/DesignationForm';
import { designationApi } from '../../../../../config/api/apiServices';
import { Upload, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import CitySearch from '../../../../../components/CitySearch';
import StateSearch from '../../../../../components/StateSearch';
import CountrySearch from '../../../../../components/CountrySearch';
import addressData from '../../../../../utils/Address Data/countries+states+cities.json';

const getValidationSchema = (isEditing) => {
    const baseSchema = {
        username: Yup.string()
            .required('Username is required')
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username cannot exceed 50 characters'),
        email: Yup.string()
            .email('Please enter a valid email'),
        phone: Yup.string().nullable(),
        password: isEditing
            ? Yup.string().min(6, 'Password must be at least 6 characters')
            : Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
        role_id: Yup.string().required('Role is required'),
        department: Yup.string().nullable(),
        designation: Yup.string().nullable(),
        first_name: Yup.string()
            .max(50, 'First name cannot exceed 50 characters'),
        last_name: Yup.string()
            .max(50, 'Last name cannot exceed 50 characters'),
    };

    if (isEditing) {
        baseSchema.is_active = Yup.boolean();
    }

    return Yup.object().shape(baseSchema);
};

const EmployeeForm = ({
    initialValues,
    departments = [],
    designations = [],
    roles = [],
    isLoading = {
        departments: false,
        designations: false
    },
    isSubmitting,
    onSubmit,
    onCancel
}) => {
    const isEditing = !!initialValues;
    const [formValues, setFormValues] = useState(initialValues || {});
    const [isDepartmentModalVisible, setIsDepartmentModalVisible] = useState(false);
    const [departmentFormKey, setDepartmentFormKey] = useState(Date.now());
    const [isDesignationModalVisible, setIsDesignationModalVisible] = useState(false);
    const [designationFormKey, setDesignationFormKey] = useState(Date.now());

    const [deleteDepartmentModalVisible, setDeleteDepartmentModalVisible] = useState(false);
    const [departmentToDeleteId, setDepartmentToDeleteId] = useState(null);
    const [departmentToDeleteName, setDepartmentToDeleteName] = useState(null);

    const [deleteDesignationModalVisible, setDesignationModalVisible] = useState(false);
    const [designationToDeleteId, setDesignationToDeleteId] = useState(null);
    const [designationToDeleteName, setDesignationToDeleteName] = useState(null);

    const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
    const [isCreatingDesignation, setIsCreatingDesignation] = useState(false);

    const { refetch: refetchDepartments, isLoading: isLoadingDepartmentsApi } = departmentApi.useGetAllQuery();
    const [createDepartment] = departmentApi.useCreateMutation();
    const [deleteDepartment] = departmentApi.useDeleteMutation();

    const { refetch: refetchDesignations, isLoading: isLoadingDesignationsApi } = designationApi.useGetAllQuery();
    const [createDesignation] = designationApi.useCreateMutation();
    const [deleteDesignation] = designationApi.useDeleteMutation();
    const [profilePicture, setProfilePicture] = useState(initialValues?.profile_picture || null);
    const [fileChanged, setFileChanged] = useState(false);

    const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
    const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);

    const beforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
        }

        if (isJpgOrPng && isLt2M) {
            setProfilePicture(file);
            setFileChanged(true);
        }
        return false;
    };

    const handleAddDepartment = () => {
        setDepartmentFormKey(Date.now());
        setIsDepartmentModalVisible(true);
        setDepartmentDropdownOpen(false);
    };

    const handleDepartmentSubmit = async (values) => {
        try {
            setIsCreatingDepartment(true);
            const result = await createDepartment(values).unwrap();
            message.success('Department added successfully');

            // Update the department selection with the newly created department
            if (result?.id) {
                setFormValues(prev => ({
                    ...prev,
                    department: result.id
                }));
            } else if (result?.data?.id) {
                setFormValues(prev => ({
                    ...prev,
                    department: result.data.id
                }));
            }

            await refetchDepartments();
            setIsDepartmentModalVisible(false);
        } catch (error) {
            message.error(`Failed to add department: ${error.data?.message || error.message}`);
        } finally {
            setIsCreatingDepartment(false);
        }
    };

    const handleDeleteDepartment = (departmentId, departmentName) => {
        setDepartmentToDeleteId(departmentId);
        setDepartmentToDeleteName(departmentName);
        setDeleteDepartmentModalVisible(true);
    };

    const handleConfirmDeleteDepartment = async () => {
        if (departmentToDeleteId) {
            try {
                await deleteDepartment(departmentToDeleteId).unwrap();
                message.success('Department deleted successfully');
                refetchDepartments();
                setDeleteDepartmentModalVisible(false);
                setDepartmentToDeleteId(null);
                setDepartmentToDeleteName(null);
            } catch (error) {
                console.error("Error deleting department:", departmentToDeleteId, error);
                message.error('Failed to delete department');
                setDeleteDepartmentModalVisible(false);
                setDepartmentToDeleteId(null);
                setDepartmentToDeleteName(null);
            }
        }
    };

    const handleCancelDeleteDepartment = () => {
        setDeleteDepartmentModalVisible(false);
        setDepartmentToDeleteId(null);
        setDepartmentToDeleteName(null);
    };

    const handleAddDesignation = () => {
        setDesignationFormKey(Date.now());
        setIsDesignationModalVisible(true);
        setDesignationDropdownOpen(false);
    };

    const handleDesignationSubmit = async (values) => {
        try {
            setIsCreatingDesignation(true);
            const result = await createDesignation(values).unwrap();
            message.success('Designation added successfully');

            // Update the designation selection with the newly created designation
            if (result?.id) {
                setFormValues(prev => ({
                    ...prev,
                    designation: result.id
                }));
            } else if (result?.data?.id) {
                setFormValues(prev => ({
                    ...prev,
                    designation: result.data.id
                }));
            }

            await refetchDesignations();
            setIsDesignationModalVisible(false);
        } catch (error) {
            message.error(`Failed to add designation: ${error.data?.message || error.message}`);
        } finally {
            setIsCreatingDesignation(false);
        }
    };

    const handleDeleteDesignation = (designationId, designationName) => {
        setDesignationToDeleteId(designationId);
        setDesignationToDeleteName(designationName);
        setDesignationModalVisible(true);
    };

    const handleConfirmDeleteDesignation = async () => {
        if (designationToDeleteId) {
            try {
                await deleteDesignation(designationToDeleteId).unwrap();
                message.success('Designation deleted successfully');
                refetchDesignations();
                setDesignationModalVisible(false);
                setDesignationToDeleteId(null);
                setDesignationToDeleteName(null);
            } catch (error) {
                message.error('Failed to delete designation');
                setDesignationModalVisible(false);
                setDesignationToDeleteId(null);
                setDesignationToDeleteName(null);
            }
        }
    };

    const handleCancelDesignation = () => {
        setDesignationModalVisible(false);
        setDesignationToDeleteId(null);
        setDesignationToDeleteName(null);
    };

    const getFields = () => {
        const commonFields = [];

        if (isEditing) {
            commonFields.push({
                name: 'profilePic',
                label: '',
                type: 'custom',
                span: 24,
                render: () => (
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
                )
            });
        }

        commonFields.push(
            {
                name: 'username',
                label: 'Username',
                type: 'text',
                placeholder: 'Enter username',
                rules: [
                    { required: true, message: 'Please enter username' },
                    { min: 3, message: 'Username must be at least 3 characters' },
                    { max: 50, message: 'Username cannot exceed 50 characters' }
                ],
                span: 12
            },
            {
                name: 'email',
                label: 'Email',
                type: 'text',
                placeholder: 'Enter email',
                span: 12
            },
            {
                name: 'role_id',
                label: 'Role',
                type: 'select',
                placeholder: 'Select role',
                options: roles.map(role => ({
                    label: role.role_name,
                    value: role.id
                })),
                rules: [
                    { required: true, message: 'Please select a role' }
                ],
                span: 12
            }
        );

        if (!isEditing) {
            commonFields.push({
                name: 'password',
                label: 'Password',
                type: 'password',
                placeholder: 'Enter password',
                rules: [
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                ],
                span: 12,
                className: 'custom-password-input'
            });
        }

        const additionalFields = [];

        additionalFields.push(
            {
                name: 'first_name',
                label: 'First Name',
                type: 'text',
                placeholder: 'Enter first name',
                rules: [
                    { max: 50, message: 'First name cannot exceed 50 characters' }
                ],
                span: 12
            },
            {
                name: 'last_name',
                label: 'Last Name',
                type: 'text',
                placeholder: 'Enter last name',
                rules: [
                    { max: 50, message: 'Last name cannot exceed 50 characters' }
                ],
                span: 12
            },
            {
                name: 'phone',
                label: 'Phone',
                type: 'text',
                placeholder: 'Enter phone number',
                span: 12,

            },
            {
                name: 'address',
                label: 'Address',
                type: 'textarea',
                placeholder: 'Enter address',
                rows: 2,
                span: 24
            },
            {
                name: 'city',
                label: 'City',
                type: 'custom',
                span: 8,
                render: () => (
                    <CitySearch
                        value={formValues?.city || ''}
                        onChange={(value) => {
                            setFormValues(prev => ({
                                ...prev,
                                city: value
                            }));
                        }}
                        onCitySelect={(cityData) => {
                            if (cityData) {
                                setFormValues(prev => ({
                                    ...prev,
                                    city: cityData.label,
                                    state: cityData.state || '',
                                    country: cityData.country || ''
                                }));
                            }
                        }}
                        placeholder="Search by city name"
                    />
                )
            },
            {
                name: 'state',
                label: 'State',
                type: 'custom',
                span: 8,
                render: () => (
                    <StateSearch
                        value={formValues?.state || ''}
                        onChange={(value) => {
                            setFormValues(prev => ({
                                ...prev,
                                state: value
                            }));
                        }}
                        onStateSelect={(stateData) => {
                            if (stateData) {
                                setFormValues(prev => ({
                                    ...prev,
                                    state: stateData.label,
                                    country: stateData.country || prev.country
                                }));
                            }
                        }}
                        country={formValues?.country || ''}
                        placeholder="Search by state name"
                    />
                )
            },
            {
                name: 'zip_code',
                label: 'Zip Code',
                type: 'text',
                placeholder: 'Enter zip code',
                span: 8
            },
            {
                name: 'country',
                label: 'Country',
                type: 'custom',
                span: 12,
                render: () => (
                    <CountrySearch
                        value={formValues?.country || ''}
                        onChange={(value) => {
                            setFormValues(prev => ({
                                ...prev,
                                country: value
                            }));
                        }}
                        onCountrySelect={(countryData) => {
                            if (countryData) {
                                setFormValues(prev => ({
                                    ...prev,
                                    country: countryData.label
                                }));

                                const currentState = formValues?.state;
                                if (currentState) {
                                    let stateFound = false;
                                    const countryName = countryData.label;

                                    if (Array.isArray(addressData)) {
                                        const countryData = addressData.find(c => c.name === countryName);
                                        if (countryData && countryData.states) {
                                            stateFound = countryData.states.some(s => s.name === currentState);
                                        }
                                    }

                                    if (!stateFound) {
                                        setFormValues(prev => ({
                                            ...prev,
                                            state: ''
                                        }));
                                    }
                                }
                            }
                        }}
                        placeholder="Search by country name"
                    />
                )
            },
            {
                name: 'department',
                label: 'Department',
                type: 'select',
                placeholder: 'Select department',
                span: 12,
                options: departments.map(department => ({
                    label: department.department,
                    value: department.id,
                    customContent: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{department.department}</span>
                            {department.created_by !== 'SYSTEM' && department.id !== formValues.department && (
                                <DeleteOutlined
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDepartment(department.id, department.department);
                                    }}
                                    style={{ color: '#ff4d4f' }}
                                />
                            )}
                        </div>
                    )
                })),
                loading: isLoading.departments,
                open: departmentDropdownOpen,
                onOpenChange: (open) => setDepartmentDropdownOpen(open),
                popupRender: (menu) => (
                    <div>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddDepartment}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Department
                            </Button>
                        </div>
                    </div>
                ),
                onChange: (value) => {
                    setFormValues(prev => ({
                        ...prev,
                        department: value
                    }));
                }
            },
            {
                name: 'designation',
                label: 'Designation',
                type: 'select',
                placeholder: 'Select designation',
                span: 12,
                options: designations.map(designation => ({
                    label: designation.designation,
                    value: designation.id,
                    customContent: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{designation.designation}</span>
                            {designation.created_by !== 'SYSTEM' && designation.id !== formValues.designation && (
                                <DeleteOutlined
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDesignation(designation.id, designation.designation);
                                    }}
                                    style={{ color: '#ff4d4f' }}
                                />
                            )}
                        </div>
                    )
                })),
                loading: isLoading.designations,
                open: designationDropdownOpen,
                onOpenChange: (open) => setDesignationDropdownOpen(open),
                popupRender: (menu) => (
                    <div>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddDesignation}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Designation
                            </Button>
                        </div>
                    </div>
                ),
                onChange: (value) => {
                    setFormValues(prev => ({
                        ...prev,
                        designation: value
                    }));
                }
            }
        );

        if (isEditing) {
            additionalFields.push({
                name: 'is_active',
                label: 'Status',
                type: 'switch',
                span: 12,
                defaultChecked: initialValues?.is_active !== false,
                initialValue: initialValues?.is_active !== false,
                hidden: !isEditing
            },
                {
                    name: 'isDashboard',
                    label: 'Dashboard Access',
                    type: 'switch',
                    span: 12,
                    defaultChecked: initialValues?.isDashboard !== false,
                    initialValue: initialValues?.isDashboard !== false,
                    help: 'Enable or disable access to the dashboard for this employee'
                });
        }

        return [...commonFields, ...additionalFields];
    };

    const handleSubmit = (values) => {
        const mergedValues = {
            ...values,
            city: formValues.city || values.city,
            state: formValues.state || values.state,
            country: formValues.country || values.country,
        };

        if (isEditing) {
            const formData = new FormData();

            Object.keys(mergedValues).forEach(key => {
                if (key !== 'profilePic' && mergedValues[key] !== undefined) {
                    if (mergedValues[key] !== null && mergedValues[key] !== "" && mergedValues[key] !== "null") {
                        formData.append(key, mergedValues[key]);
                    }
                }
            });

            if (fileChanged && profilePicture instanceof File) {
                formData.append('profilePic', profilePicture);
            }

            if (!mergedValues.password) {
                formData.delete('password');
            }

            onSubmit(formData);
        } else {
            const cleanValues = { ...mergedValues };
            Object.keys(cleanValues).forEach(key => {
                if (cleanValues[key] === null || cleanValues[key] === "" || cleanValues[key] === "null") {
                    delete cleanValues[key];
                }
            });

            onSubmit(cleanValues);
        }
    };

    return (
        <>
            <AdvancedForm
                initialValues={formValues}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                fields={getFields()}
                validationSchema={getValidationSchema(isEditing)}
                submitButtonText={isEditing ? 'Update Employee' : 'Create Employee'}
                resetOnSubmit={true}
            />

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Department" />}
                open={deleteDepartmentModalVisible}
                onCancel={handleCancelDeleteDepartment}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                className="delete-modal"
                centered
                maskClosable={false}
                onOk={handleConfirmDeleteDepartment}
            >
                <p>Are you sure you want to delete department "{departmentToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Designation" />}
                open={deleteDesignationModalVisible}
                onCancel={handleCancelDesignation}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                className="delete-modal"
                centered
                maskClosable={false}
                onOk={handleConfirmDeleteDesignation}
            >
                <p>Are you sure you want to delete designation "{designationToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={RiContactsLine} title="Add New Department" />}
                open={isDepartmentModalVisible}
                onCancel={() => setIsDepartmentModalVisible(false)}
                footer={null}
                width={700}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <DepartmentForm
                    key={departmentFormKey}
                    initialValues={null}
                    isSubmitting={isCreatingDepartment}
                    onSubmit={handleDepartmentSubmit}
                    onCancel={() => setIsDepartmentModalVisible(false)}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={RiContactsLine} title="Add New Designation" />}
                open={isDesignationModalVisible}
                onCancel={() => setIsDesignationModalVisible(false)}
                footer={null}
                width={700}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <DesignationForm
                    key={designationFormKey}
                    initialValues={null}
                    isSubmitting={isCreatingDesignation}
                    onSubmit={handleDesignationSubmit}
                    onCancel={() => setIsDesignationModalVisible(false)}
                />
            </Modal>
        </>
    );
};

export default EmployeeForm; 