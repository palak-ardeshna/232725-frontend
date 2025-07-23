import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiFileText, FiTarget, FiUsers, FiEdit, FiFile, FiActivity, FiClock, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { useGetLeadQuery, useGetPipelinesQuery, useGetStagesQuery, useGetContactQuery } from '../../../../../config/api/apiServices';
import ModuleOverview from '../../../../../components/ModuleOverview';
import GeneralTab from './general';
import MembersTab from './members';
import NotesTab from './notes';
import FilesTab from './files';
import ActivitiesTab from './activities';
import FollowUpTab from './followup';
import getRole from '../../client/components/getRole';
import { Modal, message } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { ModalTitle } from '../../../../../components/AdvancedForm';

const LeadOverview = () => {
    const { id: leadId } = useParams();
    const navigate = useNavigate();
    const role = getRole();
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [contactData, setContactData] = useState(null);

    const { data: leadData, isLoading, error } = useGetLeadQuery(leadId, {
        skip: !leadId
    });

    const lead = leadData?.data;

    const { data: contactResponse } = useGetContactQuery(
        lead?.contact,
        { skip: !lead?.contact }
    );

    useEffect(() => {
        if (contactResponse?.data) {
            setContactData(contactResponse.data);
        }
    }, [contactResponse]);

    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const pipelines = pipelinesResponse?.data?.items || [];

    const { data: stagesResponse } = useGetStagesQuery({
        limit: 'all',
        type: 'project'
    });
    const stages = stagesResponse?.data?.items || [];

    const handleConvertToProject = () => {
        setConfirmModalVisible(true);
    };

    const handleConfirmConvert = () => {
        if (!lead) {
            message.error('Lead data not available');
            return;
        }

        // Get all necessary data from the lead to pre-fill the project form
        const convertData = {
            fromLead: true,
            isNew: true,
            _isNewProject: true, // Add special flag to ensure this displays as "Add Project"
            projectTitle: lead.leadTitle || '',
            projectValue: Number(lead.leadValue || 0), // Ensure it's a number, not a string
            description: lead.description || '',
            source: lead.source || '',
            category: lead.category || '',
            start_date: lead.created_at || new Date().toISOString(),
            priority: lead.priority || 'Medium',
            // Set 'Pending' as the default status, but don't show it in the form
            status: 'Pending',
            estimated_completion: null,
            remarks: lead.remarks || `Converted from Lead ID: ${lead.id}`,
            // If pipelines exist, select the first one as default
            pipeline: pipelines.length > 0 ? pipelines[0].id : '',
        };

        // If the lead has a contact, set it as the client
        if (lead.contact && contactData) {
            convertData.client = lead.contact;
            // Store the contact data to display in the form
            convertData.contactData = contactData;
        }

        // If first stage is available for the selected pipeline, use it
        const defaultPipeline = pipelines.length > 0 ? pipelines[0].id : null;
        if (defaultPipeline) {
            const pipelineStages = stages.filter(s => s.pipeline === defaultPipeline && s.type === 'project');
            if (pipelineStages.length > 0) {
                // Find the default stage or use the first one
                const defaultStage = pipelineStages.find(s => s.is_default) || pipelineStages[0];
                convertData.stage = defaultStage.id;
            }
        }

        // Add team members if they exist in the lead data
        if (lead.team_members && Array.isArray(lead.team_members)) {
            convertData.team_members = lead.team_members;
        }

        // Add lead ID for reference
        convertData.lead_id = lead.id;

        localStorage.setItem('convertToProjectData', JSON.stringify(convertData));

        // Close the modal and navigate to the project create page
        setConfirmModalVisible(false);
        navigate(`/${role}/project`);

        // Show success message with slight delay to ensure it appears after navigation
        setTimeout(() => {
            message.success('Converting lead to project. Please review and confirm details.', 5);
        }, 300);
    };

    const tabItems = [
        {
            key: 'general',
            label: (
                <span className="tab-label">
                    <FiFileText />
                    <span>General</span>
                </span>
            ),
            children: <GeneralTab lead={lead} />
        },
        {
            key: 'members',
            label: (
                <span className="tab-label">
                    <FiUsers />
                    <span>Team</span>
                </span>
            ),
            children: <MembersTab lead={lead} />
        },
        {
            key: 'notes',
            label: (
                <span className="tab-label">
                    <FiEdit />
                    <span>Notes</span>
                </span>
            ),
            children: <NotesTab lead={lead} />
        },
        {
            key: 'files',
            label: (
                <span className="tab-label">
                    <FiFile />
                    <span>Files</span>
                </span>
            ),
            children: <FilesTab lead={lead} />
        },
       
        {
            key: 'followup',
            label: (
                <span className="tab-label">
                    <FiClock />
                    <span>Follow-ups</span>
                </span>
            ),
            children: <FollowUpTab lead={lead} />
        },
         {
            key: 'activities',
            label: (
                <span className="tab-label">
                    <FiActivity />
                    <span>Activities</span>
                </span>
            ),
            children: <ActivitiesTab lead={lead} />
        },
    ];

    const headerActions = [
        {
            label: "Back to Leads",
            icon: <FiArrowLeft />,
            onClick: () => navigate(`/${role}/crm/lead`),
            type: "default",
            className: "btn btn-secondary"
        },
        {
            label: "Convert to Project",
            onClick: handleConvertToProject,
            icon: <SwapOutlined />,
            type: "primary",
            className: "btn btn-success"
        }
    ];

    return (
        <>
            <ModuleOverview
                title={lead?.leadTitle}
                titleIcon={<FiTarget />}
                tabItems={tabItems}
                isLoading={isLoading}
                error={error}
                data={lead}
                backPath={`/${role}/crm/lead`}
                backText="Back to Leads"
                loadingText="Loading lead information..."
                errorText="Error loading lead information"
                emptyText="No lead information available"
                className="lead-overview-page"
                truncateTitle={true}
                titleMaxLength={40}
                headerActions={headerActions}
            />

            <Modal
                title={<ModalTitle icon={<SwapOutlined />} title="Convert Lead to Project" />}
                open={confirmModalVisible}
                onOk={handleConfirmConvert}
                onCancel={() => setConfirmModalVisible(false)}
                okText="Convert"
                cancelText="Cancel"
                className="convert-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    loading: false
                }}
            >
                <p>Are you sure you want to convert this lead to a project?</p>
                <p>You'll be redirected to the project form with lead information pre-filled.</p>
            </Modal>
        </>
    );
};

export default LeadOverview;