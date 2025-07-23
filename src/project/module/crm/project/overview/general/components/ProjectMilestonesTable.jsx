import React from 'react';
import MilestoneList from '../../milestones/components/MilestoneList';

const ProjectMilestonesTable = ({ project }) => {
    return (
        <div className="table-section milestone-section">
            <h5 className="section-title">Upcoming Milestones</h5>
            <MilestoneList
                project={project}
                selectedMilestone={null}
                paymentTypeFilter="all"
            />
        </div>
    );
};

export default ProjectMilestonesTable; 