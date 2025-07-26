import React, { useState } from 'react';
import { Modal, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiPriceTag3Line } from 'react-icons/ri';
import PlanList from './components/PlanList';
import PlanForm from './components/PlanForm';
import { ModalTitle } from '../../../components/AdvancedForm';
import ModuleLayout from '../../../components/ModuleLayout';
import { planApi } from '../../../config/api/apiServices';
import './plan.scss';

const Plan = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading, refetch } = planApi.useGetAllQuery({
        page: currentPage,
        limit: pageSize,
    });

    const [deletePlan, { isLoading: isDeleting }] = planApi.useDeleteMutation();
    const [createPlan, { isLoading: isCreating }] = planApi.useCreateMutation();
    const [updatePlan, { isLoading: isUpdating }] = planApi.useUpdateMutation();

    const plans = response?.data?.items || [];
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

    const handleEdit = (plan) => setFormModal({ visible: true, data: plan });
    const handleDelete = (plan) => setDeleteModal({ visible: true, data: plan });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updatePlan({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Plan updated successfully');
            } else {
                await createPlan(values).unwrap();
                message.success('Plan created successfully');
            }
            setFormModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} plan: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deletePlan(deleteModal.data.id).unwrap();
            message.success('Plan deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error('Failed to delete plan');
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
                    await deletePlan(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete plan with ID ${id}:`, error);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            refetch();

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} ${successCount > 1 ? 'plans' : 'plan'}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} ${errorCount > 1 ? 'plans' : 'plan'}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <ModuleLayout
            module="plan"
            title="Plans"
            onAddClick={handleAdd}
            className="plan"
        >
            <PlanList
                plans={plans}
                isLoading={isLoading}
                currentPage={currentPageFromServer}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                refetchPlans={refetch}
            />

            <Modal
                title={<ModalTitle icon={RiPriceTag3Line} title={formModal.data ? 'Edit Plan' : 'Add Plan'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <PlanForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Plan" />}
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
                <p>Are you sure you want to delete plan "
                    {deleteModal.data?.planName && (
                        <Tooltip title={deleteModal.data.planName}>
                            <span>
                                {deleteModal.data.planName.length > 30 
                                    ? `${deleteModal.data.planName.substring(0, 30)}...` 
                                    : deleteModal.data.planName}
                            </span>
                        </Tooltip>
                    )}"?
                </p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Plans" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected plans?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Plan; 