import React from 'react';
import { Card, Spin, Empty } from 'antd';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import './projectCompletionChart.scss';

const ProjectCompletionChart = ({ data, isLoading }) => {
    // Transform data for chart with early completion metrics
    const chartData = Object.entries(data || {}).map(([month, monthData]) => {
        // Get actual counts from the backend
        const onTimeCount = monthData?.onTimeCount || 0;
        const delayedCount = monthData?.delayedCount || 0;
        const earlyCount = monthData?.earlyCount || 0;
        const totalCount = monthData?.count || 0;

        return {
            name: month,
            early: earlyCount,
            onTime: onTimeCount,
            delayed: delayedCount,
            completion: totalCount, // Total completed projects
            planned: monthData?.plannedCount || 0, // Projects planned to be completed (from end dates)
        };
    });

    if (isLoading) {
        return (
            <div className="project-completion-chart-container">
                <Card title="Project Timeline Analysis" className="project-completion-chart-card">
                    <div className="chart-loading">
                        <Spin size="large" />
                    </div>
                </Card>
            </div>
        );
    }

    if (!chartData.length) {
        return (
            <div className="project-completion-chart-container">
                <Card title="Project Timeline Analysis" className="project-completion-chart-card">
                    <Empty description="No project timeline data available" />
                </Card>
            </div>
        );
    }

    // Calculate totals for summary
    const totalCompleted = chartData.reduce((sum, item) => sum + item.completion, 0);
    const totalOnTime = chartData.reduce((sum, item) => sum + item.onTime, 0);
    const totalEarly = chartData.reduce((sum, item) => sum + item.early, 0);
    const totalDelayed = chartData.reduce((sum, item) => sum + item.delayed, 0);
    const totalPlanned = chartData.reduce((sum, item) => sum + item.planned, 0);

    // Calculate on-time percentage (including early completions)
    const onTimePercentage = totalCompleted > 0
        ? Math.round(((totalOnTime + totalEarly) / totalCompleted) * 100)
        : 0;

    // Calculate early completion percentage
    const earlyPercentage = totalCompleted > 0
        ? Math.round((totalEarly / totalCompleted) * 100)
        : 0;

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-chart-tooltip">
                    <p className="tooltip-label">{label}</p>
                    <p className="tooltip-data early">Early: {payload[0]?.value || 0}</p>
                    <p className="tooltip-data ontime">On Time: {payload[1]?.value || 0}</p>
                    <p className="tooltip-data delayed">Delayed: {payload[2]?.value || 0}</p>
                    <p className="tooltip-data planned">Planned: {payload[3]?.value || 0}</p>
                    <p className="tooltip-data total">Total Completed: {(payload[0]?.value || 0) + (payload[1]?.value || 0) + (payload[2]?.value || 0)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="project-completion-chart-container">
            <Card
                title="Project Timeline Analysis"
                className="project-completion-chart-card"
            >
                <div className="chart-center-display">
                    <div className="chart-count">
                        {totalCompleted}
                        <span className="chart-percentage">{onTimePercentage}%</span>
                    </div>
                    <div className="chart-label">
                        Completed Projects
                        <span className="chart-total">({totalEarly} early, {totalOnTime} on time)</span>
                    </div>
                </div>

                <div className="chart-content">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                tickLine={{ stroke: 'var(--border-color)' }}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickLine={{ stroke: 'var(--border-color)' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
                            <Bar
                                dataKey="early"
                                name="Early Completion"
                                stackId="a"
                                fill="var(--color-3)"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            />
                            <Bar
                                dataKey="onTime"
                                name="On Time"
                                stackId="a"
                                fill="var(--success-color)"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            />
                            <Bar
                                dataKey="delayed"
                                name="Delayed"
                                stackId="a"
                                fill="var(--error-color)"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            />
                            <Bar
                                dataKey="planned"
                                name="Planned End Date"
                                fill="var(--info-color)"
                                radius={[4, 4, 0, 0]}
                                barSize={15}
                                opacity={0.7}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-footer">
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: 'var(--color-3)' }}></span>
                            <span>Early</span>
                            <span className="legend-value">{totalEarly}</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: 'var(--success-color)' }}></span>
                            <span>On Time</span>
                            <span className="legend-value">{totalOnTime}</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: 'var(--error-color)' }}></span>
                            <span>Delayed</span>
                            <span className="legend-value">{totalDelayed}</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: 'var(--info-color)' }}></span>
                            <span>Planned End Date</span>
                            <span className="legend-value">{totalPlanned}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProjectCompletionChart; 