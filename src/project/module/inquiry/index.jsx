import React, { useState } from 'react';
import { Modal, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiMessage2Fill, RiBuildingLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import InquiryList from './components/InquiryList';
import InquiryForm from './components/InquiryForm';
import { ModalTitle } from '../../../components/AdvancedForm';
import ModuleLayout from '../../../components/ModuleLayout';
import { inquiryApi, companyApi } from '../../../config/api/apiServices';
import './inquiry.scss';

const Inquiry = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading, refetch } = inquiryApi.useGetAllQuery({
        page: currentPage,
        limit: pageSize,
    });

    const [deleteInquiry, { isLoading: isDeleting }] = inquiryApi.useDeleteMutation();
    const [createInquiry, { isLoading: isCreating }] = inquiryApi.useCreateMutation();
    const [updateInquiry, { isLoading: isUpdating }] = inquiryApi.useUpdateMutation();
    const [createCompany] = companyApi.useCreateMutation();

    const inquiries = response?.data?.items || [];
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

    const handleEdit = (inquiry) => setFormModal({ visible: true, data: inquiry });
    const handleDelete = (inquiry) => setDeleteModal({ visible: true, data: inquiry });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateInquiry({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Inquiry updated successfully');
            } else {
                await createInquiry(values).unwrap();
                message.success('Inquiry created successfully');
            }
            setFormModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} inquiry: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteInquiry(deleteModal.data.id).unwrap();
            message.success('Inquiry deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error('Failed to delete inquiry');
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
                    await deleteInquiry(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete inquiry with ID ${id}:`, error);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            refetch();

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} inquiry${successCount > 1 ? 'ies' : 'y'}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} inquiry${errorCount > 1 ? 'ies' : 'y'}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const handleConvertToCompany = async (inquiry) => {
        try {
            // Store inquiry data to localStorage for the company form
            const companyData = {
                name: inquiry.name || '',
                description: inquiry.message || '',
                contact_email: inquiry.email || '',
                contact_phone: inquiry.phone || '',
                source_inquiry_id: inquiry.id
            };
            
            localStorage.setItem('convert_inquiry_to_company', JSON.stringify(companyData));
            
            // Navigate to company form
            navigate('/admin/hrm/company', { state: { openAddModal: true, fromInquiry: true } });
            
        } catch (error) {
            message.error('Failed to prepare company conversion');
        }
    };

    return (
        <ModuleLayout
            module="inquiry"
            title="Inquiries"
            onAddClick={handleAdd}
            className="inquiry"
        >
            <InquiryList
                inquiries={inquiries}
                isLoading={isLoading}
                currentPage={currentPageFromServer}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                refetchInquiries={refetch}
                onConvertToCompany={handleConvertToCompany}
            />

            <Modal
                title={<ModalTitle icon={RiMessage2Fill} title={formModal.data ? 'Edit Inquiry' : 'Add Inquiry'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <InquiryForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Inquiry" />}
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
                <p>Are you sure you want to delete inquiry from "
                    {deleteModal.data?.name && (
                        <Tooltip title={deleteModal.data.name}>
                            <span>
                                {deleteModal.data.name.length > 30 
                                    ? `${deleteModal.data.name.substring(0, 30)}...` 
                                    : deleteModal.data.name}
                            </span>
                        </Tooltip>
                    )}"?
                </p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Inquiries" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected inquiries?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Inquiry; 