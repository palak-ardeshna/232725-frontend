import React from 'react';
import CommonFollowUpTab from '../../../../../../components/CommonFollowUpTab';

const FollowUpTab = ({ project }) => {
    return (
        <CommonFollowUpTab
            entity={project}
            entityType="project"
        />
    );
};

export default FollowUpTab;
