import React, { useMemo } from 'react';
import TaskList from '../../milestoneTasks/components/TaskList';
import { Typography } from 'antd';

const { Text } = Typography;

const ProjectTasksTable = ({ project }) => {
    const availableMilestones = project?.milestones || [];

    const customFields = useMemo(() => [
        {
            name: 'title',
            title: 'Title',
            sorter: true,
            render: (title) => (
                <div className="task-title">
                    <Text strong>{title}</Text>
                </div>
            )
        },
        {
            name: 'milestone_id',
            title: 'Milestone',
            sorter: true,
            render: (milestone_id) => {
                const milestone = availableMilestones.find(m => m.id.toString() === milestone_id?.toString());
                return milestone ? (
                    <div className="milestone-name">
                        <Text>{milestone.title}</Text>
                    </div>
                ) : '-';
            }
        }
    ], [availableMilestones]);

    return (
        <div className="table-section task-section">
            <h5 className="section-title">Upcoming Tasks</h5>
            <TaskList
                project={project}
                selectedMilestone={null}
                showOnlyUpcoming={true}
                customFields={customFields}
            />
        </div>
    );
};

export default ProjectTasksTable; 