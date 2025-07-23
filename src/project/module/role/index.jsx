import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiShieldUserLine } from 'react-icons/ri';
import RoleList from './components/RoleList';
import RoleForm from './components/RoleForm';
import RoleView from './components/RoleView';
import { ModalTitle } from '../../../components/AdvancedForm';
import ModuleLayout from '../../../components/ModuleLayout';
import { useGetRolesQuery, useDeleteRoleMutation, useGetRoleQuery, useCreateRoleMutation, useUpdateRoleMutation, useGetEmployeesQuery } from '../../../config/api/apiServices';
import './role.scss';

const Role = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [viewModal, setViewModal] = useState({ visible: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading } = useGetRolesQuery({
        page: currentPage,
        limit: pageSize,
    });

    const { data: employeesData } = useGetEmployeesQuery({
        page: 1,
        limit: 1000
    });

    const employees = employeesData?.data?.items || [];

    const rolesWithEmployees = new Set();
    employees.forEach(employee => {
        if (employee.role_id) {
            rolesWithEmployees.add(employee.role_id);
        }
    });

    const { data: viewingRoleResponse, isLoading: isViewLoading } = useGetRoleQuery(
        viewModal.id,
        { skip: !viewModal.id }
    );

    const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
    const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

    const roles = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const currentPageFromServer = response?.data?.currentPage || 1;
    const viewingRole = viewingRoleResponse?.data;

    const filteredRoles = roles.filter(role => role.created_by !== 'ADMIN');

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (role) => setFormModal({ visible: true, data: role });
    const handleView = (role) => setViewModal({ visible: true, id: role.id });

    const handleDelete = (role) => {
        if (rolesWithEmployees.has(role.id)) {
            message.error('Cannot delete role because it has employees assigned to it');
            return;
        }
        setDeleteModal({ visible: true, data: role });
    };

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleViewCancel = () => setViewModal({ visible: false, id: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateRole({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Role updated successfully');
            } else {
                await createRole(values).unwrap();
                message.success('Role created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} role: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteRole(deleteModal.data.id).unwrap();
            message.success('Role deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error(error.data?.message || error.message || 'Failed to delete role');
        }
    };

    const handleBulkDelete = (selectedIds) => {
        const validIds = selectedIds.filter(id => !rolesWithEmployees.has(id));

        if (validIds.length === 0) {
            message.error('Cannot delete roles because they have employees assigned to them');
            return;
        }

        if (validIds.length < selectedIds.length) {
            message.warning('Some roles cannot be deleted because they have employees assigned to them');
        }

        if (validIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: validIds });
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteRole(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(error.data?.message || error.message || `Failed to delete role with ID ${id}:`);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} role${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} role${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <ModuleLayout
            title="Roles"
            onAddClick={handleAdd}
            className="role"
            module="role"
        >
            <RoleList
                roles={filteredRoles}
                isLoading={isLoading}
                currentPage={currentPageFromServer}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
            />

            <Modal
                title={<ModalTitle icon={RiShieldUserLine} title={formModal.data ? 'Edit Role' : 'Add Role'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <RoleForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <RoleView
                role={viewingRole}
                isLoading={isViewLoading}
                visible={viewModal.visible}
                onClose={handleViewCancel}
            />

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Role" />}
                open={deleteModal.visible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                className="delete-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
            >
                <p>Are you sure you want to delete role "{deleteModal.data?.role_name}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Roles" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
                okText="Delete All"
                cancelText="Cancel"
                className="delete-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected roles?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Role; 