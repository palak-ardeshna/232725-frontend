import React, { useState } from 'react';
import { Card, Spin, Empty, Progress, Tooltip, Dropdown, Button } from 'antd';
import { motion } from 'framer-motion';
import {
    BarChartOutlined,
    PieChartOutlined,
    DownOutlined,
    LineChartOutlined,
    AreaChartOutlined,
    TableOutlined,
    ColumnHeightOutlined,
    AlignLeftOutlined,
    DashboardOutlined,
    MenuOutlined
} from '@ant-design/icons';
import './baseChart.scss';

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

// Define standard colors for common categories and sources
const STANDARD_COLORS = {
    // Status colors
    'open': '#0284c7',     // blue
    'closed': '#f97316',   // orange
    'pending': '#8b5cf6',  // purple
    'won': '#10b981',      // emerald
    'lost': '#f43f5e',     // rose
    'onhold': '#fbbf24',   // amber
    'cancelled': '#6366f1', // indigo

    // Category colors
    'training': '#0284c7',    // blue
    'consulting': '#06b6d4',  // cyan
    'support': '#f97316',     // orange
    'product': '#8b5cf6',     // purple
    'service': '#10b981',     // emerald
    'other': '#6366f1',       // indigo

    // Source colors
    'website': '#0284c7',          // blue
    'email': '#8b5cf6',            // purple
    'email campaign': '#8b5cf6',   // purple
    'cold call': '#f43f5e',        // rose
    'referral': '#10b981',         // emerald
    'trade show': '#06b6d4',       // cyan
    'social media': '#6366f1',     // indigo

    // Pipeline colors
    'sales': '#0284c7',      // blue
    'marketing': '#06b6d4',  // cyan
    'support': '#f97316',    // orange
};

// Fallback colors for items not in the standard list
const FALLBACK_COLORS = [
    '#0284c7', // blue
    '#06b6d4', // cyan
    '#f97316', // orange
    '#8b5cf6', // purple
    '#10b981', // emerald
    '#f43f5e', // rose
    '#fbbf24', // amber
    '#6366f1'  // indigo
];

const BaseChart = ({
    title,
    data = [],
    isLoading,
    totalLabel = "Total Leads",
    renderCustomChart,
    showProgress = true,
    defaultChartType = "progress" // progress, segmentBar, horizontalBar, verticalBar, line, area, table
}) => {
    const [chartType, setChartType] = useState(defaultChartType);

    // Calculate total from data
    const total = Array.isArray(data)
        ? data.reduce((sum, item) => sum + (item.value || 0), 0)
        : Object.values(data || {}).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);

    // Process data to ensure consistent format
    const processedData = Array.isArray(data) ? data : Object.entries(data || {}).map(([key, value]) => ({
        name: key,
        value: typeof value === 'number' ? value : 0,
    }));

    // Assign colors consistently
    const dataWithColors = processedData.map((item, index) => {
        // If item already has a color, use it
        if (item.color) return item;

        // Try to get color from standard colors (case insensitive)
        const itemNameLower = item.name.toLowerCase();
        const standardColor = STANDARD_COLORS[itemNameLower];

        if (standardColor) {
            return { ...item, color: standardColor };
        }

        // Fallback to color array
        return { ...item, color: FALLBACK_COLORS[index % FALLBACK_COLORS.length] };
    });

    // Calculate percentages
    const dataWithPercentages = dataWithColors.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));

    // Chart type menu items
    const chartTypeItems = [
        {
            key: 'progress',
            label: 'Progress Bars',
            icon: <DashboardOutlined />,
            onClick: () => setChartType('progress')
        },
        {
            key: 'segmentBar',
            label: 'Segment Bar',
            icon: <MenuOutlined />,
            onClick: () => setChartType('segmentBar')
        },
        {
            key: 'verticalBar',
            label: 'Vertical Bar Chart',
            icon: <ColumnHeightOutlined />,
            onClick: () => setChartType('verticalBar')
        },
        {
            key: 'horizontalBar',
            label: 'Horizontal Bar Chart',
            icon: <AlignLeftOutlined />,
            onClick: () => setChartType('horizontalBar')
        },
        {
            key: 'line',
            label: 'Line Chart',
            icon: <LineChartOutlined />,
            onClick: () => setChartType('line')
        },
        {
            key: 'area',
            label: 'Area Chart',
            icon: <AreaChartOutlined />,
            onClick: () => setChartType('area')
        },
        {
            key: 'table',
            label: 'Table View',
            icon: <TableOutlined />,
            onClick: () => setChartType('table')
        }
    ];

    // Chart type icon mapping
    const chartTypeIcons = {
        'progress': <DashboardOutlined />,
        'segmentBar': <MenuOutlined />,
        'verticalBar': <ColumnHeightOutlined />,
        'horizontalBar': <AlignLeftOutlined />,
        'line': <LineChartOutlined />,
        'area': <AreaChartOutlined />,
        'table': <TableOutlined />
    };

    // Custom title with chart type dropdown
    const customTitle = (
        <div className="chart-title-container">
            <span>{title}</span>
            <Dropdown menu={{
                items: chartTypeItems,
                style: { maxHeight: '300px', overflow: 'auto' }
            }} placement="bottomRight" trigger={['click']}>
                <Button type="text" className="chart-type-dropdown-button">
                    {chartTypeIcons[chartType]}
                    <DownOutlined />
                </Button>
            </Dropdown>
        </div>
    );

    if (isLoading) {
        return (
            <motion.div variants={itemVariants} className="base-chart-container">
                <Card title={customTitle} className="base-chart-card">
                    <div className="chart-loading">
                        <Spin size="large" />
                    </div>
                </Card>
            </motion.div>
        );
    }

    if (processedData.length === 0 || total === 0) {
        return (
            <motion.div variants={itemVariants} className="base-chart-container">
                <Card title={customTitle} className="base-chart-card">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" />
                </Card>
            </motion.div>
        );
    }

    // Render progress bars (default)
    const renderProgressChart = () => {
        return (
            <div className="chart-items">
                {dataWithPercentages.map((item, index) => (
                    <div key={index} className="chart-item">
                        <div className="chart-item-header">
                            <span className="chart-item-name">{item.name}</span>
                            <span className="chart-item-value">{item.displayValue || item.value}</span>
                        </div>
                        <Progress
                            percent={item.percentage}
                            showInfo={false}
                            strokeColor={item.color}
                            trailColor="var(--border-color, #e5e7eb)"
                            className="chart-progress"
                        />
                        <div className="chart-percentage">{item.percentage}%</div>
                    </div>
                ))}
            </div>
        );
    };

    // Render donut chart
    const renderSegmentBarChart = () => {
        return (
            <div className="donut-chart-wrapper">
                <div className="donut-chart">
                    {dataWithPercentages.map((item, index) => (
                        <Tooltip
                            key={index}
                            title={`${item.name}: ${item.displayValue || item.value} (${item.percentage}%)`}
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
                            <div className="legend-value">{item.displayValue || item.value} ({item.percentage}%)</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render bar chart (horizontal bars)
    const renderHorizontalBarChart = () => {
        const maxValue = Math.max(...dataWithPercentages.map(item => item.value));
        const barWidth = `${90 / dataWithPercentages.length}%`;

        return (
            <div className="bar-chart-wrapper">
                <div className="bar-chart">
                    {dataWithPercentages.map((item, index) => {
                        const height = (item.value / maxValue) * 100;
                        return (
                            <div key={index} className="bar-chart-item">
                                <Tooltip title={`${item.name}: ${item.displayValue || item.value} (${item.percentage}%)`}>
                                    <div
                                        className="bar-chart-bar"
                                        style={{
                                            height: `${height}%`,
                                            backgroundColor: item.color,
                                            width: barWidth
                                        }}
                                    />
                                </Tooltip>
                                <div className="bar-chart-label">{item.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render line chart
    const renderLineChart = () => {
        return (
            <div className="line-chart-wrapper">
                <div className="line-chart-container">
                    <div className="line-chart-svg">
                        <svg width="100%" height="150" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {dataWithPercentages.map((item, index, array) => {
                                if (index === 0) return null;
                                const prev = array[index - 1];
                                const x1 = ((index - 1) / (array.length - 1)) * 100;
                                const y1 = 100 - prev.percentage;
                                const x2 = (index / (array.length - 1)) * 100;
                                const y2 = 100 - item.percentage;
                                return (
                                    <line
                                        key={index}
                                        x1={`${x1}%`}
                                        y1={`${y1}%`}
                                        x2={`${x2}%`}
                                        y2={`${y2}%`}
                                        stroke={item.color}
                                        strokeWidth="2"
                                    />
                                );
                            })}
                            {dataWithPercentages.map((item, index, array) => (
                                <circle
                                    key={`point-${index}`}
                                    cx={`${(index / (array.length - 1)) * 100}%`}
                                    cy={`${100 - item.percentage}%`}
                                    r="3"
                                    fill={item.color}
                                />
                            ))}
                        </svg>
                    </div>
                </div>
                <div className="chart-legend">
                    {dataWithPercentages.map((item, index) => (
                        <div key={index} className="legend-item">
                            <div
                                className="legend-color"
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="legend-name">{item.name}</div>
                            <div className="legend-value">{item.displayValue || item.value} ({item.percentage}%)</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render area chart
    const renderAreaChart = () => {
        return (
            <div className="area-chart-wrapper">
                <div className="area-chart-container">
                    <div className="area-chart-svg">
                        <svg width="100%" height="150" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {dataWithPercentages.map((item, index) => {
                                const width = 100 / dataWithPercentages.length;
                                const x = index * width;
                                const height = item.percentage;
                                return (
                                    <rect
                                        key={index}
                                        x={`${x}%`}
                                        y={`${100 - height}%`}
                                        width={`${width}%`}
                                        height={`${height}%`}
                                        fill={item.color}
                                        opacity="0.8"
                                    >
                                        <title>{`${item.name}: ${item.displayValue || item.value} (${item.percentage}%)`}</title>
                                    </rect>
                                );
                            })}
                        </svg>
                    </div>
                </div>
                <div className="chart-legend">
                    {dataWithPercentages.map((item, index) => (
                        <div key={index} className="legend-item">
                            <div
                                className="legend-color"
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="legend-name">{item.name}</div>
                            <div className="legend-value">{item.displayValue || item.value} ({item.percentage}%)</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render table view
    const renderTableView = () => {
        return (
            <div className="table-chart-wrapper">
                <table className="table-chart">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Value</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataWithPercentages.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="table-name">
                                        <div
                                            className="table-color"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span>{item.name}</span>
                                    </div>
                                </td>
                                <td>{item.displayValue || item.value}</td>
                                <td>{item.percentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Render vertical bar chart (columns)
    const renderVerticalBarChart = () => {
        const maxValue = Math.max(...dataWithPercentages.map(item => item.value));
        const barWidth = `${90 / dataWithPercentages.length}%`;

        return (
            <div className="vertical-bar-chart-wrapper">
                <div className="vertical-bar-chart">
                    {dataWithPercentages.map((item, index) => {
                        const height = (item.value / maxValue) * 100;
                        return (
                            <div key={index} className="vertical-bar-chart-item">
                                <Tooltip title={`${item.name}: ${item.displayValue || item.value} (${item.percentage}%)`}>
                                    <div
                                        className="vertical-bar-chart-bar"
                                        style={{
                                            height: `${height}%`,
                                            backgroundColor: item.color,
                                            width: barWidth
                                        }}
                                    />
                                </Tooltip>
                                <div className="vertical-bar-chart-label">{item.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render chart based on selected type
    const renderChartByType = () => {
        switch (chartType) {
            case 'segmentBar':
                return renderSegmentBarChart();
            case 'horizontalBar':
                return renderHorizontalBarChart();
            case 'verticalBar':
                return renderVerticalBarChart();
            case 'line':
                return renderLineChart();
            case 'area':
                return renderAreaChart();
            case 'table':
                return renderTableView();
            case 'progress':
            default:
                return renderProgressChart();
        }
    };

    return (
        <motion.div variants={itemVariants} className="base-chart-container">
            <Card title={customTitle} className="base-chart-card">
                <div className="chart-wrapper">
                    <div className="total-count-wrapper">
                        <div className="total-count">
                            {dataWithPercentages[0]?.displayValue ?
                                dataWithPercentages.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    maximumFractionDigits: 0
                                }) :
                                total}
                        </div>
                        <div className="total-label">{totalLabel}</div>
                    </div>

                    {renderCustomChart ? renderCustomChart(dataWithPercentages, total) : renderChartByType()}
                </div>
            </Card>
        </motion.div >
    );
};

export default BaseChart; 