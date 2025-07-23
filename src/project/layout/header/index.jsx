import React, { useState } from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Badge } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { selectCurrentUser, selectUserRole } from '../../../auth/services/authSlice';
import { useLogout } from '../../../utils/hooks/useLogout';
import { useTheme } from '../../../common/theme/ThemeContext';
import {
    RiMenuFoldLine,
    RiMenuUnfoldLine,
    RiUser3Line,
    RiLogoutCircleLine,
    RiNotification3Line,
    RiFileTextLine,
    RiTeamLine,
    RiShieldLine,
    RiGroupLine,
    RiSettings3Line,
    RiMenuLine
} from 'react-icons/ri';
import { BsSunFill, BsMoonFill } from 'react-icons/bs';

import ThemeDrawer from '../../../common/theme/ThemeDrawer';
import './styles.scss';

const DashboardHeader = ({ collapsed, setCollapsed, isMobile }) => {
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const handleLogout = useLogout();
    const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
    const { isDark, toggleDarkMode } = useTheme();
    const [isAnimating, setIsAnimating] = useState(false);

    const handleProfileClick = () => {
        const basePath = userRole === 'admin' ? '/admin' : '/dashboard';
        navigate(`${basePath}/profile`);
    };

    const handleThemeToggle = () => {
        toggleDarkMode();
    };

    const items = [
        {
            key: 'profile',
            label: 'Profile',
            icon: <RiUser3Line />,
            onClick: handleProfileClick
        },
        {
            key: 'theme',
            label: 'Theme',
            icon: <RiSettings3Line />,
            onClick: () => setThemeDrawerOpen(true)
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            label: 'Logout',
            icon: <RiLogoutCircleLine />,
            onClick: handleLogout,
            danger: true,
            className: 'ant-dropdown-menu-item-danger'
        }
    ];

    const notificationItems = [
        {
            key: '1',
            icon: <RiGroupLine />,
            label: 'New CRM message',
            description: 'You have a new message in your CRM inbox',
            time: '2 minutes ago',
            onClick: () => { }
        },
        {
            key: '2',
            icon: <RiTeamLine />,
            label: 'CRM notification',
            description: 'Important CRM update available',
            time: '5 minutes ago',
            onClick: () => { }
        },
        {
            key: '3',
            icon: <RiFileTextLine />,
            label: 'CRM alert',
            description: 'Action required in your CRM dashboard',
            time: '10 minutes ago',
            onClick: () => { }
        },
        {
            key: '4',
            icon: <RiShieldLine />,
            label: 'CRM reminder',
            description: 'You have pending tasks in your CRM',
            time: '15 minutes ago',
            onClick: () => { }
        }
    ];

    return (
        <>
            <motion.div
                className={`dashboard-header ${isMobile ? 'mobile-header' : ''}`}
                initial={false}
                animate={{
                    width: isMobile ? '100%' : `calc(100% - ${collapsed ? '80px' : '256px'})`,
                    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                }}
            >
                <Button
                    type="text"
                    icon={isMobile ?
                        <RiMenuLine className="toggle-icon" /> :
                        (collapsed ?
                            <RiMenuUnfoldLine className="toggle-icon" /> :
                            <RiMenuFoldLine className="toggle-icon" />)
                    }
                    onClick={() => setCollapsed(!collapsed)}
                    className="dashboard-header-toggle"
                />

                <div className="dashboard-header-actions">
                    <Dropdown
                        menu={{
                            items: notificationItems,
                            className: 'notification-dropdown'
                        }}
                        placement="bottomRight"
                        arrow
                        trigger={['click']}
                    >
                        <div className="dashboard-header-notification">
                            <Badge count={5} size={isMobile ? 'small' : 'default'}>
                                <RiNotification3Line className="notification-icon" />
                            </Badge>
                        </div>
                    </Dropdown>

                    <Button
                        type="text"
                        icon={isDark ? <BsMoonFill /> : <BsSunFill />}
                        onClick={handleThemeToggle}
                        className="theme-button"
                    />

                    <Dropdown
                        menu={{ items }}
                        placement="bottomRight"
                        arrow
                        overlayClassName="dashboard-header-profile-dropdown"
                    >
                        <div className="dashboard-header-profile">
                            <Avatar
                                size={isMobile ? 32 : 40}
                                icon={<RiUser3Line />}
                                className="dashboard-header-avatar"
                                src={user?.profilePicture}
                            />
                        </div>
                    </Dropdown>
                </div>
            </motion.div>

            <ThemeDrawer
                open={themeDrawerOpen}
                onClose={() => setThemeDrawerOpen(false)}
            />
        </>
    );
};

export default DashboardHeader;
