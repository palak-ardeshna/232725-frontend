import React, { useState, useEffect, useRef } from 'react';
import { Modal, message, Select } from 'antd';
import { DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { RiFileList3Line } from 'react-icons/ri';
import LeadList from '../../../lead/components/LeadList'
import LeadForm from '../../../lead/components/LeadForm';
import LeadOverview from '../../../lead/overview';
import {
    useGetLeadsQuery,
    useDeleteLeadMutation,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useGetPipelinesQuery,
    useGetStagesQuery,
    useGetFiltersQuery
} from '../../../../../../config/api/apiServices';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import FancyLoader from '../../../../../../components/FancyLoader';
import '../../../lead/lead.scss';
import { useParams } from 'react-router-dom';

const { Option } = Select;

const ModuleFilter = ({ selectedPipeline, handlePipelineChange, pipelines }) => {
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
            placeholder: 'All Pipelines',
            value: selectedPipeline,
            onChange: (val) => {
                handlePipelineChange(val);
                if (isMobileView) {
                    closeFilter();
                }
            },
            allowClear: false,
            options: pipelines.map(pipeline => ({
                key: pipeline.id,
                value: pipeline.id,
                label: pipeline.name
            }))
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
                        <div className={`filter-icon ${isFilterOpen ? 'active' : ''}`} onClick={toggleFilter}>
                            <FilterOutlined />
                        </div>
                    )}
                    <Select
                        placeholder={filter.placeholder}
                        style={{ width: '100%' }}
                        value={filter.value}
                        onChange={filter.onChange}
                        allowClear={filter.allowClear !== false}
                        showSearch
                        optionFilterProp="children"
                        onBlur={isMobileView ? closeFilter : undefined}
                        onClick={(e) => isMobileView && e.stopPropagation()}
                        styles={{ popup: { root: { minWidth: '180px' } } }}
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

const Lead = () => {
    const { id } = useParams();

    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [filterParams, setFilterParams] = useState({});

    const [allLeads, setAllLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [isClientSideFiltering, setIsClientSideFiltering] = useState(true);

    const [showInitialLoader, setShowInitialLoader] = useState(false);

    const [formKey, setFormKey] = useState(Date.now());

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [overviewModal, setOverviewModal] = useState({ visible: false, leadId: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });

    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const pipelines = pipelinesResponse?.data?.items || [];

    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const filters = filtersResponse?.data?.items || [];
    const sources = filters.filter(filter => filter.type === 'source');

    const { data: stagesResponse } = useGetStagesQuery({
        limit: 'all'
    }, {
        skip: false
    });
    const stages = stagesResponse?.data?.items || [];

    const leadStages = selectedPipeline
        ? stages.filter(stage => stage.type === 'lead' && stage.pipeline === selectedPipeline)
        : stages.filter(stage => stage.type === 'lead');


    const { data: allLeadsResponse, isLoading: isAllLeadsLoading } = useGetLeadsQuery({
        limit: 'all',
        contact: id
    }, {
        skip: !isClientSideFiltering
    });

    console.log("allLeadsResponse", allLeadsResponse);

    const { data: response, isLoading: isFilteredLeadsLoading } = useGetLeadsQuery({
        page: currentPage,
        limit: pageSize,
        contact: id
    }, {
        skip: isClientSideFiltering
    });

    const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();
    const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
    const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

    useEffect(() => {
        if (isClientSideFiltering && allLeadsResponse?.data?.items) {
            setAllLeads(allLeadsResponse.data.items);
        }
    }, [allLeadsResponse, isClientSideFiltering]);


    useEffect(() => {
        if (isClientSideFiltering && allLeads.length > 0) {
            let filtered = [...allLeads];

            if (selectedPipeline) {
                filtered = filtered.filter(lead => lead.pipeline === selectedPipeline);
            }

            if (selectedStage) {
                filtered = filtered.filter(lead => lead.stage === selectedStage);
            }


            const startIndex = (currentPage - 1) * pageSize;
            const paginatedLeads = filtered.slice(startIndex, startIndex + pageSize);

            setFilteredLeads({
                items: paginatedLeads,
                total: filtered.length,
                currentPage: currentPage
            });
        }
    }, [allLeads, currentPage, pageSize, isClientSideFiltering]);


    const leads = isClientSideFiltering ?
        (filteredLeads.items || []) :
        (response?.data?.items || []);

    const total = isClientSideFiltering ?
        (filteredLeads.total || 0) :
        (response?.data?.total || 0);

    const currentPageFromServer = isClientSideFiltering ?
        currentPage :
        (response?.data?.currentPage || 1);


    useEffect(() => {
        if (!isClientSideFiltering) {
            const params = {};
            if (selectedPipeline) {
                params.pipeline = selectedPipeline;
            }
            if (selectedStage) {
                params.stage = selectedStage;
            }
            setFilterParams(params);
            setCurrentPage(1);
        }
    }, [selectedPipeline, selectedStage, isClientSideFiltering]);

    const handlePipelineChange = (value) => {
        setSelectedPipeline(value);
        setSelectedStage(null);
    };

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
    const handleEdit = (lead) => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: lead });
    };
    const handleDelete = (lead) => setDeleteModal({ visible: true, data: lead });
    const handleViewOverview = (lead) => setOverviewModal({ visible: true, leadId: lead.id });

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleOverviewCancel = () => setOverviewModal({ visible: false, leadId: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            // Always set the contact ID when creating or updating a lead
            const leadData = { ...values, contact: id };
            
            if (formModal.data) {
                await updateLead({ id: formModal.data.id, data: leadData }).unwrap();
                message.success('Lead updated successfully');
            } else {
                await createLead(leadData).unwrap();
                message.success('Lead created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} lead: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteLead(deleteModal.data.id).unwrap();
            
            // Update local state if using client-side filtering
            if (isClientSideFiltering && allLeads.length > 0) {
                const updatedLeads = allLeads.filter(lead => lead.id !== deleteModal.data.id);
                setAllLeads(updatedLeads);

                // Re-apply filters to update filteredLeads
                let filtered = [...updatedLeads];

                // Apply pagination
                const startIndex = (currentPage - 1) * pageSize;
                const paginatedLeads = filtered.slice(startIndex, startIndex + pageSize);

                setFilteredLeads({
                    items: paginatedLeads,
                    total: filtered.length,
                    currentPage: currentPage
                });
            } else {
                // Force refetch by toggling page number
                setCurrentPage(prev => {
                    if (prev === 1) {
                        setTimeout(() => setCurrentPage(1), 0);
                        return 2;
                    }
                    return 1;
                });
            }
            
            message.success('Lead deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete lead');
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
                    await deleteLead(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            // Update local state if using client-side filtering
            if (isClientSideFiltering && allLeads.length > 0) {
                const updatedLeads = allLeads.filter(lead => !ids.includes(lead.id));
                setAllLeads(updatedLeads);

                // Re-apply filters to update filteredLeads
                let filtered = [...updatedLeads];

                // Apply pagination
                const startIndex = (currentPage - 1) * pageSize;
                const paginatedLeads = filtered.slice(startIndex, startIndex + pageSize);

                setFilteredLeads({
                    items: paginatedLeads,
                    total: filtered.length,
                    currentPage: currentPage
                });
            } else {
                // Force refetch by toggling page number
                setCurrentPage(prev => {
                    if (prev === 1) {
                        setTimeout(() => setCurrentPage(1), 0);
                        return 2;
                    }
                    return 1;
                });
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} lead${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} lead${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    
    const isLoading = isClientSideFiltering ? isAllLeadsLoading : isFilteredLeadsLoading;


    if (showInitialLoader) {
        return (
            <FancyLoader
                message="Loading CRM Leads..."
                subMessage="Please wait while we prepare your lead data"
                subMessage2="Organizing pipelines and stages"
                processingText="INITIALIZING"
            />
        );
    }

    return (
        <ModuleLayout
            title="Leads"
            className="lead"
            showAddButton={false}
            onAdd={handleAdd}
        >
       
                <div className="lead-list">
                    <LeadList
                        leads={leads}
                        isLoading={isLoading}
                        viewMode={viewMode}
                        currentPage={currentPageFromServer}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={handlePageChange}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleViewOverview}
                        pipelines={pipelines}
                        stages={stages}
                        onBulkDelete={handleBulkDelete}
                    />
                </div>
            


            <Modal
                title={<ModalTitle icon={RiFileList3Line} title={formModal.data ? 'Edit Lead' : 'Add Lead'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={700}
                className="modal"
                maskClosable={true}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
            >
                <LeadForm
                    key={formKey}
                    initialValues={formModal.data ? {...formModal.data} : {contact: id}}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    pipelines={pipelines}
                    stages={stages}
                    hideContactField={true}
                />
            </Modal>


            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Lead" />}
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
                <p>Are you sure you want to delete lead "{deleteModal.data?.leadTitle}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Leads" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected leads?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={RiFileList3Line} title="Lead Overview" />}
                open={overviewModal.visible}
                onCancel={handleOverviewCancel}
                footer={null}
                width={900}
                className="overview-modal"
                maskClosable={true}
                styles={{ body: { maxHeight: '80vh', overflowY: 'auto', padding: 0 } }}
            >
                <LeadOverview leadId={overviewModal.leadId} />
            </Modal>
        </ModuleLayout>
    );
};

export default Lead;