import React from 'react';
import { motion } from 'framer-motion';
import BaseChart from '../../../components/BaseChart';
import './projectStatusChart.scss';

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

const ProjectStatusChart = ({ data, isLoading }) => {
    // Transform the data into the format expected by BaseChart
    const chartData = Object.entries(data || {}).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
        value: value || 0
    }));

    return (
        <motion.div variants={itemVariants}>
            <BaseChart
                title="Projects by Status"
                data={chartData}
                isLoading={isLoading}
                totalLabel="Total Projects"
            />
        </motion.div>
    );
};

export default ProjectStatusChart; 