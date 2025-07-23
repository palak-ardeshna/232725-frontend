import React from 'react';
import { Tooltip } from 'antd';
import BaseChart from '../BaseChart';
import './donutChart.scss';

const DonutChart = ({ title, data, isLoading, totalLabel = "Total Leads" }) => {
    const renderDonutChart = (dataWithPercentages, total) => {
        return (
            <div className="donut-chart-wrapper">
                <div className="donut-chart">
                    {dataWithPercentages.map((item, index) => (
                        <Tooltip
                            key={index}
                            title={`${item.name}: ${item.value} (${item.percentage}%)`}
                        >
                            <div
                                className="donut-segment"
                                style={{
                                    backgroundColor: item.color,
                                    width: `${item.percentage}%`
                                }}
                            />
                        </Tooltip>
                    ))}
                </div>

                <div className="donut-legend">
                    {dataWithPercentages.map((item, index) => (
                        <div key={index} className="legend-item">
                            <div
                                className="legend-color"
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="legend-name">{item.name}</div>
                            <div className="legend-value">{item.percentage}%</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <BaseChart
            title={title}
            data={data}
            isLoading={isLoading}
            totalLabel={totalLabel}
            renderCustomChart={renderDonutChart}
            showProgress={false}
        />
    );
};

export default DonutChart; 