import React, { useState } from 'react';
import { Modal, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FaUserShield } from 'react-icons/fa';
import AdminList from './components/AdminList';
import AdminForm from './components/AdminForm';
import { ModalTitle } from '../../../components/AdvancedForm';
import ModuleLayout from '../../../components/ModuleLayout';
import { adminApi } from '../../../config/api/apiServices';
import './admin.scss';

const Admin = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading, refetch } = adminApi.useGetAllQuery({
        page: currentPage,
        limit: pageSize,
    });

    const [deleteAdmin, { isLoading: isDeleting }] = adminApi.useDeleteMutation();
    const [createAdmin, { isLoading: isCreating }] = adminApi.useCreateMutation();
    const [updateAdmin, { isLoading: isUpdating }] = adminApi.useUpdateMutation();

    const admins = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const currentPageFromServer = response?.data?.currentPage || 1;

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (admin) => {
        console.log('Editing admin:', admin);
        // Force a new form key to ensure the form is re-rendered with fresh data
        setFormKey(Date.now());
        setFormModal({ visible: true, data: admin });
    };
    
    const handleDelete = (admin) => setDeleteModal({ visible: true, data: admin });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                console.log('Updating admin with values:', values);
                
                // Make sure it has the ID
                values.id = formModal.data.id;
                
                await updateAdmin({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Admin updated successfully');
            } else {
                console.log('Creating new admin with values:', values);
                const result = await createAdmin(values).unwrap();
                message.success('Admin created successfully');
            }
            setFormModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            console.error('Form submission error:', error);
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} admin: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteAdmin(deleteModal.data.id).unwrap();
            message.success('Admin deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error('Failed to delete admin');
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
                    await deleteAdmin(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete admin with ID ${id}:`, error);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            refetch();

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} ${successCount > 1 ? 'admins' : 'admin'}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} ${errorCount > 1 ? 'admins' : 'admin'}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <ModuleLayout
            module="admin"
            title="Administrators"
            onAddClick={handleAdd}
            className="admin"
        >
            <AdminList
                admins={admins}
                isLoading={isLoading}
                currentPage={currentPageFromServer}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                refetchAdmins={refetch}
            />

            <Modal
                title={<ModalTitle icon={<FaUserShield />} title={formModal.data ? 'Edit Admin' : 'Add Admin'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <AdminForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Admin" />}
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
                <p>Are you sure you want to delete admin "
                    {deleteModal.data?.username && (
                        <Tooltip title={deleteModal.data.username}>
                            <span>
                                {deleteModal.data.username.length > 30 
                                    ? `${deleteModal.data.username.substring(0, 30)}...` 
                                    : deleteModal.data.username}
                            </span>
                        </Tooltip>
                    )}"?
                </p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Admins" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected admins?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Admin; 