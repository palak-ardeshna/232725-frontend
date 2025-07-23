import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row } from 'antd';
import {
    useGetClientsQuery,
    useGetPipelinesQuery,
    useGetStagesQuery,
    useGetFiltersQuery,
    useGetMilestonesQuery,
    useGetMilestoneTasksQuery,
    useGetTeamMembersQuery,
    useGetEmployeesQuery
} from '../../../../../../config/api/apiServices';
import GeneralDetailsTab from '../../../../../../components/GeneralDetailsTab';
import MilestoneList from '../milestones/components/MilestoneList';
import TaskList from '../milestoneTasks/components/TaskList';
import StatsCards from './components/StatsCards';
import ProjectProgressBar from './components/ProjectProgressBar';

import TaskPriorityChart from './components/TaskPriorityChart';
import TaskStatusChart from './components/TaskStatusChart';
import ProjectTimelineChart from './components/ProjectTimelineChart';
import MilestoneStatusChart from './components/MilestoneStatusChart';
import ProjectCostsTable from './components/ProjectCostsTable';
import moment from 'moment';
import './general.scss';
import MilestonePaymentTypeChart from './components/MilestonePaymentTypeChart';

const GeneralTab = ({ project }) => {
    const navigate = useNavigate();
    const [clientData, setClientData] = useState(null);

    // API Queries
    const { data: clientResponse } = useGetClientsQuery(
        { id: project?.client },
        { skip: !project?.client }
    );

    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const { data: stagesResponse } = useGetStagesQuery({ limit: 'all' });
    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const { data: milestonesData } = useGetMilestonesQuery(
        { project_id: project?.id, limit: 'all' },
        { skip: !project?.id }
    );
    const {
        data: tasksData,
        isLoading: isTasksLoading,
        refetch: refetchTasks
    } = useGetMilestoneTasksQuery({}, { skip: false });
    const { data: teamMembersData, isLoading: isLoadingTeamMembers } = useGetTeamMembersQuery({ limit: 'all' }, {});
    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({ limit: 'all' }, {});

    // Process Data
    const allTeamMembers = teamMembersData?.data?.items || [];
    const allEmployees = employeesData?.data?.items || [];
    const availableMilestones = milestonesData?.data?.items || [];
    const pipelines = pipelinesResponse?.data?.items || [];
    const stages = stagesResponse?.data?.items || [];
    const filters = filtersResponse?.data?.items || [];

    const sources = filters.filter(filter => filter.type === 'source');
    const categories = filters.filter(filter => filter.type === 'category');
    const statuses = filters.filter(filter => filter.type === 'status');

    const pipelineName = pipelines.find(p => p.id === project?.pipeline)?.name || 'Not Assigned';
    const stageName = stages.find(s => s.id === project?.stage)?.name || 'Not Assigned';
    const sourceName = sources.find(s => s.id === project?.source)?.name || 'Not Specified';
    const categoryName = categories.find(c => c.id === project?.category)?.name || 'Uncategorized';
    const statusObj = statuses.find(s => s.id === project?.status);

    // Milestone Data Processing
    const milestoneData = useMemo(() => {
        const milestones = milestonesData?.data?.items || [];
        const upcomingMilestones = milestones
            .filter(m => m.status !== 'Completed')
            .sort((a, b) => moment(a.due_date).diff(moment(b.due_date)))
            .slice(0, 5);

        return {
            milestones: upcomingMilestones,
            total: milestones.length,
            completed: milestones.filter(m => m.status === 'Completed').length,
            paid: milestones
                .filter(m => m.payment_status === 'Fully Paid' || m.payment_status === 'Paid')
                .reduce((sum, m) => sum + (parseFloat(m.payment_trigger_value) || 0), 0)
        };
    }, [milestonesData]);

    // Task Data Processing
    const taskData = useMemo(() => {
        const tasks = tasksData?.data?.items || [];
        const projectTasks = tasks.filter(task => {
            const milestone = milestonesData?.data?.items?.find(m => m.id === task.milestone_id);
            return milestone && milestone.project_id === project?.id;
        });

        const upcomingTasks = projectTasks
            .filter(task => task.status !== 'Completed')
            .sort((a, b) => {
                const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                const priorityDiff = (priorityOrder[b.priority || 'Medium'] || 2) - (priorityOrder[a.priority || 'Medium'] || 2);
                return priorityDiff !== 0 ? priorityDiff : moment(a.due_date).diff(moment(b.due_date));
            })
            .slice(0, 5);

        return {
            tasks: upcomingTasks,
            total: projectTasks.length,
            completed: projectTasks.filter(t => t.status === 'Completed').length,
            allTasks: projectTasks
        };
    }, [tasksData, milestonesData, project?.id]);

    // Additional Costs Processing
    const additionalCosts = useMemo(() => {
        if (!project?.additionalCosts) return [];

        try {
            let costs = typeof project.additionalCosts === 'string'
                ? JSON.parse(project.additionalCosts)
                : project.additionalCosts;

            return costs
                .filter(cost => cost && cost.name && cost.amount)
                .map(cost => ({
                    ...cost,
                    key: `${cost.name}-${cost.date}`,
                    amount: parseFloat(cost.amount),
                    date: cost.date || new Date().toISOString()
                }))
                .sort((a, b) => moment(b.date).diff(moment(a.date)))
                .slice(0, 5);
        } catch (e) {
            return [];
        }
    }, [project?.additionalCosts]);

    // Financial Data Processing
    const financialData = useMemo(() => {
        const totalValue = parseFloat(project?.projectValue) || 0;

        // Calculate paid amount by checking each milestone's payment type and value
        let paidAmount = 0;
        let duringProgressAmount = 0;
        const milestones = milestonesData?.data?.items || [];

        milestones.forEach(milestone => {
            const amount = milestone.payment_trigger_type === '%'
                ? (parseFloat(milestone.payment_trigger_value) || 0) * totalValue / 100
                : parseFloat(milestone.payment_trigger_value) || 0;

            // Calculate paid amount
            if (milestone.payment_status === 'Fully Paid' || milestone.payment_type === 'unconditional') {
                paidAmount += amount;
            }
            // Calculate during progress amount
            else if (milestone.payment_request_stage === 'during_progress' &&
                milestone.status !== 'Completed' &&
                milestone.payment_type === 'conditional') {
                duringProgressAmount += amount;
            }
        });

        const pendingAmount = totalValue - paidAmount;
        const additionalCostsTotal = additionalCosts.reduce(
            (sum, cost) => sum + (parseFloat(cost.amount) || 0), 0
        );

        // Calculate percentages for display
        const paidPercentage = totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 0;
        const duringProgressPercentage = totalValue > 0 ? Math.round((duringProgressAmount / totalValue) * 100) : 0;

        return {
            totalValue,
            paidAmount,
            pendingAmount,
            duringProgressAmount,
            additionalCostsTotal,
            formattedTotal: totalValue.toLocaleString('en-IN'),
            formattedPaid: paidAmount.toLocaleString('en-IN'),
            formattedPending: pendingAmount.toLocaleString('en-IN'),
            formattedDuringProgress: duringProgressAmount.toLocaleString('en-IN'),
            formattedCosts: additionalCostsTotal.toLocaleString('en-IN'),
            paidPercentage,
            duringProgressPercentage
        };
    }, [project, milestonesData, additionalCosts]);

    // Client Data Effect
    useEffect(() => {
        if (clientResponse?.data?.items && clientResponse.data.items.length > 0) {
            const foundClient = clientResponse.data.items.find(c => c.id === project?.client);
            if (foundClient) setClientData(foundClient);
        } else if (clientResponse?.data) {
            setClientData(clientResponse.data);
        }
    }, [clientResponse, project?.client]);

    // Tasks Polling Effect
    // useEffect(() => {
    //     const pollingInterval = setInterval(refetchTasks, 10000);
    //     return () => clearInterval(pollingInterval);
    // }, [refetchTasks]);

    // Event Handlers
    const handleViewClient = () => {
        if (project?.client && clientData) {
            navigate(`/admin/crm/client/overview/${project.client}`, {
                state: { fromProjectId: project.id }
            });
        }
    };

    if (!project) return null;

    const enhancedProject = {
        ...project,
        status: statusObj ? statusObj.name : (project?.status || 'Active')
    };

    const classifications = {
        pipeline: pipelineName,
        stage: stageName,
        source: sourceName,
        category: categoryName,
        status: statusObj?.name || 'Active',
        pipelineName,
        stageName,
        sourceName,
        categoryName
    };

    return (
        <div className="project-general-tab">
            <ProjectProgressBar
                project={enhancedProject}
                milestones={availableMilestones}
                financialData={financialData}
            />

            <StatsCards
                milestoneData={{
                    total: milestoneData.total || 0,
                    completed: milestoneData.completed || 0,
                    paid: milestoneData.paid || 0
                }}
                taskData={{
                    total: taskData.total || 0,
                    completed: taskData.completed || 0
                }}
                financialData={financialData}
            />

            <GeneralDetailsTab
                data={enhancedProject}
                type="project"
                relatedData={clientData}
                classifications={classifications}
                onViewRelated={handleViewClient}
            />

            <div className="tables-section">
                <div className="table-section milestone-section">
                    <h5 className="section-title">Upcoming Milestones</h5>
                    <MilestoneList
                        project={project}
                        selectedMilestone={null}
                        paymentTypeFilter="all"
                        customMilestones={milestoneData.milestones}
                    />
                </div>

                <div className="table-section task-section">
                    <h5 className="section-title">Upcoming Tasks</h5>
                    <TaskList
                        project={project}
                        selectedMilestone={null}
                        isAllMilestones={true}
                        customTasks={taskData.tasks}
                        showOnlyUpcoming={true}
                    />
                </div>

                <ProjectCostsTable
                    project={project}
                    additionalCosts={additionalCosts}
                />
            </div>

            <Row gutter={[16, 16]} className="dashboard-charts-row">
                <TaskPriorityChart
                    tasks={taskData.allTasks}
                    totalTasks={taskData.total}
                    isLoading={isTasksLoading || isLoadingTeamMembers || isLoadingEmployees}
                />
                <TaskStatusChart
                    tasks={taskData.allTasks}
                    totalTasks={taskData.total}
                    isLoading={isTasksLoading || isLoadingTeamMembers || isLoadingEmployees}
                />
                <ProjectTimelineChart
                    milestones={availableMilestones}
                    totalMilestones={availableMilestones.length}
                    isLoading={false}
                    project={project}
                />
                <MilestoneStatusChart
                    milestones={availableMilestones}
                    totalMilestones={availableMilestones.length}
                    isLoading={false}
                />
                <MilestonePaymentTypeChart
                    milestones={availableMilestones}
                    totalMilestones={availableMilestones.length}
                    isLoading={false}
                />
            </Row>
        </div>
    );
};

export default GeneralTab; 