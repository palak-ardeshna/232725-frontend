import React from 'react';
import BaseChart from '../../../components/BaseChart';

const MarketingLeadChart = ({ data, isLoading }) => {
    // Transform data for BaseChart
    const chartData = Object.entries(data || {}).map(([source, count]) => ({
        name: source,
        value: count
    }));

    return (
        <BaseChart
            title="Marketing Lead Sources"
            data={chartData}
            isLoading={isLoading}
        />
    );
};

export default MarketingLeadChart; 