import React, { useState, useEffect, useRef } from 'react';
import { Modal, message, Typography, Select } from 'antd';
import {
    useGetMilestonesQuery,
    useCreateMilestoneTaskMutation,
    useUpdateMilestoneTaskMutation,
    useDeleteMilestoneTaskMutation,
    useGetMilestoneTasksQuery
} from '../../../../../../config/api/apiServices';
import { FiList } from 'react-icons/fi';
import { DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const ModuleFilter = ({ selectedMilestone, handleMilestoneChange, milestones }) => {
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
            key: 'milestone',
            placeholder: 'All Active Milestones',
            value: selectedMilestone,
            onChange: (val) => {
                handleMilestoneChange(val);
                if (isMobileView) {
                    closeFilter();
                }
            },
            allowClear: false,
            options: [
                { key: 'all', value: 'all', label: 'All Active Milestones' },
                ...milestones.map(milestone => ({
                    key: milestone.id,
                    value: milestone.id,
                    label: milestone.title
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

const Tasks = ({ project }) => {
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [isAllMilestones, setIsAllMilestones] = useState(false);

    const projectId = project?.id;

    const {
        data: milestonesData,
        isLoading: isLoadingMilestones
    } = useGetMilestonesQuery(
        { project_id: projectId },
        { skip: !projectId }
    );

    const {
        refetch: refetchTasks
    } = useGetMilestoneTasksQuery(
        { milestone_id: selectedMilestone },
        { skip: !selectedMilestone || isAllMilestones }
    );

    const {
        refetch: refetchAllTasks
    } = useGetMilestoneTasksQuery(
        {},
        { skip: !isAllMilestones }
    );

    const [createTask, { isLoading: isCreating }] = useCreateMilestoneTaskMutation();
    const [updateTask, { isLoading: isUpdating }] = useUpdateMilestoneTaskMutation();
    const [deleteTask, { isLoading: isDeleting }] = useDeleteMilestoneTaskMutation();

    const isSubmitting = isCreating || isUpdating;
    const milestones = milestonesData?.data?.items || [];

    // Filter out completed and unconditional milestones
    const filteredMilestones = milestones.filter(milestone =>
        milestone.payment_type !== 'unconditional' && milestone.status !== 'Completed'
    );

    // Check if there are any active milestones
    const hasActiveMilestones = filteredMilestones.length > 0;

    useEffect(() => {
        if (filteredMilestones.length > 0 && !selectedMilestone) {
            setSelectedMilestone(filteredMilestones[0].id);
        }
    }, [filteredMilestones, selectedMilestone]);

    const handleAdd = () => {
        if (!hasActiveMilestones) {
            message.warning('Cannot add tasks. All milestones are completed. Please create a new milestone first.');
            return;
        }
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (task) => {
        setFormModal({ visible: true, data: task });
    };

    const handleDelete = (task) => {
        setDeleteModal({ visible: true, data: task });
    };

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ visible: false, data: null });
    };

    const handleBulkDeleteCancel = () => {
        setBulkDeleteModal({ visible: false, ids: [] });
    };

    const handleMilestoneChange = (value) => {
        if (value === 'all') {
            setIsAllMilestones(true);
            setSelectedMilestone(null);
        } else {
            setIsAllMilestones(false);
            setSelectedMilestone(value);
        }
    };

    const handleFormSubmit = async (values) => {
        try {
            if (!values.milestone_id) {
                message.error('Please select a milestone');
                return;
            }

            const taskData = {
                ...values,
                milestone_id: values.milestone_id.toString()
            };

            if (taskData.status === 'Completed' && !taskData.completion_date) {
                taskData.completion_date = dayjs().format('YYYY-MM-DD');
            }

            if (formModal.data) {
                try {
                    await updateTask({
                        id: formModal.data.id,
                        data: taskData
                    }).unwrap();

                    message.success('Task updated successfully');
                } catch (error) {
                    message.error(`Failed to update task: ${error.data?.message || 'Unknown error'}`);
                    return;
                }
            } else {
                try {
                    const result = await createTask(taskData).unwrap();

                    message.success('Task created successfully');

                    if (values.milestone_id !== selectedMilestone) {
                        setSelectedMilestone(values.milestone_id);
                        setIsAllMilestones(false);
                    }
                } catch (error) {
                    message.error(`Failed to create task: ${error.data?.message || 'Unknown error'}`);
                    return;
                }
            }

            if (isAllMilestones) {
                refetchAllTasks();
            } else {
                refetchTasks();
            }

            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to save task: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteTask(deleteModal.data.id).unwrap();
            message.success('Task deleted successfully');

            if (isAllMilestones) {
                refetchAllTasks();
            } else {
                refetchTasks();
            }

            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete task');
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

            const promises = ids.map(id => deleteTask(id).unwrap());
            await Promise.all(promises);

            message.success(`${ids.length} tasks deleted successfully`);

            if (isAllMilestones) {
                refetchAllTasks();
            } else {
                refetchTasks();
            }

            setBulkDeleteModal({ visible: false, ids: [] });
        } catch (error) {
            message.error('Failed to delete tasks');
        }
    };

    return (
        <div className="tasks-tab">
            <ModuleLayout
                title="Milestone Tasks"
                icon={<FiList />}
                onAddClick={handleAdd}
                className="tasks"
                contentClassName="tasks-content"
                showHeader={false}
                addButtonDisabled={!hasActiveMilestones}
                addButtonTooltip={!hasActiveMilestones ? 'All milestones are completed' : ''}
                extraHeaderContent={
                    <ModuleFilter
                        selectedMilestone={isAllMilestones ? 'all' : selectedMilestone}
                        handleMilestoneChange={handleMilestoneChange}
                        milestones={filteredMilestones}
                    />
                }
                module="milestoneTask"
            >
                <TaskList
                    isAllMilestones={isAllMilestones}
                    selectedMilestone={selectedMilestone}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                    project={{ ...project, milestones: filteredMilestones }}
                />

                <Modal
                    title={<ModalTitle icon={<FiList />} title={formModal.data ? 'Edit Task' : 'Add Task'} />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={600}
                    className="task-form-modal"
                    maskClosable={true}
                    destroyOnClose={true}
                >
                    <TaskForm
                        isSubmitting={isSubmitting}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        initialValues={formModal.data}
                        milestoneId={selectedMilestone}
                        milestones={filteredMilestones}
                        projectId={projectId}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Task" />}
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
                    <p>Are you sure you want to delete this task?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Tasks" />}
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
                    <p>Are you sure you want to delete {bulkDeleteModal.ids?.length} tasks?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default Tasks; 