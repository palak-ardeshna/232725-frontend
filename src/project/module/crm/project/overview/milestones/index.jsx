import React, { useState, useRef, useEffect } from 'react';
import { Modal, message, Tabs, Select, Space, Typography } from 'antd';
import { FiFlag } from 'react-icons/fi';
import { DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import MilestoneList from './components/MilestoneList';
import MilestoneForm from './components/MilestoneForm';
import RescheduleForm from './components/RescheduleForm';
import MilestoneView from './components/MilestoneView';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import { useCreateMilestoneMutation, useUpdateMilestoneMutation, useDeleteMilestoneMutation } from '../../../../../../config/api/apiServices';
import './milestones.scss';

const { Option } = Select;
const { Text } = Typography;

const MilestoneFilter = ({ paymentTypeFilter, setPaymentTypeFilter }) => {
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
            key: 'paymentType',
            placeholder: 'All Types',
            value: paymentTypeFilter,
            onChange: (val) => {
                setPaymentTypeFilter(val);
                if (isMobileView) {
                    closeFilter();
                }
            },
            allowClear: false,
            options: [
                { key: 'all', value: 'all', label: 'All Types' },
                { key: 'conditional', value: 'conditional', label: 'Conditional' },
                { key: 'unconditional', value: 'unconditional', label: 'Unconditional' }
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

const MilestonesTab = ({ project, customTitle }) => {
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [rescheduleModal, setRescheduleModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
    const [viewModal, setViewModal] = useState({ visible: false, data: null });

    const [createMilestone, { isLoading: isCreating }] = useCreateMilestoneMutation();
    const [updateMilestone, { isLoading: isUpdating }] = useUpdateMilestoneMutation();
    const [deleteMilestone, { isLoading: isDeleting }] = useDeleteMilestoneMutation();

    const isSubmitting = isCreating || isUpdating || isDeleting;

    const dispatchMilestoneEvent = (eventType, milestoneId) => {
        window.dispatchEvent(new CustomEvent(eventType, {
            detail: { milestoneId, projectId: project?.id }
        }));
    };

    const handleAdd = () => {
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (milestone) => {
        setFormModal({ visible: true, data: milestone });
    };

    const handleReschedule = (milestone) => {
        const milestoneWithCount = {
            ...milestone,
            reschedule_count: milestone.reschedule_count || 0
        };
        setRescheduleModal({ visible: true, data: milestoneWithCount });
    };

    const handleDelete = (milestone) => {
        setDeleteModal({ visible: true, data: milestone });
    };

    const handleSelectMilestone = (milestone) => {
        setSelectedMilestone(milestone);
    };

    const handleView = (milestone) => {
        setViewModal({ visible: true, data: milestone });
    };

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };

    const handleRescheduleModalCancel = () => {
        setRescheduleModal({ visible: false, data: null });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ visible: false, data: null });
    };

    const handleBulkDeleteCancel = () => {
        setBulkDeleteModal({ visible: false, ids: [] });
    };

    const handleViewModalClose = () => {
        setViewModal({ visible: false, data: null });
    };

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                const statusChangingToPending = formModal.data.status === 'Completed' && values.status === 'Pending';

                const statusChangingToCompleted = formModal.data.status !== 'Completed' && values.status === 'Completed';

                let updatedValues = { ...values };

                if (statusChangingToPending) {
                    const savedProgress = localStorage.getItem(`milestone_${formModal.data.id}_progress`);
                    if (savedProgress) {
                        updatedValues.progress_percent = parseFloat(savedProgress);
                    }
                }

                if (statusChangingToCompleted) {
                    localStorage.setItem(`milestone_${formModal.data.id}_progress`, formModal.data.progress_percent);
                    updatedValues.progress_percent = 100;
                }

                const response = await updateMilestone({
                    id: formModal.data.id,
                    data: updatedValues
                }).unwrap();

                message.success('Milestone updated successfully');
                dispatchMilestoneEvent('milestoneUpdated', formModal.data.id);
            } else {
                const response = await createMilestone(values).unwrap();
                message.success('Milestone created successfully');
                if (response && response.data && response.data.id) {
                    dispatchMilestoneEvent('milestoneUpdated', response.data.id);
                }
            }

            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to save milestone');
        }
    };

    const handleRescheduleSubmit = async (values) => {
        try {
            const currentCount = typeof rescheduleModal.data.reschedule_count === 'number' ?
                rescheduleModal.data.reschedule_count : 0;

            const updatedValues = {
                ...values,
                reschedule_count: currentCount + 1
            };

            const updatePayload = {
                id: rescheduleModal.data.id,
                data: updatedValues
            };

            await updateMilestone(updatePayload).unwrap();

            message.success('Milestone rescheduled successfully');
            dispatchMilestoneEvent('milestoneUpdated', rescheduleModal.data.id);
            setRescheduleModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to reschedule milestone');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteMilestone(deleteModal.data.id).unwrap();
            message.success('Milestone deleted successfully');
            dispatchMilestoneEvent('milestoneDeleted', deleteModal.data.id);
            setDeleteModal({ visible: false, data: null });
            if (selectedMilestone && selectedMilestone.id === deleteModal.data.id) {
                setSelectedMilestone(null);
            }
        } catch (error) {
            message.error('Failed to delete milestone');
        }
    };

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds && selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            if (!ids || ids.length === 0) {
                return;
            }

            const promises = ids.map(id => deleteMilestone(id).unwrap());
            await Promise.all(promises);

            message.success(`${ids.length} milestones deleted successfully`);
            dispatchMilestoneEvent('milestoneDeleted');

            setBulkDeleteModal({ visible: false, ids: [] });
        } catch (error) {
            message.error('Failed to delete milestones');
        }
    };

    const modalTitle = formModal.data ? 'Update Milestone' : 'Add Milestone';
    const moduleTitle = customTitle || 'Project Milestones';

    return (
        <div className="milestones-tab">
            <ModuleLayout
                title={moduleTitle}
                icon={<FiFlag />}
                onAddClick={handleAdd}
                className="milestones"
                contentClassName="milestones-content"
                addButtonText="Add Milestone"
                module="milestone"
                extraHeaderContent={<MilestoneFilter
                    paymentTypeFilter={paymentTypeFilter}
                    setPaymentTypeFilter={setPaymentTypeFilter}
                />}
            >
                <MilestoneList
                    project={project}
                    onEdit={handleEdit}
                    onReschedule={handleReschedule}
                    onDelete={handleDelete}
                    onSelect={handleSelectMilestone}
                    selectedMilestone={selectedMilestone}
                    onBulkDelete={handleBulkDelete}
                    paymentTypeFilter={paymentTypeFilter}
                    onView={handleView}
                />
            </ModuleLayout>

            <Modal
                title={<ModalTitle icon={<FiFlag />} title={modalTitle} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={600}
                className="milestone-form-modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <MilestoneForm
                    isSubmitting={isSubmitting}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    initialValues={formModal.data}
                    projectId={project?.id}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<FiFlag />} title="Reschedule Milestone" />}
                open={rescheduleModal.visible}
                onCancel={handleRescheduleModalCancel}
                footer={null}
                width={500}
                className="reschedule-modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <RescheduleForm
                    isSubmitting={isSubmitting}
                    onSubmit={handleRescheduleSubmit}
                    onCancel={handleRescheduleModalCancel}
                    initialValues={rescheduleModal.data}
                    projectId={project?.id}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Milestone" />}
                open={deleteModal.visible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
                className="delete-modal"
                maskClosable={false}
            >
                <p>Are you sure you want to delete this milestone?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Milestones" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
                okText="Delete All"
                cancelText="Cancel"
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
                className="delete-modal"
                maskClosable={false}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids?.length} milestones?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <MilestoneView
                milestone={viewModal.data}
                isLoading={false}
                visible={viewModal.visible}
                onClose={handleViewModalClose}
                project={project}
            />
        </div>
    );
};

export default MilestonesTab; 