import React, { useMemo } from 'react';
import { Col } from 'antd';
import BaseChart from '../../../../../../../components/BaseChart';

const MilestoneStatusChart = ({ milestones = [], totalMilestones = 0, isLoading = false }) => {
    const chartData = useMemo(() => {
        if (!milestones || milestones.length === 0) {
            return [];
        }

        // Group milestones by status
        const statusCounts = {
            'Completed': 0,
            'In Progress': 0,
            'Pending': 0,
            'Overdue': 0
        };

        // Count milestones by status
        milestones.forEach(milestone => {
            const status = milestone.status || 'Pending';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            } else {
                statusCounts['Pending']++;
            }
        });

        // Create chart items
        const chartItems = [
            {
                name: 'Completed',
                value: statusCounts['Completed'],
                color: 'var(--success-color)',
            },
            {
                name: 'In Progress',
                value: statusCounts['In Progress'],
                color: 'var(--primary-color)',
            },
            {
                name: 'Pending',
                value: statusCounts['Pending'],
                color: 'var(--warning-color)',
            },
            {
                name: 'Overdue',
                value: statusCounts['Overdue'],
                color: 'var(--error-color)',
            }
        ].filter(item => item.value > 0);

        return chartItems;
    }, [milestones]);

    return (
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <div className="chart-card">
                <BaseChart
                    title="Milestone Progress"
                    data={chartData}
                    isLoading={isLoading}
                    totalLabel={`Total: ${totalMilestones} Milestones`}
                    emptyText="No milestones available"
                    defaultChartType="progress"
                />
            </div>
        </Col>
    );
};

export default MilestoneStatusChart; 