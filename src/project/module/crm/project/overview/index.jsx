import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiFileText, FiUsers, FiEdit, FiFile, FiClipboard, FiDollarSign, FiFlag, FiList, FiActivity, FiClock, FiTool, FiCheck, FiAlertCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { useGetProjectQuery, useGetMilestonesQuery, useUpdateProjectMutation, useGetFiltersQuery, useGetMilestoneTasksQuery, useUpdateMilestoneMutation, useGetStagesQuery, useGetPipelinesQuery } from '../../../../../config/api/apiServices';
import ModuleOverview from '../../../../../components/ModuleOverview';
import GeneralTab from './general';
import MembersTab from './members';
import NotesTab from './notes';
import FilesTab from './files';
import AdditionalCostsTab from './additionalCosts';
import MilestonesTab from './milestones';
import TasksTab from './milestoneTasks';
import ActivitiesTab from './activities';
import FollowUpTab from './followup';
import getRole from '../../client/components/getRole';
import MaintenanceTab from './maintenance';
import { Badge, Space, message, Button, Modal, Select, Form, Typography, Divider, Row, Col, Progress, Alert } from 'antd';
import { ModalTitle } from '../../../../../components/AdvancedForm';
import ProjectForm from '../components/ProjectForm';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text, Paragraph } = Typography;

const ProjectOverview = () => {
    const { id: projectId } = useParams();
    const [activeTab, setActiveTab] = useState('general');
    const [componentKey, setComponentKey] = useState(0);
    const [isMilestonesCompleted, setIsMilestonesCompleted] = useState(false);
    const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [projectStatus, setProjectStatus] = useState('Pending');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    const [completedTasksCount, setCompletedTasksCount] = useState(0);
    const [totalTasksCount, setTotalTasksCount] = useState(0);
    const [unpaidMilestonesCount, setUnpaidMilestonesCount] = useState(0);
    const [totalMilestonesCount, setTotalMilestonesCount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);
    const [isIncompleteModalVisible, setIsIncompleteModalVisible] = useState(false);
    const [isForceCompleteModalVisible, setIsForceCompleteModalVisible] = useState(false);
    const [form] = Form.useForm();
    const role = getRole();
    const navigate = useNavigate();

    const { data: projectData, isLoading, error, refetch } = useGetProjectQuery(projectId, {
        skip: !projectId
    });

    const { data: milestonesData, isLoading: milestonesLoading } = useGetMilestonesQuery(
        { project_id: projectId },
        { skip: !projectId }
    );

    const { data: tasksData, isLoading: tasksLoading } = useGetMilestoneTasksQuery(
        {},  // Fetch all milestone tasks without filters
        { skip: !projectId }
    );

    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const statusOptions = filtersResponse?.data?.items?.filter(filter => filter.type === 'status') || [];

    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const pipelines = pipelinesResponse?.data?.items || [];

    const { data: stagesResponse } = useGetStagesQuery({ limit: 'all' });
    const allStages = stagesResponse?.data?.items || [];

    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
    const [updateMilestone] = useUpdateMilestoneMutation();

    useEffect(() => {
        if (projectId) {
            refetch();
        }
    }, [projectId, refetch]);

    useEffect(() => {
        if (projectData?.data) {
            setProjectStatus(projectData.data.status || 'Pending');
        }
    }, [projectData]);

    // Helper function to check if a milestone is paid
    const isMilestonePaid = (milestone) => {
        if (!milestone || !milestone.payment_status) return false;

        // Check for payment type - unconditional payments are always considered paid
        const isUnconditional = milestone.payment_type?.toLowerCase() === 'unconditional';

        // Check payment status - case insensitive check for various paid statuses
        const status = milestone.payment_status?.toLowerCase() || '';
        const isPaidStatus = status === 'fully paid' ||
            status === 'paid' ||
            status === 'complete' ||
            status === 'completed';

        // If it's an advance payment (unconditional) or has a paid status, consider it paid
        return isUnconditional || isPaidStatus;
    };

    // Helper function to calculate total paid amount from milestones
    const calculatePaidAmount = (milestones) => {
        if (!milestones || !Array.isArray(milestones)) return 0;

        return milestones.reduce((total, milestone) => {
            // Only add to total if milestone is paid
            if (isMilestonePaid(milestone) && milestone.payment_trigger_value) {
                return total + parseFloat(milestone.payment_trigger_value || 0);
            }
            return total;
        }, 0);
    };

    // Reset form when opening modal and analyze project status
    useEffect(() => {
        if (isStatusUpdateModalVisible && projectData?.data) {
            // Set current status
            const currentStatusId = projectData.data.status;
            form.setFieldValue('status', currentStatusId);
            setSelectedStatus(currentStatusId);

            // Analyze milestones
            if (milestonesData?.data?.items) {
                const milestones = milestonesData.data.items || [];

                // Use the helper function to identify unpaid milestones
                const unpaidMilestones = milestones.filter(milestone => !isMilestonePaid(milestone));

                setUnpaidMilestonesCount(unpaidMilestones.length);
                setTotalMilestonesCount(milestones.length);


            }

            // Analyze tasks - improved to work with all project tasks
            if (tasksData?.data?.items) {
                const allTasks = tasksData.data.items || [];

                // Get tasks only for this project by filtering through milestones
                const projectMilestoneIds = milestonesData?.data?.items?.map(m => m.id) || [];

                const projectTasks = allTasks.filter(task => {
                    const belongsToProject = projectMilestoneIds.includes(task.milestone_id);
                    return belongsToProject;
                });

                const pendingTasks = projectTasks.filter(task =>
                    task.status !== 'Completed'
                );

                const completedTasks = projectTasks.filter(task =>
                    task.status === 'Completed'
                );

                setPendingTasksCount(pendingTasks.length);
                setCompletedTasksCount(completedTasks.length);
                setTotalTasksCount(projectTasks.length);


            }
        }
    }, [isStatusUpdateModalVisible, projectData, milestonesData, tasksData, form]);

    useEffect(() => {
        // Check if total milestone amount equals project value
        if (projectData?.data && milestonesData?.data?.items) {
            const projectValue = parseFloat(projectData.data.projectValue || 0);

            // Calculate total milestone amount
            let totalMilestoneAmount = 0;
            const milestones = milestonesData.data.items || [];

            if (milestones.length === 0) {
                setIsMilestonesCompleted(false);
                setPaidAmount(0);
                setRemainingAmount(projectValue);
                return;
            }

            // Use the helper function to check if all milestones are paid
            const allPaid = milestones.every(milestone => isMilestonePaid(milestone));

            // Calculate total milestone amount
            milestones.forEach(milestone => {
                if (milestone.payment_trigger_value) {
                    totalMilestoneAmount += parseFloat(milestone.payment_trigger_value);
                }
            });

            // Calculate paid amount
            const totalPaid = calculatePaidAmount(milestones);
            setPaidAmount(totalPaid);
            setRemainingAmount(projectValue - totalPaid);

            // Check if they are equal (with a small tolerance for floating point errors)
            const amountsMatch = Math.abs(totalMilestoneAmount - projectValue) < 0.01;

            // Project is completed if milestones exist, all paid and total amount matches
            const isCompleted = allPaid && amountsMatch && milestones.length > 0;
            setIsMilestonesCompleted(isCompleted);


        }
    }, [projectData, milestonesData]);

    // Handle tab change
    const handleTabChange = (key) => {
        setActiveTab(key);
        setComponentKey(prevKey => prevKey + 1);
    };

    // Handle status update
    const handleStatusUpdate = () => {
        setIsStatusUpdateModalVisible(true);
    };

    // Status select change
    const handleStatusChange = (value) => {
        setSelectedStatus(value);
    };

    // Find status name from ID
    const getStatusName = (statusId) => {
        const status = statusOptions.find(s => s.id === statusId);
        return status ? status.name : statusId;
    };

    // Get status ID from name
    const getStatusId = (statusName) => {
        const status = statusOptions.find(s => s.name === statusName);
        return status ? status.id : null;
    };

    // Check if selected status is Completed
    const isSelectedStatusCompleted = () => {
        return getStatusName(selectedStatus) === 'Completed';
    };

    const handleMarkAsCompleted = async () => {
        try {
            if (!isMilestonesCompleted || pendingTasksCount > 0) {
                setIsIncompleteModalVisible(true);
            } else {
                await updateProjectStatus('Completed');
            }
        } catch (error) {
            message.error('Failed to mark project as completed');
        }
    };

    const handleIncompleteModalOk = async () => {
        try {
            await updateProjectStatus('Completed');
            setIsIncompleteModalVisible(false);
        } catch (error) {
            message.error('Failed to mark project as completed');
        }
    };

    const handleForceCompleteClick = () => {
        setIsForceCompleteModalVisible(true);
    };

    // Function to actually perform force completion
    const handleForceComplete = async () => {
        try {
            // Show loading message
            const loadingKey = 'forceComplete';
            message.loading({ content: 'Force completing project...', key: loadingKey, duration: 0 });

            // Step 1: Complete all milestones and their tasks
            if (milestonesData?.data?.items) {
                const milestones = milestonesData.data.items || [];
                const projectValue = parseFloat(projectData?.data?.projectValue || 0);

                // First complete all milestones
                for (const milestone of milestones) {
                    if (!isMilestonePaid(milestone)) {
                        try {
                            // Update milestone to completed status and paid
                            const updateData = {
                                status: 'Completed',
                                payment_status: 'Fully Paid',
                                progress_percent: 100
                            };

                            // Set payment trigger value based on payment trigger type
                            if (milestone.payment_trigger_type === '%') {
                                // If percentage type, set to 100% of milestone's allocated percentage
                                updateData.payment_trigger_value = '100';
                            } else if (milestone.payment_trigger_type === 'fixed_amount') {
                                // For fixed amount, use the original value or project value if not set
                                updateData.payment_trigger_value = milestone.payment_trigger_value || projectValue.toString();
                            }

                            await updateMilestone({
                                id: milestone.id,
                                data: updateData
                            }).unwrap();


                        } catch (error) {
                            console.error(`Error completing milestone ${milestone.id}:`, error);
                        }
                    }
                }

                // Refresh milestones data
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to allow backend to process

                // Force refresh the paid amount by refetching milestones
                const refreshedMilestonesResponse = await refetch();
                setPaidAmount(projectValue);
                setRemainingAmount(0);
            }

            // Step 2: Update project status
            await updateProject({
                id: projectId,
                data: {
                    status: getStatusId('Completed'),
                    force_completed: true // Add flag to indicate this was force completed
                }
            }).unwrap();

            // Success message and cleanup
            message.success({ content: 'Project has been force completed!', key: loadingKey, duration: 2 });
            setProjectStatus(getStatusId('Completed'));
            setIsStatusUpdateModalVisible(false);

            // Refresh all data
            refetch();
        } catch (error) {
            message.error('Failed to force complete the project');
            console.error('Force completion error:', error);
        }
    };

    const handleForceCompleteModalOk = async () => {
        try {
            await handleForceComplete();
            setIsForceCompleteModalVisible(false);
        } catch (error) {
            message.error('Failed to force complete the project');
        }
    };

    // New helper function to update project status
    const updateProjectStatus = async (statusName) => {
        const statusId = getStatusId(statusName);
        if (!statusId) {
            message.error(`Status "${statusName}" not found`);
            return;
        }

        await updateProject({
            id: projectId,
            data: {
                status: statusId
            }
        }).unwrap();

        message.success(`Project status updated to ${statusName}`);
        setProjectStatus(statusId);
        setIsStatusUpdateModalVisible(false);
        refetch();
    };

    // Modified confirmation function for non-completed statuses
    const handleStatusUpdateConfirm = async () => {
        try {
            const values = await form.validateFields();

            // If the selected status is "Completed", we handle it with specialized functions
            if (getStatusName(values.status) === 'Completed') {
                return; // Don't do anything, the buttons handle this case
            }

            await updateProject({
                id: projectId,
                data: {
                    status: values.status
                }
            }).unwrap();

            const statusName = getStatusName(values.status);
            message.success(`Project status updated to ${statusName}`);
            setProjectStatus(values.status);
            setIsStatusUpdateModalVisible(false);
            refetch();
        } catch (error) {
            message.error('Failed to update project status');
        }
    };

    const project = projectData?.data;

    const handleEditProject = () => {
        setIsEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
    };

    const handleEditSubmit = async (values) => {
        try {
            await updateProject({
                id: projectId,
                data: values
            }).unwrap();

            message.success('Project updated successfully');
            setIsEditModalVisible(false);
            refetch();
        } catch (error) {
            message.error('Failed to update project');
        }
    };

    // Create header actions for ModuleOverview
    const headerActions = [
        {
            label: "",
            onClick: () => navigate(`/${role}/project`),
            icon: <ArrowLeftOutlined />,
            type: "default",
            className: "btn btn-icon btn-secondary"
        },
        {
            label: "",
            onClick: handleEditProject,
            icon: <EditOutlined />,
            type: "default",
            className: "btn btn-icon btn-secondary"
        },
        {
            label: "Update Status",
            onClick: handleStatusUpdate,
            icon: <FiCheck />,
            type: "primary",
            className: "btn btn-status-update"
        }
    ];

    const allTabs = {
        general: {
            key: 'general',
            label: (
                <span className="tab-label">
                    <FiFileText />
                    <span>General</span>
                </span>
            ),
            children: <GeneralTab project={project} />
        },
        members: {
            key: 'members',
            label: (
                <span className="tab-label">
                    <FiUsers />
                    <span>Team</span>
                </span>
            ),
            children: <MembersTab project={project} />
        },
        milestones: {
            key: 'milestones',
            label: (
                <span className="tab-label">
                    <FiFlag />
                    <span>Milestones</span>
                </span>
            ),
            children: <MilestonesTab project={project} />
        },
        tasks: {
            key: 'tasks',
            label: (
                <span className="tab-label">
                    <FiList />
                    <span>Tasks</span>
                </span>
            ),
            children: <TasksTab project={project} />
        },
        maintenance: {
            key: 'maintenance',
            label: (
                <span className="tab-label">
                    <FiTool />
                    <span>Maintenance</span>
                </span>
            ),
            children: <MaintenanceTab project={project} />
        },
        additionalCosts: {
            key: 'additionalCosts',
            label: (
                <span className="tab-label">
                    <FiDollarSign />
                    <span>Additional Costs</span>
                </span>
            ),
            children: <AdditionalCostsTab key={`costs-tab-${componentKey}`} project={project} />
        },
        notes: {
            key: 'notes',
            label: (
                <span className="tab-label">
                    <FiEdit />
                    <span>Notes</span>
                </span>
            ),
            children: <NotesTab project={project} />
        },
        files: {
            key: 'files',
            label: (
                <span className="tab-label">
                    <FiFile />
                    <span>Files</span>
                </span>
            ),
            children: <FilesTab project={project} />
        },
       
        followup: {
            key: 'followup',
            label: (
                <span className="tab-label">
                    <FiClock />
                    <span>Follow-ups</span>
                </span>
            ),
            children: <FollowUpTab project={project} />
        },
        activities: {
            key: 'activities',
            label: (
                <span className="tab-label">
                    <FiActivity />
                    <span>Activities</span>
                </span>
            ),
            children: <ActivitiesTab project={project} />
        },
    };  

    const tabOrder = ['general', 'members', 'milestones', 'tasks', 'maintenance', 'additionalCosts', 'notes', 'files', 'followup', 'activities'];

    const tabItems = tabOrder.map(key => allTabs[key]);

    // Create a custom title component with the badge if milestones are completed or status is Completed
    const completedStatusId = statusOptions.find(s => s.name === 'Completed')?.id;
    const isProjectCompleted = projectStatus === completedStatusId ||
        projectStatus === 'Completed' ||
        getStatusName(projectStatus) === 'Completed';

    const titleWithBadge = (
        <Space align="center">
            {project?.projectTitle}
            {(isMilestonesCompleted || isProjectCompleted) && (
                <Badge
                    status="success"
                    text="Completed"
                    style={{
                        marginLeft: '10px',
                        fontSize: '14px',
                        fontWeight: 'normal'
                    }}
                />
            )}
        </Space>
    );

    return (
        <>
            <ModuleOverview
                key={`project-overview-${projectId}`}
                title={isMilestonesCompleted || isProjectCompleted ? titleWithBadge : project?.projectTitle}
                titleIcon={<FiClipboard />}
                tabItems={tabItems}
                isLoading={isLoading || milestonesLoading}
                error={error}
                data={project}
                backPath={`/${role}/project`}
                backText="Back to Projects"
                loadingText="Loading project information..."
                errorText="Error loading project information"
                emptyText="No project information available"
                className="project-overview-page"
                truncateTitle={!isMilestonesCompleted && !isProjectCompleted}
                titleMaxLength={40}
                onChange={handleTabChange}
                activeKey={activeTab}
                destroyInactiveTabPane={false}
                headerActions={headerActions}
            />

            <Modal
                title={<ModalTitle icon={<EditOutlined />} title="Edit Project" />}
                open={isEditModalVisible}
                onCancel={handleEditCancel}
                footer={null}
                width={800}
                centered
                maskClosable={false}
                destroyOnClose
                styles={{
                    content: {
                        background: 'var(--bg-primary)',
                        borderRadius: '10px'
                    }
                }}
            >
                {project && (
                    <ProjectForm
                        initialValues={project}
                        onSubmit={handleEditSubmit}
                        onCancel={handleEditCancel}
                        isSubmitting={isUpdating}
                        pipelines={pipelines}
                        stages={allStages}
                    />
                )}
            </Modal>

            <Modal
                title={<ModalTitle icon={<FiCheck />} title="Update Project Status" />}
                open={isStatusUpdateModalVisible}
                onCancel={() => setIsStatusUpdateModalVisible(false)}
                footer={null}
                className="convert-modal dark-theme-modal"
                centered
                maskClosable={false}
                styles={{
                    content: {
                        background: 'var(--bg-secondary)',
                        borderRadius: '10px'
                    }
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="status"
                        label={<span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Status <span style={{ color: 'var(--text-primary)' }}>*</span></span>}
                        rules={[{ required: true, message: 'Please select a status' }]}
                        style={{ marginBottom: '16px' }}
                    >
                        <Select
                            placeholder="Select Status"
                            onChange={handleStatusChange}
                            style={{ width: '100%' }}
                            size="large"
                            dropdownStyle={{ borderRadius: '8px', background: 'var(--bg-secondary)' }}
                            className="status-select dark-select"
                        >
                            {statusOptions.map(status => (
                                <Option key={status.id} value={status.id}>{status.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>

                {isSelectedStatusCompleted() && (
                    <>
                        <Divider style={{ margin: '16px 0' }} />

                        <div className="status-summary" style={{ marginBottom: '16px' }}>
                            <Paragraph>
                                <Text strong style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '12px', display: 'block' }}>
                                    Project Completion Summary:
                                </Text>
                            </Paragraph>

                            <div style={{
                                marginBottom: '16px',
                                fontSize: '14px',
                                padding: '12px',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '8px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <Text strong style={{ fontSize: '15px' }}>Milestones:</Text>
                                    <div>
                                        <Text
                                            style={{
                                                fontWeight: '600',
                                                fontSize: '15px',
                                                color: unpaidMilestonesCount > 0 ? 'var(--text-warning)' : 'var(--text-success)'
                                            }}
                                        >
                                            {totalMilestonesCount === 0 ? 'No milestones found' : `${totalMilestonesCount - unpaidMilestonesCount} paid`}
                                        </Text>
                                    </div>
                                </div>

                                <Progress
                                    percent={totalMilestonesCount > 0 ? Math.round(((totalMilestonesCount - unpaidMilestonesCount) / totalMilestonesCount) * 100) : 0}
                                    status={unpaidMilestonesCount > 0 ? "exception" : "success"}
                                    showInfo={false}
                                    strokeColor={unpaidMilestonesCount > 0 ? 'var(--text-warning)' : 'var(--text-success)'}
                                />

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '12px',
                                    padding: '8px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>Project Value:</Text>
                                        <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
                                            ₹{projectData?.data?.projectValue?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>Paid Amount:</Text>
                                        <div style={{
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            color: paidAmount > 0 ? 'var(--text-success)' : 'var(--text-primary)'
                                        }}>
                                            ₹{paidAmount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>Remaining:</Text>
                                        <div style={{
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            color: remainingAmount > 0 ? 'var(--text-warning)' : 'var(--text-success)'
                                        }}>
                                            ₹{remainingAmount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                fontSize: '14px',
                                padding: '12px',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '8px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <Text strong style={{ fontSize: '15px' }}>Tasks:</Text>
                                    <div>
                                        {totalTasksCount > 0 ? (
                                            <Text
                                                style={{
                                                    fontWeight: '600',
                                                    fontSize: '15px',
                                                    color: pendingTasksCount > 0 ? 'var(--text-warning)' : 'var(--text-success)'
                                                }}
                                            >
                                                {completedTasksCount}/{totalTasksCount} completed
                                            </Text>
                                        ) : (
                                            <Text type="secondary">No tasks found</Text>
                                        )}
                                    </div>
                                </div>

                                {totalTasksCount > 0 && (
                                    <Progress
                                        percent={Math.round((completedTasksCount / totalTasksCount) * 100)}
                                        status={pendingTasksCount > 0 ? "exception" : "success"}
                                        showInfo={false}
                                        strokeColor={pendingTasksCount > 0 ? 'var(--text-warning)' : 'var(--text-success)'}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Only show warning when something is incomplete */}
                        {(!isMilestonesCompleted || pendingTasksCount > 0) && (
                            <div className="warning-section" style={{
                                marginTop: '16px',
                                marginBottom: '20px',
                                padding: '16px',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '8px',
                                border: '1px solid rgba(250, 173, 20, 0.3)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ marginTop: '2px' }}>
                                        <FiAlertCircle size={20} color="var(--text-warning)" />
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: '15px', color: 'var(--text-warning)', display: 'block', marginBottom: '8px' }}>
                                            Warning: Incomplete Project
                                        </Text>
                                        <ul style={{
                                            margin: '0',
                                            padding: '0 0 0 16px',
                                            fontSize: '14px',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {!isMilestonesCompleted && (
                                                <li style={{ marginBottom: '4px' }}>
                                                    Not all milestones are paid or the total doesn't match the project value
                                                </li>
                                            )}
                                            {pendingTasksCount > 0 && (
                                                <li>
                                                    There are still <Text strong>{pendingTasksCount}</Text> pending tasks
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Only show success alert when everything is complete */}
                        {isMilestonesCompleted && pendingTasksCount === 0 && (
                            <div className="success-section" style={{
                                marginTop: '16px',
                                marginBottom: '20px',
                                padding: '16px',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '8px',
                                border: '1px solid var(--text-success)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ marginTop: '2px' }}>
                                        <FiCheckCircle size={20} color="var(--text-success)" />
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: '15px', color: 'var(--text-success)', display: 'block', marginBottom: '8px' }}>
                                            Ready to Complete
                                        </Text>
                                        <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                                            {totalTasksCount > 0
                                                ? "All milestones are paid and all tasks are completed."
                                                : "All milestones are paid. No tasks are assigned to this project."
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Row gutter={16} style={{ marginTop: '24px' }}>
                            <Col span={(!isMilestonesCompleted || pendingTasksCount > 0) ? 12 : 24}>
                                <Button
                                    block
                                    type="primary"
                                    onClick={handleMarkAsCompleted}
                                    style={{
                                        background: 'var(--text-success)',
                                        borderColor: 'var(--text-success)',
                                        height: '44px',
                                        fontWeight: '500',
                                        fontSize: '15px',
                                        borderRadius: '6px'
                                    }}
                                    icon={<FiCheck style={{ marginRight: '6px' }} />}
                                >
                                    Mark as Completed
                                </Button>
                            </Col>
                            {(!isMilestonesCompleted || pendingTasksCount > 0) && (
                                <Col span={12}>
                                    <Button
                                        block
                                        type="primary"
                                        danger
                                        onClick={handleForceCompleteClick}
                                        style={{
                                            height: '44px',
                                            fontWeight: '500',
                                            fontSize: '15px',
                                            borderRadius: '6px'
                                        }}
                                        icon={<FiAlertTriangle style={{ marginRight: '6px' }} />}
                                    >
                                        Force Complete
                                    </Button>
                                </Col>
                            )}
                        </Row>
                    </>
                )}

                {!isSelectedStatusCompleted() && (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            onClick={() => setIsStatusUpdateModalVisible(false)}
                            style={{
                                marginRight: '10px',
                                height: '40px',
                                fontWeight: '500',
                                fontSize: '14px',
                                padding: '0 24px',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleStatusUpdateConfirm}
                            loading={isUpdating}
                            style={{
                                background: 'var(--primary-color)',
                                borderColor: 'var(--primary-color)',
                                height: '40px',
                                fontWeight: '500',
                                fontSize: '14px',
                                padding: '0 24px'
                            }}
                        >
                            Update Status
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Incomplete Project Modal */}
            <Modal
                title={<ModalTitle icon={<FiAlertCircle />} title="Incomplete Project" />}
                open={isIncompleteModalVisible}
                onOk={handleIncompleteModalOk}
                onCancel={() => setIsIncompleteModalVisible(false)}
                okText="Yes, Complete"
                cancelText="Cancel"
                className="convert-modal dark-theme-modal"
                centered
                maskClosable={false}
                styles={{
                    content: {
                        background: 'var(--bg-primary)',
                        borderRadius: '10px'
                    }
                }}
                okButtonProps={{
                    style: { background: 'var(--text-primary)', borderColor: 'var(--text-primary)' }
                }}
            >
                <div style={{ color: 'var(--text-primary)' }}>
                    <p>This project has incomplete milestones or pending tasks. Are you sure you want to mark it as completed?</p>
                </div>
            </Modal>

            {/* Force Complete Modal */}
            <Modal
                title={<ModalTitle icon={<FiAlertTriangle />} title="Force Complete Project" />}
                open={isForceCompleteModalVisible}
                onOk={handleForceCompleteModalOk}
                onCancel={() => setIsForceCompleteModalVisible(false)}
                okText="Yes, Force Complete"
                cancelText="Cancel"
                className="convert-modal dark-theme-modal"
                centered
                maskClosable={false}
                styles={{
                    content: {
                        background: 'var(--bg-primary)',
                        borderRadius: '10px'
                    }
                }}
                okButtonProps={{
                    style: { background: 'var(--text-error)', borderColor: 'var(--text-error)' }
                }}
            >
                <div style={{ color: 'var(--text-primary)' }}>
                    <p>You are about to force complete this project despite having unpaid milestones or pending tasks.</p>
                    <p>This action cannot be undone. Are you sure you want to proceed?</p>

                    <div style={{ marginTop: '20px' }}>
                        <Text strong style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>
                            Project Completion Summary:
                        </Text>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '16px'
                        }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: '13px' }}>Project Value:</Text>
                                <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
                                    ₹{projectData?.data?.projectValue?.toLocaleString() || '0'}
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '13px' }}>Paid Amount:</Text>
                                <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-success)' }}>
                                    ₹{projectData?.data?.projectValue?.toLocaleString() || '0'}
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '13px' }}>Remaining:</Text>
                                <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-success)' }}>
                                    ₹0
                                </div>
                            </div>
                        </div>

                        <Alert
                            message="All milestones will be marked as completed and fully paid."
                            type="warning"
                            showIcon
                            style={{ marginBottom: '10px' }}
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ProjectOverview; 