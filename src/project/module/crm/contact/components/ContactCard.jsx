import React from 'react';
import { MdOutlineEmail, MdPhone, MdAccessTime } from 'react-icons/md';
import { FiTarget } from 'react-icons/fi';
import { Tag } from 'antd';
import ModuleCard from '../../../../../components/ModuleCard';

const ContactCard = ({ contact, onEdit, onView, onDelete, onConvertToClient, onTitleClick, leadCount = 0 }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const infoItems = [
        {
            icon: <MdOutlineEmail />,
            content: contact.email
        },
        {
            icon: <MdPhone />,
            content: contact.phone
        },
        {
            icon: <FiTarget />,
            content: (
                <Tag color={leadCount > 0 ? 'blue' : 'default'} style={{ marginLeft: 5 }}>
                    {leadCount} Lead{leadCount !== 1 ? 's' : ''}
                </Tag>
            )
        }
    ];

    const metaItems = [
        {
            icon: <MdAccessTime />,
            content: `Created ${formatDate(contact.createdAt)}`
        },
        {
            icon: <MdAccessTime />,
            content: `Updated ${formatDate(contact.updatedAt || contact.createdAt)}`
        }
    ];

    return (
        <ModuleCard
            title={contact.name}
            infoItems={infoItems}
            metaItems={metaItems}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onConvertToClient={onConvertToClient}
            item={contact}
            onTitleClick={onTitleClick}
            truncateTitle={true}
            module="contact"
        />
    );
};

export default ContactCard;