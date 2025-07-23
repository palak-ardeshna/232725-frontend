import React from 'react';
import { motion } from 'framer-motion';
import BaseChart from '../../../components/BaseChart';
import './projectPriorityChart.scss';

const ProjectPriorityChart = ({ data, isLoading }) => {
    const chartData = Object.entries(data || {}).map(([priority, count]) => ({
        name: priority.charAt(0).toUpperCase() + priority.slice(1),
        value: count || 0,
        color: priority === 'high' ? '#f43f5e' : priority === 'medium' ? '#f59e0b' : '#10b981'
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <BaseChart
                title="Project Priority"
                chartType="donut"
                data={chartData}
                isLoading={isLoading}
                height={300}
                className="project-priority-chart"
                emptyMessage="No project priority data available"
            />
        </motion.div>
    );
};

export default ProjectPriorityChart; 