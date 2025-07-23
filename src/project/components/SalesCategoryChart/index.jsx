import React from 'react';
import BaseChart from '../../../components/BaseChart';

const SalesCategoryChart = ({ data, isLoading }) => {
    // Transform data for BaseChart
    const chartData = Object.entries(data || {}).map(([category, count]) => ({
        name: category,
        value: count
    }));

    return (
        <BaseChart
            title="Lead Categories"
            data={chartData}
            isLoading={isLoading}
        />
    );
};

export default SalesCategoryChart; 