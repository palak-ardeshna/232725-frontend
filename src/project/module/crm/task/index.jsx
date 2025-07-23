import React, { useState, useEffect, useCallback } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined, CalendarOutlined, BellOutlined } from '@ant-design/icons';
import { FaTasks } from 'react-icons/fa';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskView from './components/TaskView';
import CommonKanbanView from '../../../../components/CommonKanbanView';
import TaskCalendarPage from './components/TaskCalendarPage';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import { useTheme } from '../../../../common/theme/ThemeContext';
import ReminderModal from '../../../../components/ReminderModal';
import {
    useDeleteTaskMutation,
    useGetTasksQuery,
    useGetTaskQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useGetRolesQuery,
    useGetEmployeesQuery,
    useCreateReminderMutation,
    useGetDesignationsQuery
} from '../../../../config/api/apiServices';
import './task.scss';

const Task = () => {
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showCalendar, setShowCalendar] = useState(false);
    const { isDark, theme } = useTheme();

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [viewModal, setViewModal] = useState({ visible: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(0);
    const [fileDeleteStates, setFileDeleteStates] = useState({});
    const [reminderModal, setReminderModal] = useState({ visible: false, task: null });

    const taskStatuses = [
        { id: 'Pending', name: 'Pending', type: 'task' },
        { id: 'In Progress', name: 'In Progress', type: 'task' },
        { id: 'Completed', name: 'Completed', type: 'task' },
        { id: 'Cancelled', name: 'Cancelled', type: 'task' }
    ];

    const { data: response, isLoading: isLoadingTasks, isFetching } = useGetTasksQuery({
        limit: 'all'
    });

    const { data: employeeData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({
        limit: 'all'
    });

    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({
        limit: 'all'
    });

    const { data: designationsData, isLoading: isLoadingDesignations } = useGetDesignationsQuery({
        limit: 'all'
    });

    const { data: taskData, isLoading: isLoadingTask } = useGetTaskQuery(viewModal.id, {
        skip: !viewModal.id
    });

    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
    const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
    const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
    const { refetch: getTask } = useGetTaskQuery(viewModal.id, {
        skip: true
    });

    const [createReminder, { isLoading: isCreatingReminder }] = useCreateReminderMutation();

    const tasks = response?.data?.items || [];
    const allTasks = response?.data?.items || [];
    const task = taskData?.data;
    const total = response?.data?.total || 0;
    const employees = employeeData?.data?.items || [];
    const roles = rolesData?.data?.items || [];
    const designations = designationsData?.data?.items || [];

    const [userMap, setUserMap] = useState({});
    const [processedTasks, setProcessedTasks] = useState([]);

    useEffect(() => {
        if (employees && employees.length > 0) {
            const map = {};
            employees.forEach(employee => {
                map[employee.id] = employee.username;
                // Also map with employee_ prefix
                map[`employee_${employee.id}`] = employee.username;
            });
            setUserMap(map);
        }
    }, [employees]);

    useEffect(() => {
        if (allTasks.length > 0 && Object.keys(userMap).length > 0) {
            const processed = allTasks.map(task => ({
                ...task,
                contactOrClientName: userMap[task.assignedTo] || userMap[`employee_${task.assignedTo}`] || 'Unassigned'
            }));
            setProcessedTasks(processed);
        }
    }, [allTasks, userMap]);

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        if (showCalendar) {
            setShowCalendar(false);
        }
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (task) => {
        let attachments = task.attachments;
        if (typeof attachments === 'string') {
            try {
                attachments = JSON.parse(attachments);
            } catch (error) {
                attachments = [];
            }
        }

        if (!Array.isArray(attachments)) {
            attachments = attachments ? [attachments] : [];
        }

        const updatedTask = {
            ...task,
            description: task.description || "",
            attachments: attachments
        };

        if (task.description) {
            updatedTask.description = String(task.description);
        }

        if (task.status) {
            updatedTask.status = String(task.status);
        }

        setFormModal({ visible: true, data: updatedTask });
    };
    const handleView = (task) => setViewModal({ visible: true, id: task.id });
    const handleDelete = (task) => setDeleteModal({ visible: true, data: task });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleViewCancel = () => setViewModal({ visible: false, id: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleDeleteFile = async (file) => {
        try {
            if (!file || !file.fileUrl || !viewModal.id) {
                return false;
            }

            const fileKey = file.fileUrl || Math.random().toString();

            setFileDeleteStates(prev => ({
                ...prev,
                [fileKey]: true
            }));

            if (!task) {
                return false;
            }

            const formData = new FormData();

            if (task.taskName) {
                formData.append('taskName', task.taskName);
            }
            if (task.description) {
                formData.append('description', task.description);
            }
            if (task.status) {
                formData.append('status', task.status);
            }
            if (task.priority) {
                formData.append('priority', task.priority);
            }
            if (task.assignedTo) {
                formData.append('assignedTo', task.assignedTo);
            }
            if (task.startDate) {
                formData.append('startDate', task.startDate);
            }
            if (task.endDate) {
                formData.append('endDate', task.endDate);
            }

            formData.append('deleteFileUrl', file.fileUrl);

            let attachments = task.attachments;
            if (typeof attachments === 'string') {
                try {
                    attachments = JSON.parse(attachments);
                } catch (e) {
                    attachments = [];
                }
            }

            if (!Array.isArray(attachments)) {
                attachments = attachments ? [attachments] : [];
            }

            const remainingAttachments = attachments.filter(attachment => {
                const attachmentUrl = attachment.file_url || attachment.fileUrl;
                const deleteUrl = file.fileUrl;
                return attachmentUrl !== deleteUrl;
            });

            formData.append('attachments', JSON.stringify(remainingAttachments));

            await updateTask({
                id: viewModal.id,
                data: formData,
                isFormData: true
            }).unwrap();

            if (viewModal.id) {
                getTask();
            }

            return true;
        } catch (error) {
            return false;
        } finally {
            if (file && file.fileUrl) {
                const fileKey = file.fileUrl || Math.random().toString();
                setFileDeleteStates(prev => ({
                    ...prev,
                    [fileKey]: false
                }));
            }
        }
    };

    const handleFormSubmit = async (values) => {
        try {
            const isFormData = values instanceof FormData;
            let formData = isFormData ? values : new FormData();

            if (!isFormData) {
                if (values.startDate) {
                    // Check if startDate is a Moment object
                    if (values.startDate && typeof values.startDate.format === 'function') {
                        formData.append('startDate', values.startDate.format('YYYY-MM-DD'));
                    } else {
                        // If not a moment object, try to handle it differently
                        const startDate = new Date(values.startDate);
                        formData.append('startDate', startDate.toISOString().split('T')[0]);
                    }
                }
                if (values.endDate) {
                    // Check if endDate is a Moment object
                    if (values.endDate && typeof values.endDate.format === 'function') {
                        formData.append('endDate', values.endDate.format('YYYY-MM-DD'));
                    } else {
                        // If not a moment object, try to handle it differently
                        const endDate = new Date(values.endDate);
                        formData.append('endDate', endDate.toISOString().split('T')[0]);
                    }
                }
                if (values.taskName) {
                    formData.append('taskName', values.taskName);
                }
                if (values.description !== undefined) {
                    formData.append('description', values.description || '');
                }
                if (values.priority) {
                    formData.append('priority', values.priority);
                }
                if (values.status) {
                    formData.append('status', values.status);
                }
                if (values.assignedTo) {
                    formData.append('assignedTo', values.assignedTo);
                }
                if (values.relatedTo) {
                    formData.append('relatedTo', values.relatedTo);
                }
                if (values.statusNote) {
                    formData.append('statusNote', values.statusNote);
                }
                if (values.attachments && Array.isArray(values.attachments)) {
                    values.attachments.forEach(file => {
                        if (file.originFileObj) {
                            formData.append('attachments', file.originFileObj);
                        }
                    });
                }
            }

            if (formModal.data?.id) {
                await updateTask({ id: formModal.data.id, data: formData }).unwrap();
                message.success('Task updated successfully');
            } else {
                // Add required fields if they're missing
                if (!formData.get('priority')) {
                    formData.append('priority', 'Medium');
                }
                if (!formData.get('status')) {
                    formData.append('status', 'Pending');
                }

                console.log('Creating task with data:', Object.fromEntries(formData.entries()));
                await createTask(formData).unwrap();
                message.success('Task created successfully');
            }

            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(error.data?.message || 'Failed to save task');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteTask(deleteModal.data.id).unwrap();
            message.success('Task deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete task');
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
                    await deleteTask(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} task${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} task${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const handleSetReminder = (task) => {
        setReminderModal({ visible: true, task });
    };

    const handleReminderSubmit = async (data) => {
        try {
            await createReminder(data).unwrap();
            message.success('Reminder set successfully');
            setReminderModal({ visible: false, task: null });
        } catch (error) {
            message.error('Failed to set reminder');
        }
    };

    const handleReminderCancel = () => {
        setReminderModal({ visible: false, task: null });
    };

    const getContactOrClientName = useCallback((userId) => {
        return userMap[userId] || 'Unassigned';
    }, [userMap]);

    const isLoading = isLoadingTasks || isFetching || isLoadingEmployees || isLoadingRoles || isLoadingDesignations;
    const handleToggleCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    return (
        <div className="task-module">
            <ModuleLayout
                title="tasks"
                showViewToggle={true}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onAddClick={handleAdd}
                className="task"
                module="task"
                extraHeaderContent={
                    <button
                        className={`btn ${showCalendar ? 'btn-calendar-active' : 'btn-calendar'} ${isDark ? 'dark-mode' : ''}`}
                        onClick={handleToggleCalendar}
                        title="Calendar View"
                    >
                        <CalendarOutlined /> <span className="btn-text">Calendar</span>
                    </button>
                }
            >
                {showCalendar ? (
                    <TaskCalendarPage
                        tasks={tasks}
                        userMap={userMap}
                        isLoading={isLoadingTasks || isFetching}
                        users={employees}
                        roles={roles}
                        employees={employees}
                        designations={designations}
                    />
                ) : (
                    viewMode === 'list' ? (
                        <TaskList
                            tasks={tasks}
                            userMap={userMap}
                            isLoading={isLoadingTasks || isFetching}
                            viewMode={viewMode}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            total={total}
                            onPageChange={handlePageChange}
                            onEdit={handleEdit}
                            onView={handleView}
                            onDelete={handleDelete}
                            onBulkDelete={handleBulkDelete}
                            onSetReminder={handleSetReminder}
                            users={employees}
                            roles={roles}
                            employees={employees}
                            designations={designations}
                        />
                    ) : (
                        <CommonKanbanView
                            items={processedTasks.length > 0 ? processedTasks : allTasks}
                            isLoading={isLoading}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onViewItem={handleView}
                            stages={taskStatuses}
                            moduleType="task"
                            updateItemMutation={() => [updateTask, { isLoading: isUpdating }]}
                            updateStageMutation={() => [() => { }, { isLoading: false }]}
                            getContactOrClientName={getContactOrClientName}
                            titleField="taskName"
                            valueField="description"
                            contactOrClientField="assignedTo"
                            contactOrClientLabel="Assigned To"
                            disableColumnDrag={true}
                            users={employees}
                            roles={roles}
                            employees={employees}
                            designations={designations}
                        />
                    )
                )}

                <Modal
                    title={<ModalTitle icon={FaTasks} title={formModal.data ? 'Edit Task' : 'Add Task'} />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={800}
                    className="modal"
                    maskClosable={true}
                    destroyOnHidden={true}
                >
                    <TaskForm
                        key={formKey}
                        initialValues={formModal.data}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        users={employees}
                        roles={roles}
                        designations={designations}
                        isSubmitting={isCreating || isUpdating}
                    />
                </Modal>

                <TaskView
                    task={task}
                    userMap={userMap}
                    isLoading={isLoadingTask}
                    visible={viewModal.visible}
                    onClose={handleViewCancel}
                    onDeleteFile={handleDeleteFile}
                    fileDeleteStates={fileDeleteStates}
                    users={employees}
                    roles={roles}
                    designations={designations}
                />

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Task" />}
                    open={deleteModal.visible}
                    onOk={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    okText="Delete"
                    cancelText="Cancel"
                    className="delete-modal"
                    centered
                    okButtonProps={{ danger: true, loading: isDeleting }}
                >
                    <p>Are you sure you want to delete task "{deleteModal.data?.taskName}"?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Tasks" />}
                    open={bulkDeleteModal.visible}
                    onOk={handleBulkDeleteConfirm}
                    onCancel={handleBulkDeleteCancel}
                    okText="Delete All"
                    cancelText="Cancel"
                    className="delete-modal"
                    centered
                    okButtonProps={{ danger: true, loading: isDeleting }}
                >
                    <p>Are you sure you want to delete {bulkDeleteModal.ids.length} tasks?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <ReminderModal
                    visible={reminderModal.visible}
                    onCancel={handleReminderCancel}
                    onSubmit={handleReminderSubmit}
                    isSubmitting={isCreatingReminder}
                    reminderType="task"
                    relatedId={reminderModal.task?.id}
                    title={`Set Reminder for "${reminderModal.task?.taskName || 'Task'}"`}
                    taskDueDate={reminderModal.task?.endDate}
                    assignedTo={reminderModal.task?.assignedTo}
                    taskName={reminderModal.task?.taskName || ''}
                    taskDescription={reminderModal.task?.description || ''}
                />
            </ModuleLayout>
        </div>
    );
};

export default Task; 