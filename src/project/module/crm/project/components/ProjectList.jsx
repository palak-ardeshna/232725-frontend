import React, { useEffect, useMemo, useState } from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Tooltip, Badge } from 'antd';
import { useGetFiltersQuery, useGetClientsQuery, useGetMilestonesQuery } from '../../../../../config/api/apiServices';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import FancyLoader from '../../../../../components/FancyLoader';
import getRole from '../../client/components/getRole';
import moment from 'moment';
import '../project.scss';

const truncateText = (text, maxLength = 25) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;

    return (
        <Tooltip title={text}>
            <span className="truncated-text">{text.substring(0, maxLength)}...</span>
        </Tooltip>
    );
};

const getPipelineName = (pipelineId, pipelines) => {
    if (!pipelineId) return "No Pipeline";
    const pipeline = pipelines.find(p => p.id === pipelineId);
    return pipeline ? pipeline.name : "No Pipeline";
};

const getStageName = (stageId, stages) => {
    if (!stageId) return "No Stage";
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : "No Stage";
};

const renderPipelineStageInfo = (project, pipelines, stages) => {
    const pipelineName = getPipelineName(project.pipeline, pipelines);
    const stageName = getStageName(project.stage, stages);
    return (
        <div className="pipeline-stage-info">
            <div className="pipeline-name">{truncateText(pipelineName || "No Pipeline", 20)}</div>
            <div className="stage-name">{truncateText(stageName || "No Stage", 20)}</div>
        </div>
    );
};

const ProjectList = ({
    projects = [],
    isLoading,
    viewMode,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onView,
    onBulkDelete,
    sources = [],
    categories = [],
    pipelines = [],
    stages = [],
    selectedPipeline,
    actionItems // Add this prop
}) => {
    const navigate = useNavigate();
    const role = getRole();
    const projectsRef = React.useRef(projects);
    const [projectsWithMilestones, setProjectsWithMilestones] = useState([]);

    useEffect(() => {
        if (projects && projects.length > 0) {
            projectsRef.current = projects;
        }
    }, [projects]);

    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const { data: clientsResponse } = useGetClientsQuery({ limit: 'all' });
    const { data: milestonesResponse } = useGetMilestonesQuery({ limit: 'all' });

    const filters = filtersResponse?.data?.items || [];
    const clients = clientsResponse?.data?.items || [];
    const milestones = milestonesResponse?.data?.items || [];
    const sourceFilters = filters.filter(filter => filter.type === 'source');
    const categoryFilters = filters.filter(filter => filter.type === 'category');
    const statusFilters = filters.filter(filter => filter.type === 'status');

    // Process projects to add milestone count
    useEffect(() => {
        if (projects.length > 0 && milestones.length > 0) {
            const enhancedProjects = projects.map(project => {
                // Count milestones for this project
                const projectMilestones = milestones.filter(milestone =>
                    milestone.project_id === project.id
                );

                // Count completed milestones
                const completedMilestones = projectMilestones.filter(milestone =>
                    milestone.status === 'Completed'
                );

                return {
                    ...project,
                    milestone_count: projectMilestones.length,
                    completed_milestones: completedMilestones.length,
                    pending_milestones: projectMilestones.length - completedMilestones.length
                };
            });

            setProjectsWithMilestones(enhancedProjects);
        } else {
            setProjectsWithMilestones(projects);
        }
    }, [projects, milestones]);

    const navigateToProjectDetails = (project) => {
        navigate(`/${role}/project/overview/${project.id}`);
    };

    const getSourceName = (sourceId) => {
        if (!sourceId) return null;
        const source = sourceFilters.find(s => s.id === sourceId);
        return source ? source.name : null;
    };

    const getCategoryName = (categoryId) => {
        if (!categoryId) return null;
        const category = categoryFilters.find(c => c.id === categoryId);
        return category ? category.name : null;
    };

    const getClientName = (clientId) => {
        if (!clientId) return null;
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : null; // Return null if client not found
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'var(--text-error)';
            case 'medium':
                return 'var(--text-warning)';
            case 'low':
                return 'var(--text-success)';
            default:
                return 'var(--text-primary)';
        }
    };

    const projectsToDisplay = useMemo(() => {
        if (selectedPipeline) {
            const filteredProjects = projectsWithMilestones.filter(project =>
                project.pipeline === selectedPipeline
            );
            return filteredProjects;
        }
        return projectsWithMilestones && projectsWithMilestones.length > 0 ?
            projectsWithMilestones : projectsRef.current;
    }, [projectsWithMilestones, selectedPipeline, projectsRef]);

    const fields = [
        {
            name: 'projectTitle',
            title: 'Title',
            render: (title, record) => (
                <div style={{ fontWeight: '600' }}>
                    {truncateText(title, 30)}
                </div>
            ),
            sorter: (a, b) => a.projectTitle.localeCompare(b.projectTitle)
        },
        {
            name: 'projectValue',
            title: 'Value',
            render: (value) => (
                <div className="inr-value formatted small">
                    {parseFloat(value).toLocaleString('en-IN')}
                </div>
            ),
            sorter: (a, b) => a.projectValue - b.projectValue
        },
        {
            name: 'startDate',
            title: 'Start Date',
            render: (date) => {
                if (!date) return '-';
                // Convert ISO date format to DD/MM/YYYY
                const dateObj = new Date(date);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                return `${day}/${month}/${year}`;
            },
            sorter: (a, b) => {
                if (!a.startDate && !b.startDate) return 0;
                if (!a.startDate) return 1;
                if (!b.startDate) return -1;
                return moment(a.startDate).diff(moment(b.startDate));
            }
        },
        {
            name: 'endDate',
            title: 'End Date',
            render: (date) => {
                if (!date) return '-';
                // Convert ISO date format to DD/MM/YYYY
                const dateObj = new Date(date);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                return `${day}/${month}/${year}`;
            },
            sorter: (a, b) => {
                if (!a.endDate && !b.endDate) return 0;
                if (!a.endDate) return 1;
                if (!b.endDate) return -1;
                return moment(a.endDate).diff(moment(b.endDate));
            }
        },
        {
            name: 'pipeline',
            title: 'Pipeline / Stage',
            render: (_, record) => renderPipelineStageInfo(record, pipelines, stages)
        },
        {
            name: 'client',
            title: 'Client',
            render: (clientId) => <span>{truncateText(getClientName(clientId), 25)}</span>,
            sorter: (a, b) => {
                const clientNameA = getClientName(a.client) || '';
                const clientNameB = getClientName(b.client) || '';
                return clientNameA.localeCompare(clientNameB);
            }
        },
        {
            name: 'milestones',
            title: 'Milestones',
            render: (_, record) => {
                // Get milestone counts
                const totalCount = record.milestone_count || 0;
                const pendingCount = record.pending_milestones || 0;

                return (
                    <div className="milestone-count">
                        <span className="count">
                            {totalCount}
                        </span>
                        {/* <span className="label">
                            {totalCount === 1 ? 'Milestone' : 'Milestones'}
                        </span> */}
                        {pendingCount > 0 && (
                            <span className="pending-tag">
                                {pendingCount} Pending
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            name: 'source',
            title: 'Source',
            render: (sourceId) => sourceId ? <span>{truncateText(getSourceName(sourceId), 20)}</span> : null,
            filters: sourceFilters.map(source => ({ text: source.name, value: source.id })),
            onFilter: (value, record) => record.source === value,
            filterSearch: true
        },
        {
            name: 'category',
            title: 'Category',
            render: (categoryId) => categoryId ? <span>{truncateText(getCategoryName(categoryId), 20)}</span> : null,
            filters: categoryFilters.map(category => ({ text: category.name, value: category.id })),
            onFilter: (value, record) => record.category === value,
            filterSearch: true
        },
        {
            name: 'priority',
            title: 'Priority',
            render: (priority) => priority ? (
                <span style={{ fontWeight: '600', color: getPriorityColor(priority) }}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
            ) : <span style={{ fontWeight: '600', color: getPriorityColor('medium') }}>Medium</span>,
            filters: [
                { text: 'High', value: 'high' },
                { text: 'Medium', value: 'medium' },
                { text: 'Low', value: 'low' }
            ],
            onFilter: (value, record) => record.priority === value,
            filterSearch: true
        },
        {
            name: 'status',
            title: 'Status',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'In Progress', value: 'In Progress' },
                { text: 'Completed', value: 'Completed' },
                { text: 'Overdue', value: 'Overdue' },
                { text: 'Active', value: 'Active' },
                { text: 'On Hold', value: 'On Hold' },
                { text: 'Inactive', value: 'Inactive' },
                { text: 'Cancelled', value: 'Cancelled' }
            ],
            render: (statusId, record) => {
                if (!statusId) return <Badge status="default" text="No Status" />;

                const status = statusFilters.find(s => s.id === statusId);
                if (!status) return <Badge status="default" text="Unknown" />;

                const statusName = status.name;
                let statusColor = "default";

                // Use standard Ant Design status colors for consistency
                switch (statusName.toLowerCase()) {
                    case 'completed':
                        statusColor = "success";
                        break;
                    case 'in progress':
                        statusColor = "processing";
                        break;
                    case 'pending':
                        statusColor = "warning";
                        break;
                    case 'cancelled':
                    case 'overdue':
                        statusColor = "error";
                        break;
                    case 'on hold':
                        statusColor = "warning";
                        break;
                    case 'active':
                        statusColor = "processing";
                        break;
                    case 'inactive':
                        statusColor = "default";
                        break;
                    default:
                        statusColor = "default";
                }

                if (statusName.toLowerCase() === 'completed') {
                    return (
                        <div className="status-with-tag">
                            <Badge status={statusColor} text={statusName} />
                            <div className="forced-tag">Forced</div>
                        </div>
                    );
                }

                return <Badge status={statusColor} text={statusName} />;
            }
        },
    ];

    const defaultActions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: onView,
            module: 'project',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'project',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'project',
            permission: 'delete'
        }
    ];

    const finalActions = actionItems || defaultActions;

    const columns = generateColumns(fields);

    if (isLoading && projectsToDisplay.length === 0) {
        return (
            <FancyLoader
                message="Loading your projects..."
                subMessage="Please wait while we prepare your data"
                subMessage2="This may take a few moments"
                processingText="PROCESSING"
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={projectsToDisplay}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} projects`,
                    showQuickJumper: true
                }}
                actionItems={finalActions}
                extraProps={{
                    itemName: 'projects',
                    className: 'project-table'
                }}
                searchableColumns={['projectTitle', 'client', 'source', 'category']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="project"
                onRowClick={navigateToProjectDetails}
            />
        </div>
    );
};

export default React.memo(ProjectList);