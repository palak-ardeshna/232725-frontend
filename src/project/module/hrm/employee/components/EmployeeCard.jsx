import React from 'react';
import { MdOutlineEmail, MdAccessTime } from 'react-icons/md';
import { FaUserTag } from 'react-icons/fa';
import { RiBuildingLine, RiUserStarLine, RiBuilding2Line } from 'react-icons/ri';
import ModuleCard from '../../../../../components/ModuleCard';

const EmployeeCard = ({ 
    employee, 
    roleName, 
    branchName, 
    departmentName, 
    designationName, 
    onEdit, 
    onView, 
    onDelete 
}) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const getInitials = () => {
        const firstInitial = employee.first_name ? employee.first_name.charAt(0).toUpperCase() : '';
        const lastInitial = employee.last_name ? employee.last_name.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial || employee.username.charAt(0).toUpperCase();
    };

    const infoItems = [
        {
            icon: <MdOutlineEmail />,
            content: employee.email
        },
        {
            icon: <FaUserTag />,
            content: roleName || 'N/A',
            badge: true
        },
        {
            icon: <RiBuilding2Line />,
            content: branchName || 'N/A'
        },
        {
            icon: <RiBuildingLine />,
            content: departmentName || 'N/A'
        },
        {
            icon: <RiUserStarLine />,
            content: designationName || 'N/A'
        }
    ];

    const metaItems = [
        {
            icon: <MdAccessTime />,
            content: `Created ${formatDate(employee.createdAt)}`
        },
        {
            icon: <MdAccessTime />,
            content: `Updated ${formatDate(employee.updatedAt || employee.createdAt)}`
        }
    ];

    const title = employee.first_name && employee.last_name
        ? `${employee.first_name} ${employee.last_name}`
        : employee.username;

    return (
        <ModuleCard
            title={title}
            subtitle={employee.username}
            avatar={employee.profile_picture ? { src: employee.profile_picture } : { text: getInitials() }}
            infoItems={infoItems}
            metaItems={metaItems}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            item={employee}
            truncateTitle={true}
        />
    );
};

export default EmployeeCard; 