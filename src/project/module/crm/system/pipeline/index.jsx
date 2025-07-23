import React, { useState } from 'react';
import { message } from 'antd';
import { RiFlowChart } from 'react-icons/ri';
import {
    useGetPipelinesQuery,
    useCreatePipelineMutation,
    useUpdatePipelineMutation,
    useDeletePipelineMutation
} from '../../../../../config/api/apiServices';
import PipelineList from './components/PipelineList';
import PipelineForm from './components/PipelineForm';
import PipelineView from './components/PipelineView';
import { SystemModule } from '../../system';
import './pipeline.scss';

const Pipeline = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [viewModal, setViewModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading } = useGetPipelinesQuery({
        page: currentPage,
        limit: pageSize
    });

    const [createPipeline, { isLoading: isCreating }] = useCreatePipelineMutation();
    const [updatePipeline, { isLoading: isUpdating }] = useUpdatePipelineMutation();
    const [deletePipeline, { isLoading: isDeleting }] = useDeletePipelineMutation();

    const pipelines = response?.data?.items || [];
    const total = response?.data?.total || 0;

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setCurrentPage(1);
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };
    const handleEdit = (pipeline) => setFormModal({ visible: true, data: pipeline });
    const handleView = (pipeline) => setViewModal({ visible: true, data: pipeline });
    const handleDelete = (pipeline) => setDeleteModal({ visible: true, data: pipeline });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleViewCancel = () => setViewModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleDeleteConfirm = async () => {
        try {
            await deletePipeline(deleteModal.data.id).unwrap();
            message.success('Pipeline deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete pipeline');
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
                    await deletePipeline(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} pipeline${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} pipeline${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updatePipeline({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Pipeline updated successfully');
            } else {
                await createPipeline(values).unwrap();
                message.success('Pipeline created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} pipeline: ${error.data?.message || error.message}`);
        }
    };

    return (
        <SystemModule
            title="Pipeline"
            showViewToggle={true}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onAddClick={handleAdd}
            className="pipeline"
            formModal={formModal}
            viewModal={viewModal}
            deleteModal={deleteModal}
            bulkDeleteModal={bulkDeleteModal}
            onFormCancel={handleFormCancel}
            onViewCancel={handleViewCancel}
            onDeleteCancel={handleDeleteCancel}
            onDeleteConfirm={handleDeleteConfirm}
            onBulkDeleteCancel={handleBulkDeleteCancel}
            onBulkDeleteConfirm={handleBulkDeleteConfirm}
            isDeleting={isDeleting}
            formTitle={formModal?.data ? 'Edit Pipeline' : 'Add Pipeline'}
            formIcon={<RiFlowChart />}
            viewTitle={viewModal?.data ? `${viewModal.data.name} Pipeline` : 'Pipeline Details'}
            deleteTitle="Delete Pipeline"
            deleteItemName="pipeline"
            bulkDeleteTitle="Bulk Delete Pipelines"
            formContent={
                <PipelineForm
                    key={formKey}
                    initialValues={formModal?.data}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    loading={isCreating || isUpdating}
                />
            }
            viewContent={
                viewModal?.data && (
                    <PipelineView
                        pipeline={viewModal.data}
                        onClose={handleViewCancel}
                        hideHeader={true}
                    />
                )
            }
        >
            <PipelineList
                viewMode={viewMode}
                pipelines={pipelines}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: handlePageChange
                }}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onBulkDelete={handleBulkDelete}
            />
        </SystemModule>
    );
};

export default Pipeline;