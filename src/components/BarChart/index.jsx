import React from 'react';
import { Progress } from 'antd';
import BaseChart from '../BaseChart';
import './barChart.scss';

const BarChart = ({ title, data, isLoading, totalLabel = "Total Leads" }) => {
    const renderBarChart = (dataWithPercentages, total) => {
        return (
            <div className="bar-chart-wrapper">
                {dataWithPercentages.map((item, index) => (
                    <div key={index} className="bar-item">
                        <div className="bar-header">
                            <span className="bar-name">{item.name}</span>
                            <span className="bar-value">{item.value}</span>
                        </div>
                        <Progress
                            percent={item.percentage}
                            showInfo={false}
                            strokeColor={item.color}
                            trailColor="var(--border-color, #e5e7eb)"
                            className="bar-progress"
                        />
                        <div className="bar-percentage">{item.percentage}%</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <BaseChart
            title={title}
            data={data}
            isLoading={isLoading}
            totalLabel={totalLabel}
            renderCustomChart={renderBarChart}
            showProgress={false}
        />
    );
};

export default BarChart; 