import React from 'react';
import BaseChart from '../../../components/BaseChart';

const LeadStatusChart = ({ data, isLoading }) => {
    const chartData = Object.entries(data || {}).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count
    }));

    return (
        <BaseChart
            title="Lead Status Distribution"
            data={chartData}
            isLoading={isLoading}
        />
    );
};

export default LeadStatusChart;
