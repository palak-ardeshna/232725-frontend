import React, { useMemo } from 'react';
import { Col } from 'antd';
import BaseChart from '../../../../../../../components/BaseChart';

const TaskPriorityChart = ({ tasks = [], totalTasks = 0, isLoading = false }) => {
    const chartData = useMemo(() => {
        const priorityCounts = {
            'High': 0,
            'Medium': 0,
            'Low': 0
        };

        tasks.forEach(task => {
            const priority = task?.priority || 'Medium';
            if (priorityCounts.hasOwnProperty(priority)) {
                priorityCounts[priority]++;
            }
        });

        return [
            {
                name: 'High Priority',
                value: priorityCounts.High,
                color: 'var(--error-color)'
            },
            {
                name: 'Medium Priority',
                value: priorityCounts.Medium,
                color: 'var(--warning-color)'
            },
            {
                name: 'Low Priority',
                value: priorityCounts.Low,
                color: 'var(--success-color)'
            }
        ].filter(item => item.value > 0);
    }, [tasks]);

    return (
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <div className="chart-card">
                <BaseChart
                    title="Task Priority Distribution"
                    data={chartData}
                    isLoading={isLoading}
                    totalLabel={`Total: ${totalTasks} Tasks`}
                />
            </div>
        </Col>
    );
};

export default TaskPriorityChart; 