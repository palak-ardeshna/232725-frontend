import React from 'react';
import BaseChart from '../../../components/BaseChart';
import './projectsByPipelineChart.scss';

const ProjectsByPipelineChart = ({ data, isLoading }) => {
    // Transform data for BaseChart
    const chartData = Object.entries(data || {}).map(([pipelineId, pipelineData]) => ({
        name: pipelineData.name || 'Unknown Pipeline',
        value: pipelineData.count || 0
    }));

    return (
        <BaseChart
            title="Projects by Pipeline"
            data={chartData}
            isLoading={isLoading}
        />
    );
};

export default ProjectsByPipelineChart; 