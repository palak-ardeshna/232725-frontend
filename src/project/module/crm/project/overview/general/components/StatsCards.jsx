import React from 'react';
import { Card, Typography, Progress } from 'antd';
import {
    BsLightningChargeFill,
    BsCheckCircleFill,
    BsExclamationTriangleFill,
    BsFileEarmarkTextFill,
    BsCurrencyDollar,
    BsCashStack
} from 'react-icons/bs';
import { AiFillTrophy, AiFillFire } from 'react-icons/ai';
import { HiCurrencyDollar } from 'react-icons/hi';
import './StatsCards.scss';

const { Text } = Typography;

// Reusable StatCard component
const StatCard = ({
    label,
    value,
    icon: Icon,
    subtext,
    subtextIcon: SubtextIcon,
    subtextClass,
    showProgress,
    percent
}) => (
    <Card className={`stat-card ${label.toLowerCase()}-stat`}>
        <div className="stat-content">
            <div className="stat-icon">
                <Icon />
            </div>
            <div className="stat-details">
                <Text className="stat-label">{label}</Text>
                <div className="stat-main">
                    <div className="value-group">
                        <Text className="stat-value">{value}</Text>
                        <Text className={`stat-completion ${subtextClass}`}>
                            <SubtextIcon className="status-icon" /> {subtext}
                        </Text>
                    </div>
                </div>
            </div>
            {showProgress && (
                <div className="stat-progress">
                    <Progress
                        type="circle"
                        percent={percent}
                        size={46}
                        strokeWidth={8}
                        trailColor="rgba(0, 0, 0, 0.08)"
                        strokeColor={{
                            '0%': '#1890ff',
                            '100%': '#52c41a',
                        }}
                    />
                </div>
            )}
        </div>
    </Card>
);

const StatsCards = ({
    milestoneData = {},
    taskData = {},
    financialData = {}
}) => {
    // Calculate percentages
    const milestonePercent = milestoneData.total > 0
        ? Math.round((milestoneData.completed / milestoneData.total) * 100)
        : 0;

    const taskPercent = taskData.total > 0
        ? Math.round((taskData.completed / taskData.total) * 100)
        : 0;

    // Define card configurations
    const cardConfigs = [
        {
            label: 'Milestones',
            value: `${milestoneData.completed || 0} / ${milestoneData.total || 0}`,
            icon: AiFillTrophy,
            subtext: `${milestonePercent}% Completed`,
            subtextIcon: BsCheckCircleFill,
            subtextClass: 'completed',
            showProgress: true,
            percent: milestonePercent
        },
        {
            label: 'Tasks',
            value: `${taskData.completed || 0} / ${taskData.total || 0}`,
            icon: BsExclamationTriangleFill,
            subtext: `${taskPercent}% Completed`,
            subtextIcon: BsExclamationTriangleFill,
            subtextClass: 'pending',
            showProgress: true,
            percent: taskPercent
        },
        {
            label: 'Paid',
            value: `₹ ${financialData.formattedPaid || 0}`,
            icon: BsCashStack,
            subtext: `${financialData.paidPercentage || 0}%`,
            subtextIcon: BsCheckCircleFill,
            subtextClass: 'completed'
        },
        {
            label: 'During Progress',
            value: `₹ ${financialData.formattedDuringProgress || 0}`,
            icon: BsFileEarmarkTextFill,
            subtext: `${financialData.duringProgressPercentage || 0}%`,
            subtextIcon: BsExclamationTriangleFill,
            subtextClass: 'warning'
        },
        {
            label: 'Additional Cost',
            value: `₹ ${financialData.formattedCosts || 0}`,
            icon: BsCurrencyDollar,
            subtext: 'Recently Added',
            subtextIcon: BsLightningChargeFill,
            subtextClass: 'warning'
        }
    ];

    return (
        <div className="stats-cards">
            {cardConfigs.map((config, index) => (
                <StatCard key={index} {...config} />
            ))}
        </div>
    );
};

export default StatsCards; 