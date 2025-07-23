import React from 'react';
import { useParams } from 'react-router-dom';
import { FiFileText, FiUser, FiTarget, FiMessageSquare, FiFile } from 'react-icons/fi';
import { useGetContactQuery } from '../../../../../config/api/apiServices';
import ModuleOverview from '../../../../../components/ModuleOverview';
import GeneralTab from './general';
import Lead from './lead';
import NotesTab from '../../lead/overview/notes';
import FilesTab from './files';
import getRole from '../../client/components/getRole';
import './overview.scss';

const ContactOverview = () => {
    const { id: contactId } = useParams();
    const role = getRole();
    const { data: contactData, isLoading, error } = useGetContactQuery(contactId, {
        skip: !contactId
    });

    const contact = contactData?.data;

    const contactForNotes = contact ? {
        id: contact.id,
        name: contact.name
    } : null;

    const tabItems = [
        {
            key: 'general',
            label: (
                <span className="tab-label">
                    <FiFileText />
                    <span>General</span>
                </span>
            ),
            children: <GeneralTab contact={contact} />
        },
        {
            key: 'lead',
            label: (
                <span className="tab-label">
                    <FiTarget />
                    <span>Lead</span>
                </span>
            ),
            children: <Lead />
        },
        {
            key: 'notes',
            label: (
                <span className="tab-label">
                    <FiMessageSquare />
                    <span>Notes</span>
                </span>
            ),
            children: <NotesTab lead={contactForNotes} noteType="contact" />
        },
        {
            key: 'files',
            label: (
                <span className="tab-label">
                    <FiFile />
                    <span>Files</span>
                </span>
            ),
            children: <FilesTab contact={contact} />
        },
    ];

    return (
        <ModuleOverview
            title={contact?.name}
            titleIcon={<FiUser />}
            tabItems={tabItems}
            isLoading={isLoading}
            error={error}
            data={contact}
            backPath={`/${role}/crm/contact`}
            backText="Back to Contacts"
            loadingText="Loading contact information..."
            errorText="Error loading contact information"
            emptyText="No contact information available"
            className="contact-overview-page"
            truncateTitle={true}
            titleMaxLength={40}
        />
    );
};

export default ContactOverview; 