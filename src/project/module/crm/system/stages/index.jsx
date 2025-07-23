import React, { useState, useEffect, useRef } from 'react';
import { message, Select } from 'antd';
import { RiRoadMapLine, RiFilterLine, RiFilterLine as FilterOutlined } from 'react-icons/ri';
import {
    useGetStagesQuery,
    useCreateStageMutation,
    useUpdateStageMutation,
    useDeleteStageMutation,
    useGetPipelinesQuery
} from '../../../../../config/api/apiServices';
import StageList from './components/StageList';
import StageForm from './components/StageForm';
import { SystemModule } from '../../system';
import './stage.scss';

const { Option } = Select;

const ModuleFilter = ({ selectedPipeline, handlePipelineChange, pipelines, isPipelinesLoading }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 576);
    const filterRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 576);
            if (window.innerWidth > 576) {
                setIsFilterOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleFilter = (e) => {
        e.stopPropagation();
        setIsFilterOpen(!isFilterOpen);
    };

    const closeFilter = () => {
        setIsFilterOpen(false);
    };

    const filters = [
        {
            key: 'pipeline',
            placeholder: 'Select Pipeline',
            value: selectedPipeline,
            onChange: (val) => {
                handlePipelineChange(val);
                if (isMobileView) {
                    closeFilter();
                }
            },
            allowClear: false,
            loading: isPipelinesLoading,
            options: [
                { key: 'all', value: 'all', label: 'All Pipelines' },
                ...pipelines.map(pipeline => ({
                    key: pipeline.id,
                    value: pipeline.id,
                    label: pipeline.name
                }))
            ]
        }
    ];

    return (
        <div className="filter-container">
            {filters.map(filter => (
                <div
                    key={filter.key}
                    className={`module-filter ${isFilterOpen ? 'open' : ''}`}
                    ref={filterRef}
                >
                    {isMobileView && (
                        <div
                            className={`filter-icon ${isFilterOpen ? 'active' : ''}`}
                            onClick={toggleFilter}
                        >
                            <FilterOutlined />
                        </div>
                    )}
                    <Select
                        placeholder={filter.placeholder}
                        style={{ width: '100%' }}
                        value={filter.value}
                        onChange={filter.onChange}
                        allowClear={filter.allowClear !== false}
                        loading={filter.loading}
                        showSearch
                        optionFilterProp="children"
                        onBlur={isMobileView ? closeFilter : undefined}
                        onClick={(e) => isMobileView && e.stopPropagation()}
                        styles={{ popup: { root: { minWidth: '220px' } } }}
                        popupMatchSelectWidth={false}
                    >
                        {filter.options.map(option => (
                            <Option key={option.key} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>
            ))}
        </div>
    );
};

const Stages = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [selectedPipeline, setSelectedPipeline] = useState('all');
    const [formKey, setFormKey] = useState(Date.now());

    const { data: pipelinesResponse, isLoading: isPipelinesLoading } = useGetPipelinesQuery({
        limit: 'all'
    });

    const apiParams = {
        page: currentPage,
        limit: pageSize,
        pipeline: selectedPipeline === 'all' ? undefined : selectedPipeline
    };

    const { data: response, isLoading } = useGetStagesQuery(apiParams);

    const [createStage, { isLoading: isCreating }] = useCreateStageMutation();
    const [updateStage, { isLoading: isUpdating }] = useUpdateStageMutation();
    const [deleteStage, { isLoading: isDeleting }] = useDeleteStageMutation();

    const stages = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const pipelines = pipelinesResponse?.data?.items || [];

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
    const handleEdit = (stage) => setFormModal({ visible: true, data: stage });
    const handleDelete = (stage) => setDeleteModal({ visible: true, data: stage });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleDeleteConfirm = async () => {
        try {
            await deleteStage(deleteModal.data.id).unwrap();
            message.success('Stage deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete stage');
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
                    await deleteStage(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            
            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} stage${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} stage${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                const { order, ...dataWithoutOrder } = values;
                await updateStage({
                    id: formModal.data.id,
                    data: dataWithoutOrder
                }).unwrap();
                message.success('Stage updated successfully');
            } else {
                await createStage(values).unwrap();
                message.success('Stage created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} stage: ${error.data?.message || error.message}`);
        }
    };

    const handlePipelineChange = (value) => {
        setSelectedPipeline(value);
        setCurrentPage(1);
    };

    return (
        <SystemModule
            title="Stages"
            showViewToggle={true}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onAddClick={handleAdd}
            className="stage"
            extraHeaderContent={
                <ModuleFilter
                    selectedPipeline={selectedPipeline}
                    handlePipelineChange={handlePipelineChange}
                    pipelines={pipelines}
                    isPipelinesLoading={isPipelinesLoading}
                />
            }
            formModal={formModal}
            deleteModal={deleteModal}
            bulkDeleteModal={bulkDeleteModal}
            onFormCancel={handleFormCancel}
            onDeleteCancel={handleDeleteCancel}
            onDeleteConfirm={handleDeleteConfirm}
            onBulkDeleteCancel={handleBulkDeleteCancel}
            onBulkDeleteConfirm={handleBulkDeleteConfirm}
            isDeleting={isDeleting}
            formTitle={formModal?.data ? 'Edit Stage' : 'Add Stage'}
            formIcon={<RiRoadMapLine />}
            deleteTitle="Delete Stage"
            deleteItemName="stage"
            bulkDeleteTitle="Bulk Delete Stages"
            formContent={
                <StageForm
                    key={formKey}
                    initialValues={formModal?.data}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    loading={isCreating || isUpdating}
                />
            }
        >
            <StageList
                viewMode={viewMode}
                stages={stages}
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
                onBulkDelete={handleBulkDelete}
            />
        </SystemModule>
    );
};

export default Stages;
