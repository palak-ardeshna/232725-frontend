import React from 'react';
import { Spin } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './statsCard.scss';

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

const StatsCard = ({ icon, title, value, isLoading, route }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (route) {
            navigate(route);
        }
    };

    return (
        <motion.div
            className="stats-card"
            variants={itemVariants}
            onClick={handleClick}
            style={{ cursor: route ? 'pointer' : 'default' }}
        >
            <div className="icon-wrapper">
                {icon}
            </div>
            <div className="content">
                <div className="title">{title}</div>
                <div className="value">{isLoading ? <Spin size="small" /> : value}</div>
            </div>
        </motion.div>
    );
};

export default StatsCard; 