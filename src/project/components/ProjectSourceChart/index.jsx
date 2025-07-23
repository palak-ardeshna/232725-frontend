import React from 'react';
import { motion } from 'framer-motion';
import BaseChart from '../../../components/BaseChart';
import './projectSourceChart.scss';

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

const ProjectSourceChart = ({ data, isLoading }) => {
    // Transform the data into the format expected by BaseChart
    const chartData = Object.entries(data || {}).map(([key, value]) => ({
        name: key,
        value: value || 0
    }));

    return (
        <motion.div variants={itemVariants}>
            <BaseChart
                title="Projects by Source"
                data={chartData}
                isLoading={isLoading}
                totalLabel="Total Projects"
            />
        </motion.div>
    );
};

export default ProjectSourceChart; 