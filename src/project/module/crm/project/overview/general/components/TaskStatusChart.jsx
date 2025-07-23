import React, { useMemo } from 'react';
import { Col } from 'antd';
import BaseChart from '../../../../../../../components/BaseChart';

const TaskStatusChart = ({ tasks = [], totalTasks = 0, isLoading = false }) => {
    const chartData = useMemo(() => {
        const statusCounts = {
            'Pending': 0,
            'In Progress': 0,
            'Completed': 0
        };

        tasks.forEach(task => {
            const status = task?.status || 'Pending';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            }
        });

        return [
            {
                name: 'Completed',
                value: statusCounts.Completed,
                color: 'var(--success-color)'
            },
            {
                name: 'In Progress',
                value: statusCounts['In Progress'],
                color: 'var(--warning-color)'
            },
            {
                name: 'Pending',
                value: statusCounts.Pending,
                color: 'var(--error-color)'
            }
        ].filter(item => item.value > 0);
    }, [tasks]);

    return (
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <div className="chart-card">
                <BaseChart
                    title="Task Status"
                    data={chartData}
                    isLoading={isLoading}
                    totalLabel={`Total: ${totalTasks} Tasks`}
                />
            </div>
        </Col>
    );
};

export default TaskStatusChart; 