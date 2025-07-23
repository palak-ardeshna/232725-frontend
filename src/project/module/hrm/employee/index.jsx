import React, { useState, useEffect } from 'react';
import { Modal, Space, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiUser3Line } from 'react-icons/ri';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import EmployeeView from './components/EmployeeView';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import {
    useDeleteEmployeeMutation,
    useGetEmployeesQuery,
    useGetRolesQuery,
    useGetEmployeeQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    designationApi,
    departmentApi
} from '../../../../config/api/apiServices';
import './employee.scss';

const Employee = () => {
    const [viewMode, setViewMode] = useState('list');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [viewModal, setViewModal] = useState({ visible: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: employeesData, isLoading: isLoadingEmployees, isFetching } = useGetEmployeesQuery({
        page: pagination.current,
        limit: pagination.pageSize
    });

    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery();
    const { data: designationsData, isLoading: isLoadingDesignations } = designationApi.useGetAllQuery({
        page: 1,
        limit: 100
    });
    const { data: departmentsData, isLoading: isLoadingDepartments } = departmentApi.useGetAllQuery({
        page: 1,
        limit: 100
    });

    const { data: employeeData, isLoading: isLoadingEmployee } = useGetEmployeeQuery(viewModal.id, {
        skip: !viewModal.id
    });

    const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();
    const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
    const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

    const employees = employeesData?.data?.items || [];
    const roles = rolesData?.data?.items || [];
    const designations = designationsData?.data?.items || [];
    const departments = departmentsData?.data?.items || [];
    const employee = employeeData?.data;
    const total = employeesData?.data?.total || 0;

    const [roleMap, setRoleMap] = useState({});
    const [designationMap, setDesignationMap] = useState({});
    const [departmentMap, setDepartmentMap] = useState({});

    useEffect(() => {
        if (roles && roles.length > 0) {
            const map = {};
            roles.forEach(role => {
                map[role.id] = role.role_name;
            });
            setRoleMap(map);
        }
    }, [roles]);

    useEffect(() => {
        if (designations && designations.length > 0) {
            const map = {};
            designations.forEach(designation => {
                map[designation.id] = designation.designation;
            });
            setDesignationMap(map);
        }
    }, [designations]);

    useEffect(() => {
        if (departments && departments.length > 0) {
            const map = {};
            departments.forEach(department => {
                map[department.id] = department.department;
            });
            setDepartmentMap(map);
        }
    }, [departments]);

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (employee) => setFormModal({ visible: true, data: employee });
    const handleView = (employee) => setViewModal({ visible: true, id: employee.id });
    const handleDelete = (employee) => setDeleteModal({ visible: true, data: employee });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleViewCancel = () => setViewModal({ visible: false, id: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handlePageChange = (page, pageSize) => {
        setPagination({
            current: page,
            pageSize: pageSize
        });
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                if (values instanceof FormData) {
                    values.append('id', formModal.data.id);

                    await updateEmployee({
                        id: formModal.data.id,
                        data: values,
                        isFormData: true
                    }).unwrap();
                } else {
                    const updatedValues = { ...values };

                    if (updatedValues.username === formModal.data.username) {
                        delete updatedValues.username;
                    }

                    if (updatedValues.email === formModal.data.email) {
                        delete updatedValues.email;
                    }

                    if (!updatedValues.password || updatedValues.password.trim() === '') {
                        delete updatedValues.password;
                    }

                    await updateEmployee({
                        id: formModal.data.id,
                        data: updatedValues
                    }).unwrap();
                }
                message.success('Employee updated successfully');
            } else {
                if (values instanceof FormData) {
                    await createEmployee({
                        data: values,
                        isFormData: true
                    }).unwrap();
                } else {
                    await createEmployee(values).unwrap();
                }
                message.success('Employee created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            if (error.data) {
                const errorMessage = error.data.message?.replace('⚠️ ', '');
                message.error(errorMessage || 'Failed to process employee data');
            } else {
                message.error('An unexpected error occurred');
            }
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteEmployee(deleteModal.data.id).unwrap();
            message.success('Employee deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete employee');
        }
    };

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteEmployee(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} employee${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} employee${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <ModuleLayout
            module="employee"
            title="Employees"
            showViewToggle={true}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onAddClick={handleAdd}
            className="employee"
        >
            <EmployeeList
                employees={employees}
                roleMap={roleMap}
                departmentMap={departmentMap}
                designationMap={designationMap}
                isLoading={isLoadingEmployees || isFetching}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: total,
                    onChange: handlePageChange
                }}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                viewMode={viewMode}
            />

            <Modal
                title={<ModalTitle icon={RiUser3Line} title={formModal.data ? 'Edit Employee' : 'Add Employee'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={1000}
                className="modal"
                maskClosable={false}
                destroyOnClose={true}
            >
                <EmployeeForm
                    key={formKey}
                    initialValues={formModal.data}
                    departments={departments}
                    designations={designations}
                    roles={roles}
                    isLoading={{
                        departments: isLoadingDepartments,
                        designations: isLoadingDesignations
                    }}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={RiUser3Line} title="Employee Details" />}
                open={viewModal.visible}
                onCancel={handleViewCancel}
                footer={null}
                width={1000}
                className="modal"
                maskClosable={false}
            >
                <EmployeeView
                    employee={employee}
                    roleMap={roleMap}
                    departmentMap={departmentMap}
                    designationMap={designationMap}
                    isLoading={isLoadingEmployee}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Employee" />}
                open={deleteModal.visible}
                onCancel={handleDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                className="delete-modal"
                centered
                maskClosable={false}
                confirmLoading={isDeleting}
                onOk={handleDeleteConfirm}
            >
                <p>Are you sure you want to delete employee "{deleteModal.data?.username}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Employees" />}
                open={bulkDeleteModal.visible}
                onCancel={handleBulkDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                className="delete-modal"
                centered
                maskClosable={false}
                onOk={handleBulkDeleteConfirm}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} employees?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Employee; 