import React from 'react';
import BaseChart from '../../../components/BaseChart';

const LeadsByPipelineChart = ({ data, isLoading }) => {
    // Transform data for BaseChart
    const chartData = Object.entries(data || {}).map(([pipelineId, pipelineData]) => ({
        name: pipelineData.name || 'Unknown Pipeline',
        value: pipelineData.count || 0
    }));

    return (
        <BaseChart
            title="Leads by Pipeline"
            data={chartData}
            isLoading={isLoading}
        />
    );
};

export default LeadsByPipelineChart; 