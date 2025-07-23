import React from 'react';
import { MdOutlineEmail, MdPhone, MdAccessTime } from 'react-icons/md';
import { FiFolder } from 'react-icons/fi';
import { Tag } from 'antd';
import ModuleCard from '../../../../../components/ModuleCard';

const ClientCard = ({ client, onEdit, onView, onDelete, projectCount = 0 }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const infoItems = [
        {
            icon: <MdOutlineEmail />,
            content: client.email
        },
        {
            icon: <MdPhone />,
            content: client.phone
        },
        {
            icon: <FiFolder />,
            content: (
                <Tag color={projectCount > 0 ? 'green' : 'default'} style={{ marginLeft: 5 }}>
                    {projectCount} Project{projectCount !== 1 ? 's' : ''}
                </Tag>
            )
        }
    ];

    const metaItems = [
        {
            icon: <MdAccessTime />,
            content: `Created ${formatDate(client.createdAt)}`
        },
        {
            icon: <MdAccessTime />,
            content: `Updated ${formatDate(client.updatedAt || client.createdAt)}`
        }
    ];

    return (
        <ModuleCard
            title={client.name}
            infoItems={infoItems}
            metaItems={metaItems}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            item={client}
            truncateTitle={true}
            module="client"
        />
    );
};

export default ClientCard; 