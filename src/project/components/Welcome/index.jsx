import React from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../auth/services/authSlice';
import './welcome.scss';

const { Title } = Typography;

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

const Welcome = () => {
    const user = useSelector(selectCurrentUser);

    return (
        <motion.div variants={itemVariants} className="dashboard-content">
            <Title level={4} className="dashboard-content-title">
                {getGreeting()}, {user?.username || 'User'}
            </Title>
            <Title level={5} className="dashboard-content-subtitle">
                Dashboard
            </Title>
        </motion.div>
    );
};

export default Welcome; 