import React, { useState, useEffect, useMemo } from 'react';
import { Badge, Empty, Spin, Typography, Avatar, message } from 'antd';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { BellOutlined } from '@ant-design/icons';
import {
    useGetMilestoneTasksQuery,
    useGetTeamMembersQuery,
    useGetEmployeesQuery,
    useCreateReminderMutation
} from '../../../../../../../config/api/apiServices';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils.jsx';
import ReminderModal from '../../../../../../../components/ReminderModal';
import moment from 'moment';

const { Text } = Typography;

const TaskList = ({
    project,
    selectedMilestone,
    onEdit,
    onDelete,
    onBulkDelete,
    customTasks,
    customFields,
    showOnlyUpcoming = false
}) => {
    const [reminderModal, setReminderModal] = useState({ visible: false, task: null });
    const [createReminder, { isLoading: isCreatingReminder }] = useCreateReminderMutation();

    const {
        data: specificMilestoneData,
        isLoading: isLoadingSpecific,
        refetch: refetchSpecific
    } = useGetMilestoneTasksQuery(
        { milestone_id: selectedMilestone },
        { skip: !selectedMilestone || customTasks }
    );

    const {
        data: allMilestonesData,
        isLoading: isLoadingAll,
        refetch: refetchAll
    } = useGetMilestoneTasksQuery(
        {},
        { skip: customTasks }
    );

    const {
        data: teamMembersData,
        isLoading: isLoadingTeamMembers
    } = useGetTeamMembersQuery(
        { limit: 'all' },
        {}
    );

    const {
        data: employeesData,
        isLoading: isLoadingEmployees
    } = useGetEmployeesQuery(
        { limit: 'all' },
        {}
    );

    const projectId = project?.id;

    const allTeamMembers = teamMembersData?.data?.items || [];
    const allUsers = employeesData?.data?.items || [];
    const availableMilestones = project?.milestones || [];

    const [teamMembers, setTeamMembers] = useState([]);

    // Team members processing effect
    useEffect(() => {
        const processedMembers = [];

        if (allUsers && allUsers.length > 0) {
            allUsers.forEach(user => {
                processedMembers.push({
                    id: user.id,
                    name: user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.username || 'Unnamed User'
                });
            });
        }

        if (allTeamMembers && allTeamMembers.length > 0) {
            allTeamMembers.forEach(team => {
                if (team.members) {
                    let memberIds = [];

                    if (typeof team.members === 'string') {
                        try {
                            memberIds = JSON.parse(team.members);
                        } catch (e) {
                            memberIds = [];
                        }
                    } else if (Array.isArray(team.members)) {
                        memberIds = team.members;
                    } else if (typeof team.members === 'object') {
                        memberIds = Object.keys(team.members);
                    }

                    memberIds.forEach(id => {
                        const existingMember = processedMembers.find(m => m.id.toString() === id.toString());
                        if (!existingMember) {
                            const memberName = team.members[id]?.name || `Member ${id}`;
                            processedMembers.push({
                                id: id,
                                name: memberName
                            });
                        }
                    });
                }
            });
        }

        const uniqueMembers = [];
        const memberIds = new Set();

        processedMembers.forEach(member => {
            if (!memberIds.has(member.id.toString())) {
                memberIds.add(member.id.toString());
                uniqueMembers.push(member);
            }
        });

        setTeamMembers(uniqueMembers);
    }, [allTeamMembers, allUsers]);

    // Tasks processing
    const tasks = useMemo(() => {
        if (customTasks) return customTasks;

        const allTasks = selectedMilestone ?
            (specificMilestoneData?.data?.items || []) :
            (allMilestonesData?.data?.items || []);

        let filteredTasks = allTasks;

        // Filter by project if needed
        if (project) {
            filteredTasks = filteredTasks.filter(task => {
                const milestone = availableMilestones.find(m => m.id === task.milestone_id);
                return milestone && milestone.project_id === project.id;
            });
        }

        // Filter only upcoming tasks if needed
        if (showOnlyUpcoming) {
            const today = moment();
            filteredTasks = filteredTasks
                .filter(task => task.status !== 'Completed' && moment(task.due_date).isAfter(today))
                .sort((a, b) => {
                    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    const priorityDiff = (priorityOrder[b.priority || 'Medium'] || 2) - (priorityOrder[a.priority || 'Medium'] || 2);
                    return priorityDiff !== 0 ? priorityDiff : moment(a.due_date).diff(moment(b.due_date));
                })
                .slice(0, 5);
        }

        return filteredTasks;
    }, [selectedMilestone, specificMilestoneData, allMilestonesData, project, availableMilestones, customTasks, showOnlyUpcoming]);

    const isLoading = customTasks ? false : (
        selectedMilestone ? isLoadingSpecific : isLoadingAll || isLoadingTeamMembers || isLoadingEmployees
    );

    // Polling effect
    useEffect(() => {
        if (!customTasks) {
            const pollingInterval = setInterval(() => {
                if (selectedMilestone) {
                    refetchSpecific();
                } else {
                    refetchAll();
                }
            }, 10000);

            return () => clearInterval(pollingInterval);
        }
    }, [selectedMilestone, refetchAll, refetchSpecific, customTasks]);

    // Initial fetch effect
    useEffect(() => {
        if (!customTasks) {
            if (selectedMilestone) {
                refetchSpecific();
            } else {
                refetchAll();
            }
        }
    }, [selectedMilestone, refetchAll, refetchSpecific, customTasks]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'var(--text-error)';
            case 'Medium': return 'var(--text-warning)';
            case 'Low': return 'var(--text-success)';
            default: return 'var(--text-primary)';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'var(--text-warning)';
            case 'In Progress': return 'var(--text-info)';
            case 'Completed': return 'var(--text-success)';
            default: return 'var(--text-primary)';
        }
    };

    const getTeamMemberName = (teamMemberId) => {
        if (!teamMemberId) return null;
        return teamMembers.find(m => m.id.toString() === teamMemberId.toString());
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const handleSetReminder = (task) => {
        setReminderModal({ visible: true, task });
    };

    const handleReminderSubmit = async (data) => {
        try {
            await createReminder(data).unwrap();
            // Assuming message is available globally or imported
            // message.success('Reminder set successfully'); 
            setReminderModal({ visible: false, task: null });
        } catch (error) {
            // Assuming message is available globally or imported
            // message.error('Failed to set reminder'); 
        }
    };

    const handleReminderCancel = () => {
        setReminderModal({ visible: false, task: null });
    };

    const defaultFields = [
        {
            name: 'title',
            title: 'Title',
            sorter: true,
            render: (title, record) => (
                <div className="task-title">
                    <Text strong>{title}</Text>
                </div>
            )
        },
        {
            name: 'assigned_to',
            title: 'Assigned To',
            sorter: true,
            render: (assigned_to) => {
                const member = getTeamMemberName(assigned_to);
                if (!member) {
                    return <span className="team-member"><Text className="no-assignment">Not assigned</Text></span>;
                }

                const name = member.name;
                return (
                    <div className="team-member">
                        <Avatar size="small" className="member-avatar" style={{ backgroundColor: 'var(--primary-color)', marginRight: '4px' }}>
                            {getInitials(name)}
                        </Avatar>
                        <Text className="member-name" style={{ marginLeft: '0' }}>{name}</Text>
                    </div>
                );
            },
            filters: teamMembers.map(member => ({
                text: member.name,
                value: member.id.toString()
            })),
            onFilter: (value, record) => {
                if (!record.assigned_to && !value) return true;
                if (!record.assigned_to) return false;
                return record.assigned_to.toString() === value.toString();
            }
        },
        {
            name: 'status',
            title: 'Status',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'In Progress', value: 'In Progress' },
                { text: 'Completed', value: 'Completed' }
            ],
            render: (status) => {
                if (!status) return '-';
                return <div className="status-container">
                    <Badge status="processing" color={getStatusColor(status)} />
                    <Text>{status}</Text>
                </div>;
            }
        },
        {
            name: 'priority',
            title: 'Priority',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'Low', value: 'Low' },
                { text: 'Medium', value: 'Medium' },
                { text: 'High', value: 'High' }
            ],
            render: (priority) => priority ? (
                <span style={{ fontWeight: '600', color: getPriorityColor(priority) }}>
                    {priority}
                </span>
            ) : '-',
            onFilter: (value, record) => record.priority === value
        },
        {
            name: 'due_date',
            title: 'Due Date',
            sorter: true,
            render: (date) => date ? moment(date).format('DD MMM YYYY') : '-'
        }
    ];

    const fields = customFields || defaultFields;

    const columns = generateColumns(fields);

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <FiEdit size={16} />,
            handler: onEdit,
            module: 'milestoneTask',
            permission: 'update'
        },
        {
            key: 'reminder',
            label: 'Set Reminder',
            icon: <BellOutlined />,
            handler: handleSetReminder,
            module: 'milestoneTask',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <FiTrash2 size={16} />,
            danger: true,
            handler: onDelete,
            module: 'milestoneTask',
            permission: 'delete'
        }
    ];

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
                <Text>Loading tasks...</Text>
            </div>
        );
    }

    if (!projectId) {
        return (
            <div className="empty-state">
                <Empty
                    description="No project selected"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    return (
        <>
            <div className="task-container">
                <div className="table-list">
                    <CommonTable
                        data={tasks.map((task, index) => ({ ...task, key: task.id || index }))}
                        columns={columns}
                        pagination={!showOnlyUpcoming}
                        extraProps={{
                            itemName: 'tasks',
                            className: 'task-table'
                        }}
                        searchableColumns={['title', 'status', 'priority']}
                        rowSelection={true}
                        onBulkDelete={onBulkDelete}
                        actionItems={actions}
                        module="milestoneTask"
                        locale={{
                            emptyText: (
                                <div className="empty-state">
                                    <Empty
                                        description={selectedMilestone ? "No tasks found for this milestone" : "No tasks found"}
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                </div>
                            )
                        }}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            <ReminderModal
                visible={reminderModal.visible}
                onCancel={handleReminderCancel}
                onSubmit={handleReminderSubmit}
                isSubmitting={isCreatingReminder}
                relatedId={reminderModal.task?.id}
                reminderType="task"
                title="Set Task Reminder"
                taskDueDate={reminderModal.task?.due_date}
                assignedTo={reminderModal.task?.assigned_to}
                taskName={reminderModal.task?.title}
                taskDescription={reminderModal.task?.description}
            />
        </>
    );
};

export default TaskList; 