import React from 'react';
import CommonFollowUpTab from '../../../../../../components/CommonFollowUpTab';

const FollowUpTab = ({ lead, customTitle }) => {
    return (
        <CommonFollowUpTab 
            entity={lead}
            entityType="lead"
            customTitle={customTitle}
        />
    );
};

export default FollowUpTab;
