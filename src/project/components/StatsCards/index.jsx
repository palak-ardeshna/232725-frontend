import React from 'react';
import { FiPhone, FiUsers, FiBriefcase, FiHeadphones } from 'react-icons/fi';
import StatsCard from '../StatsCard';
import './statsCards.scss';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../../auth/services/authSlice';

const StatsCards = ({ data, isLoading }) => {
    const { totalLeads, totalProjects, totalClients, totalContacts } = data || {};
    const userRole = useSelector(selectUserRole);

    const cardData = [
        {
            icon: <FiPhone size={28} />,
            title: "TOTAL CONTACTS",
            value: totalContacts,
            route: `/${userRole}/crm/contact`
        },
        {
            icon: <FiUsers size={28} />,
            title: "TOTAL LEADS",
            value: totalLeads,
            route: `/${userRole}/crm/lead`
        },
        {
            icon: <FiBriefcase size={28} />,
            title: "TOTAL PROJECTS",
            value: totalProjects,
            route: `/${userRole}/project`
        },
        {
            icon: <FiHeadphones size={28} />,
            title: "TOTAL CLIENTS",
            value: totalClients,
            route: `/${userRole}/crm/client`
        }
    ];

    return (
        <div className="stats-cards-container">
            {cardData.map((card, index) => (
                <StatsCard
                    key={index}
                    icon={card.icon}
                    title={card.title}
                    value={card.value}
                    isLoading={isLoading}
                    route={card.route}
                />
            ))}
        </div>
    );
};

export default StatsCards;