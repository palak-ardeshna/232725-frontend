import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiContactsLine } from 'react-icons/ri';
import DesignationList from './components/DesignationList';
import DesignationForm from './components/DesignationForm';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import {
    useGetDesignationsQuery,
    useDeleteDesignationMutation,
    useCreateDesignationMutation,
    useUpdateDesignationMutation
} from '../../../../config/api/apiServices';
import './designation.scss';

const Designation = () => {
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading } = useGetDesignationsQuery({
        page: currentPage,
        limit: pageSize
    });

    const [deleteDesignation, { isLoading: isDeleting }] = useDeleteDesignationMutation();
    const [createDesignation, { isLoading: isCreating }] = useCreateDesignationMutation();
    const [updateDesignation, { isLoading: isUpdating }] = useUpdateDesignationMutation();

    const designations = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const currentPageFromServer = response?.data?.currentPage || 1;

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };
    const handleEdit = (designation) => setFormModal({ visible: true, data: designation });
    const handleDelete = (designation) => setDeleteModal({ visible: true, data: designation });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateDesignation({ id: formModal.data.id, data: values }).unwrap();
                message.success('Designation updated successfully');
            } else {
                await createDesignation(values).unwrap();
                message.success('Designation created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} designation: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteDesignation(deleteModal.data.id).unwrap();
            message.success('Designation deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete designation');
        }
    };

    const handleBulkDelete = (selectedIds) => {
        setBulkDeleteModal({ visible: true, ids: selectedIds });
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const deletePromises = bulkDeleteModal.ids.map(id =>
                deleteDesignation(id).unwrap()
            );

            await Promise.all(deletePromises);

            message.success(`${bulkDeleteModal.ids.length} designations deleted successfully`);
            setBulkDeleteModal({ visible: false, ids: [] });
        } catch (error) {
            message.error('Failed to delete some designations');
        }
    };

    const handleBulkDeleteCancel = () => {
        setBulkDeleteModal({ visible: false, ids: [] });
    };

    return (
        <ModuleLayout
            module="designation"
            title="Designations"
            onAddClick={handleAdd}
            className="designation"
        >
            <DesignationList
                designations={designations}
                isLoading={isLoading}
                currentPage={currentPageFromServer}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
            />

            <Modal
                title={<ModalTitle icon={RiContactsLine} title={formModal.data ? 'Edit Designation' : 'Add Designation'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={700}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <DesignationForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Designation" />}
                open={deleteModal.visible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                className="delete-modal"
                centered
                okButtonProps={{ danger: true, loading: isDeleting }}
            >
                <p>Are you sure you want to delete designation "{deleteModal.data?.designation}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Designations" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
                okText="Delete All"
                cancelText="Cancel"
                className="delete-modal"
                centered
                okButtonProps={{ danger: true, loading: isDeleting }}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} designations?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Designation; 