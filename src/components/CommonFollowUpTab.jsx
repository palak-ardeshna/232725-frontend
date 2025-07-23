import React, { useState, useEffect, useRef } from 'react';
import { Modal, message, Select } from 'antd';
import { DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { FiClock } from 'react-icons/fi';
import dayjs from 'dayjs';
import CommonFollowUpList from './CommonFollowUpList';
import CommonFollowUpForm from './CommonFollowUpForm';
import CommonFollowUpView from './CommonFollowUpView';
import { ModalTitle } from './AdvancedForm';
import ModuleLayout from './ModuleLayout';
import {
    useGetFollowupsQuery,
    useCreateFollowupMutation,
    useUpdateFollowupMutation,
    useDeleteFollowupMutation,
    useGetEmployeesQuery,
    useGetRolesQuery,
    useGetProjectsQuery,
    useGetTeamMembersQuery,
    useUpdateProjectMutation
} from '../config/api/apiServices';

const CommonFollowUpTab = ({
    entity,
    entityType = 'lead',
}) => {
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [viewModal, setViewModal] = useState({ visible: false, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterType, setFilterType] = useState('task');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 576);
    const filterRef = useRef(null);

    const { data: followupsData, isLoading, refetch } = useGetFollowupsQuery({
        related_id: entity?.id,
        section: entityType,
        type: filterType,
        limit: 'all'
    }, {
        skip: !entity?.id,
        refetchOnMountOrArgChange: true
    });

    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({ limit: 'all' });
    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({ limit: 'all' });
    const { data: projectsData, isLoading: isLoadingProjects } = useGetProjectsQuery({ limit: 'all' });
    const { data: teamsData, refetch: refetchTeams, isLoading: isLoadingTeams } = useGetTeamMembersQuery({ limit: 'all' });
    const [createFollowup, { isLoading: isCreating }] = useCreateFollowupMutation();
    const [updateFollowup, { isLoading: isUpdating }] = useUpdateFollowupMutation();
    const [deleteFollowup, { isLoading: isDeletingApi }] = useDeleteFollowupMutation();
    const [updateProject, { isLoading: isUpdatingProject }] = useUpdateProjectMutation();

    const followUps = followupsData?.data?.items || [];

    useEffect(() => {
        if (entity?.id) {
            refetch();
        }
    }, [entity?.id, refetch]);

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

    const handleAdd = () => {
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (followUp) => {
        let processedFollowUp = { ...followUp };
        const meta = processedFollowUp.meta || {};

        if (processedFollowUp.members) {
            if (typeof processedFollowUp.members === 'string') {
                try {
                    processedFollowUp.members = JSON.parse(processedFollowUp.members);
                } catch (e) {
                    processedFollowUp.members = [];
                }
            }
        }

        if (processedFollowUp.date) {
            processedFollowUp.date = dayjs(processedFollowUp.date);

            if (processedFollowUp.type === 'task') {
                processedFollowUp.task_due_date = processedFollowUp.date;
            } else if (processedFollowUp.type === 'meeting') {
                processedFollowUp.meeting_from_date = processedFollowUp.date;
            } else if (processedFollowUp.type === 'call') {
                processedFollowUp.call_date = processedFollowUp.date;
            }
        }

        if (processedFollowUp.reminder) {
            processedFollowUp.reminder = true;
        } else {
            processedFollowUp.reminder = false;
        }

        if (processedFollowUp.type === 'task') {
            processedFollowUp.task_reporter = meta.task_reporter || '';
        }
        else if (processedFollowUp.type === 'meeting') {
            processedFollowUp.meeting_type = meta.meeting_type || 'online';
            processedFollowUp.meeting_from_time = meta.meeting_from_time ?
                dayjs(meta.meeting_from_time, 'HH:mm:ss') : null;
            processedFollowUp.meeting_to_time = meta.meeting_to_time ?
                dayjs(meta.meeting_to_time, 'HH:mm:ss') : null;
            processedFollowUp.meeting_link = meta.meeting_link || '';
            processedFollowUp.location = meta.location || '';
        }
        else if (processedFollowUp.type === 'call') {
            processedFollowUp.call_type = meta.call_type || 'logged';
            processedFollowUp.call_duration = meta.call_duration || '30 min';
            processedFollowUp.call_purpose = meta.call_purpose || '';
            processedFollowUp.call_notes = meta.call_notes || '';
        }

        setFormModal({ visible: true, data: processedFollowUp });
    };

    const handleDelete = (followUp) => {
        setDeleteModal({ visible: true, data: followUp });
    };

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleView = (followUp) => {
        setViewModal({ visible: true, data: followUp });
    };

    const handleViewClose = () => {
        setViewModal({ visible: false, data: null });
    };

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const followupData = {
                ...values,
                section: entityType,
                related_id: entity.id
            };

            // Make sure we have a meta object
            if (!followupData.meta) {
                followupData.meta = {};
            }

            // Handle meta fields for each type
            if (followupData.type === 'task') {
                // Make sure task_reporter is in meta
                if (!followupData.meta.task_reporter && followupData.task_reporter) {
                    followupData.meta.task_reporter = followupData.task_reporter;
                    delete followupData.task_reporter;
                }
            }
            else if (followupData.type === 'meeting') {
                // Make sure meeting fields are in meta
                if (!followupData.meta.meeting_type && followupData.meeting_type) {
                    followupData.meta.meeting_type = followupData.meeting_type;
                    delete followupData.meeting_type;
                }

                if (!followupData.meta.meeting_from_time && followupData.meeting_from_time) {
                    followupData.meta.meeting_from_time = followupData.meeting_from_time;
                    delete followupData.meeting_from_time;
                }

                if (!followupData.meta.meeting_to_time && followupData.meeting_to_time) {
                    followupData.meta.meeting_to_time = followupData.meeting_to_time;
                    delete followupData.meeting_to_time;
                }

                if (!followupData.meta.meeting_link && followupData.meeting_link) {
                    followupData.meta.meeting_link = followupData.meeting_link;
                    delete followupData.meeting_link;
                }

                if (!followupData.meta.location && followupData.location) {
                    followupData.meta.location = followupData.location;
                    delete followupData.location;
                }
            }
            else if (followupData.type === 'call') {
                // Make sure call fields are in meta
                if (!followupData.meta.call_type && followupData.call_type) {
                    followupData.meta.call_type = followupData.call_type;
                    delete followupData.call_type;
                }

                if (!followupData.meta.call_duration && followupData.call_duration) {
                    followupData.meta.call_duration = followupData.call_duration;
                    delete followupData.call_duration;
                }

                if (!followupData.meta.call_purpose && followupData.call_purpose) {
                    followupData.meta.call_purpose = followupData.call_purpose;
                    delete followupData.call_purpose;
                }

                if (!followupData.meta.call_notes && followupData.call_notes) {
                    followupData.meta.call_notes = followupData.call_notes || '';
                    delete followupData.call_notes;
                }
            }

            // Remove any old fields that should now be in meta
            delete followupData.task_due_date;
            delete followupData.meeting_from_date;
            delete followupData.call_date;
            delete followupData.call_duration_unit;

            if (formModal.data) {
                await updateFollowup({
                    id: formModal.data.id,
                    data: followupData
                }).unwrap();
                message.success('Follow-up updated successfully');
            } else {
                await createFollowup(followupData).unwrap();
                message.success('Follow-up added successfully');
            }
            setFormModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'add'} follow-up: ${error.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteFollowup(deleteModal.data.id).unwrap();
            message.success('Follow-up deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error('Failed to delete follow-up');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const { ids } = bulkDeleteModal;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteFollowup(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} follow-up${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} follow-up${errorCount > 1 ? 's' : ''}`);
            }

            refetch();
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRemoveAll = async () => {
        try {
            Modal.confirm({
                title: 'Delete All Follow-ups',
                content: `Are you sure you want to delete all follow-ups for this ${entityType}? This action cannot be undone.`,
                okText: 'Delete All',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                    try {
                        const deletePromises = followUps.map(followup => deleteFollowup(followup.id).unwrap());
                        await Promise.all(deletePromises);
                        message.success('All follow-ups deleted successfully');
                        refetch();
                    } catch (error) {
                        message.error('Failed to delete all follow-ups');
                    }
                }
            });
        } catch (error) {
            message.error('Failed to delete all follow-ups');
        }
    };

    const showRemoveAllButton = followUps.length > 1;
    const addButtonText = 'Add Follow-up';
    const modalTitle = formModal.data ? 'Update Follow-up' : 'Add Follow-up';
    const moduleTitle = 'Follow-ups';

    const typeOptions = [
        { value: 'task', label: 'Tasks' },
        { value: 'meeting', label: 'Meetings' },
        { value: 'call', label: 'Calls' }
    ];

    const handleFilterChange = (value) => {
        setFilterType(value);
        if (isMobileView) {
            closeFilter();
        }
    };

    const FilterComponent = () => (
        <div className="filter-container">
            <div
                className={`module-filter ${isFilterOpen ? 'open' : ''}`}
                ref={filterRef}
            >
                {isMobileView && (
                    <div className={`filter-icon ${isFilterOpen ? 'active' : ''}`} onClick={toggleFilter}>
                        <FilterOutlined />
                    </div>
                )}
                <Select
                    placeholder="Filter by type"
                    style={{ width: '100%' }}
                    value={filterType}
                    onChange={handleFilterChange}
                    allowClear={false}
                    showSearch
                    optionFilterProp="children"
                    onBlur={isMobileView ? closeFilter : undefined}
                    onClick={(e) => isMobileView && e.stopPropagation()}
                    options={typeOptions}
                />
            </div>
        </div>
    );

    return (
        <div className={`${entityType}-followup-tab`}>
            <ModuleLayout
                title={moduleTitle}
                icon={<FiClock />}
                onAddClick={handleAdd}
                className="followup"
                contentClassName="followup-content"
                showHeader={false}
                addButtonText={addButtonText}
                module="followup"
                extraHeaderContent={<FilterComponent />}
                extraActions={showRemoveAllButton ? [
                    {
                        key: 'remove-all',
                        label: 'Delete All',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: handleRemoveAll
                    }
                ] : []}
            >
                <CommonFollowUpList
                    followUps={followUps}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                    onView={handleView}
                    usersData={employeesData}
                    rolesData={rolesData}
                />

                <Modal
                    title={<ModalTitle icon={<FiClock />} title={`${formModal.data ? 'Edit' : 'Add'} Follow-up`} />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={800}
                    className="common-modal"
                    maskClosable={false}
                    destroyOnClose={true}
                    centered
                >
                    <CommonFollowUpForm
                        initialValues={formModal.data}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        isSubmitting={isSubmitting}
                        entity={entity}
                        entityType={entityType}
                        usersData={employeesData}
                        rolesData={rolesData}
                        projectsData={projectsData}
                        teamsData={teamsData}
                        refetchTeams={refetchTeams}
                        isLoadingTeams={isLoadingTeams}
                        isLoadingRoles={isLoadingRoles}
                        isLoadingProjects={isLoadingProjects}
                        isLoadingUsers={isLoadingEmployees}
                        updateProject={updateProject}
                    />
                </Modal>

                <CommonFollowUpView
                    followUp={viewModal.data}
                    isLoading={false}
                    visible={viewModal.visible}
                    onClose={handleViewClose}
                    usersData={employeesData}
                    rolesData={rolesData}
                />

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Follow-up" />}
                    open={deleteModal.visible}
                    onOk={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: isDeleting }}
                    className="delete-modal"
                    maskClosable={false}
                    centered
                >
                    <p>Are you sure you want to delete this follow-up?</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Follow-ups" />}
                    open={bulkDeleteModal.visible}
                    onOk={handleBulkDeleteConfirm}
                    onCancel={handleBulkDeleteCancel}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: isDeleting }}
                    className="delete-modal"
                    maskClosable={false}
                    centered
                >
                    <p>Are you sure you want to delete {bulkDeleteModal.ids.length} follow-ups?</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default CommonFollowUpTab; 