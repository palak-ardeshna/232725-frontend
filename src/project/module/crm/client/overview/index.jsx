import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiFileText, FiEdit, FiFile, FiFolder, FiBriefcase, FiUserPlus } from 'react-icons/fi';
import { RiUserLine } from 'react-icons/ri';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useGetContactQuery } from '../../../../../config/api/apiServices';
import ModuleOverview from '../../../../../components/ModuleOverview';
import GeneralTab from './general';
import NotesTab from './notes';
import FilesTab from './files';
import ProjectsTab from './projects';
import LeadsTab from './leads';
import getRole from '../components/getRole';

const ClientOverview = () => {
    const { id: clientId } = useParams();
    const role = getRole();
    const navigate = useNavigate();
    const location = useLocation();
    const [projectId, setProjectId] = useState(null);

    const { data: clientData, isLoading, error } = useGetContactQuery(clientId, {
        skip: !clientId
    });

    const client = clientData?.data;

    // Check if we have a projectId in the state (from navigation)
    useEffect(() => {
        if (location.state && location.state.fromProjectId) {
            setProjectId(location.state.fromProjectId);
        }
    }, [location]);

    const tabItems = [
        {
            key: 'general',
            label: (
                <span className="tab-label">
                    <FiFileText />
                    <span>General</span>
                </span>
            ),
            children: <GeneralTab client={client} />
        },
        {
            key: 'leads',
            label: (
                <span className="tab-label">
                    <FiUserPlus />
                    <span>Leads</span>
                </span>
            ),
            children: <LeadsTab client={client} />
        },
        {
            key: 'projects',
            label: (
                <span className="tab-label">
                    <FiFolder />
                    <span>Projects</span>
                </span>
            ),
            children: <ProjectsTab client={client} />
        },
        {
            key: 'notes',
            label: (
                <span className="tab-label">
                    <FiEdit />
                    <span>Notes</span>
                </span>
            ),
            children: <NotesTab client={client} />
        },
        {
            key: 'files',
            label: (
                <span className="tab-label">
                    <FiFile />
                    <span>Files</span>
                </span>
            ),
            children: <FilesTab client={client} />
        }
    ];

    const headerActions = [
        {
            label: "Back to Clients",
            onClick: () => navigate(`/${role}/crm/client`),
            icon: <ArrowLeftOutlined />,
            type: "default",
            className: "btn btn-secondary"
        }
    ];

    // Add "Back to Project" button if we came from a project
    if (projectId) {
        headerActions.unshift({
            label: "Back to Project",
            onClick: () => navigate(`/${role}/project/overview/${projectId}`),
            icon: <FiBriefcase />,
            type: "primary",
            className: "btn btn-primary"
        });
    }

    return (
        <ModuleOverview
            title={client?.name}
            titleIcon={<RiUserLine />}
            tabItems={tabItems}
            isLoading={isLoading}
            error={error}
            data={client}
            backPath={`/${role}/crm/client`}
            backText="Back to Clients"
            loadingText="Loading client information..."
            errorText="Error loading client information"
            emptyText="No client information available"
            className="client-overview-page"
            truncateTitle={true}
            titleMaxLength={40}
            headerActions={headerActions}
        />
    );
};

export default ClientOverview; 