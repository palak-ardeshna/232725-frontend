import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetContactQuery,
    useGetPipelinesQuery,
    useGetStagesQuery,
    useGetFiltersQuery
} from '../../../../../../config/api/apiServices';
import GeneralDetailsTab from '../../../../../../components/GeneralDetailsTab';

const GeneralTab = ({ lead }) => {
    const navigate = useNavigate();
    const [contactData, setContactData] = useState(null);
    const [isClient, setIsClient] = useState(false);

    // Fetch contact data
    const { data: contactResponse } = useGetContactQuery(
        lead?.contact,
        { skip: !lead?.contact }
    );

    // Fetch pipelines, stages, and filters
    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const { data: stagesResponse } = useGetStagesQuery({ limit: 'all' });
    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });

    // Process data
    const pipelines = pipelinesResponse?.data?.items || [];
    const stages = stagesResponse?.data?.items || [];
    const filters = filtersResponse?.data?.items || [];

    // Filter sources and categories
    const sources = filters.filter(filter => filter.type === 'source');
    const categories = filters.filter(filter => filter.type === 'category');

    // Get pipeline, stage, source, and category names
    const pipelineName = pipelines.find(p => p.id === lead?.pipeline)?.name || 'Not Assigned';
    const stageName = stages.find(s => s.id === lead?.stage)?.name || 'Not Assigned';
    const sourceName = sources.find(s => s.id === lead?.source)?.name || 'Not Specified';
    const categoryName = categories.find(c => c.id === lead?.category)?.name || 'Uncategorized';

    useEffect(() => {
        if (contactResponse?.data) {
            setContactData(contactResponse.data);
            setIsClient(contactResponse.data.isClient === true);
        }
    }, [contactResponse]);

    const handleViewContact = () => {
        if (lead?.contact && contactData) {
            if (isClient) {
                navigate(`/admin/crm/client/overview/${lead.contact}`);
            } else {
                navigate(`/admin/crm/contact/overview/${lead.contact}`);
            }
        }
    };

    if (!lead) {
        return null;
    }

    const classifications = {
        pipelineName,
        stageName,
        sourceName,
        categoryName
    };

    return (
        <GeneralDetailsTab
            data={lead}
            type="lead"
            relatedData={contactData}
            classifications={classifications}
            onViewRelated={handleViewContact}
            isClient={isClient}
        />
    );
};

export default GeneralTab; 