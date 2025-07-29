import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Avatar, Tooltip, Button, Popover, Empty } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole, selectUserPermissions } from '../../../auth/services/authSlice';
import {
    RiDashboardFill,
    RiLogoutCircleFill,
    RiMessage2Fill,
    RiUserLine,
    RiTeamLine,
    RiCustomerService2Line,
    RiContactsLine,
    RiShieldUserLine,
    RiUserSettingsLine,
    RiArrowLeftSLine,
    RiFileTextLine,
    RiUserStarLine,
    RiGroupLine,
    RiTeamFill,
    RiStickyNoteLine,
    RiFolder3Line,
    RiCalendarLine,
    RiSettings3Line,
    RiBuildingLine,
    RiPriceTag3Line
} from 'react-icons/ri';
import './styles.scss';
import { useLogout } from '../../../utils/hooks/useLogout';
import { publicModules } from '../../../config/permissions';

const { Sider } = Layout;
const { Title } = Typography;

const DashboardSidebar = ({ collapsed, isMobile, onBackClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const userPermissions = useSelector(selectUserPermissions);
    const handleLogout = useLogout();
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState('');
    const [crmPopoverVisible, setCrmPopoverVisible] = useState(false);
    const [hrmPopoverVisible, setHrmPopoverVisible] = useState(false);
    const [settingsPopoverVisible, setSettingsPopoverVisible] = useState(false);

    // Check if user has dashboard access
    const hasDashboardAccess = user?.userType !== 'superadmin' || user?.isDashboard !== false;

    useEffect(() => {
        if (location.pathname === '/' || location.pathname === '/dashboard') {
            setSelectedKey(`${getBasePath()}/dashboard`);
            navigate(`${getBasePath()}/dashboard`);
        } else {
            if (location.pathname.includes('/crm/lead/overview')) {
                setSelectedKey(`${getBasePath()}/crm/lead`);
            } else if (location.pathname.includes('/project/overview')) {
                setSelectedKey(`${getBasePath()}/project`);
            } else {
                setSelectedKey(location.pathname);
            }
        }
    }, [location.pathname, collapsed]);

    const handleOpenChange = (keys) => {
        setOpenKeys(keys);
    };

    const getBasePath = () => {
        const role = userRole?.toLowerCase() || 'superadmin';
        return role === 'admin' ? '/admin' : '/superadmin';
    };

    // For users without dashboard access, we'll keep the same menu items but disable navigation
    const handleMenuItemClick = (path) => {
        if (hasDashboardAccess) {
            navigate(path);
        } else if (path === 'logout') {
            // Only allow logout function when access is restricted
            handleLogout();
        }
    };

    const crmMenuItems = [
        // {
        //     key: `${getBasePath()}/crm/lead`,
        //     icon: <RiTeamLine />,
        //     label: 'Lead',
        //     onClick: () => {
        //         setCrmPopoverVisible(false);
        //         handleMenuItemClick(`${getBasePath()}/crm/lead`);
        //     },
        //     permission: 'lead',
        //     className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        // },
        // {
        //     key: `${getBasePath()}/crm/contact`,
        //     icon: <RiContactsLine />,
        //     label: 'Contact',
        //     onClick: () => {
        //         setCrmPopoverVisible(false);
        //         handleMenuItemClick(`${getBasePath()}/crm/contact`);
        //     },
        //     permission: 'contact',
        //     className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        // },
        // {
        //     key: `${getBasePath()}/crm/client`,
        //     icon: <RiUserLine />,
        //     label: 'Client',
        //     onClick: () => {
        //         setCrmPopoverVisible(false);
        //         handleMenuItemClick(`${getBasePath()}/crm/client`);
        //     },
        //     permission: 'client',
        //     className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        // },
        // {
        //     key: `${getBasePath()}/crm/proposal`,
        //     icon: <RiFileTextLine />,
        //     label: 'Proposal',
        //     onClick: () => {
        //         setCrmPopoverVisible(false);
        //         handleMenuItemClick(`${getBasePath()}/crm/proposal`);
        //     },
        //     permission: 'proposal',
        //     className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        // },
        // {
        //     key: `${getBasePath()}/crm/system`,
        //     icon: <RiCustomerService2Line />,
        //     label: 'CRM System',
        //     onClick: () => {
        //         setCrmPopoverVisible(false);
        //         handleMenuItemClick(`${getBasePath()}/crm/system`);
        //     },
        //     permission: 'system',
        //     className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        // },
        // {
        //     key: `${getBasePath()}/crm/task`,
        //     icon: <RiCalendarLine />,
        //     label: 'Task',
        //     onClick: () => {
        //         setCrmPopoverVisible(false);
        //         handleMenuItemClick(`${getBasePath()}/crm/task`);
        //     },
        //     permission: 'task',
        //     className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        // }
    ];

    const hrmMenuItems = [
        {
            key: `${getBasePath()}/hrm/employee`,
            icon: <RiUserLine />,
            label: 'Employee',
            onClick: () => {
                setHrmPopoverVisible(false);
                handleMenuItemClick(`${getBasePath()}/hrm/employee`);
            },
            permission: 'employee',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/hrm/designation`,
            icon: <RiUserStarLine />,
            label: 'Designation',
            onClick: () => {
                setHrmPopoverVisible(false);
                handleMenuItemClick(`${getBasePath()}/hrm/designation`);
            },
            permission: 'designation',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/hrm/department`,
            icon: <RiGroupLine />,
            label: 'Department',
            onClick: () => {
                setHrmPopoverVisible(false);
                handleMenuItemClick(`${getBasePath()}/hrm/department`);
            },
            permission: 'department',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/hrm/team-member`,
            icon: <RiTeamFill />,
            label: 'Team',
            onClick: () => {
                setHrmPopoverVisible(false);
                handleMenuItemClick(`${getBasePath()}/hrm/team-member`);
            },
            permission: 'teamMember',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/hrm/leave`,
            icon: <RiCalendarLine />,
            label: 'Leave',
            onClick: () => {
                setHrmPopoverVisible(false);
                handleMenuItemClick(`${getBasePath()}/hrm/leave`);
            },
            permission: 'leave',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/hrm/attendance`,
            icon: <RiCalendarLine />,
            label: 'Attendance',
            onClick: () => {
                setHrmPopoverVisible(false);
                handleMenuItemClick(`${getBasePath()}/hrm/attendance`);
            },
            permission: 'attendance',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/hrm/holiday`,
            icon: <RiCalendarLine />,
            label: 'Holiday',
            onClick: () => {
                setHrmPopoverVisible(false);
                handleMenuItemClick(`${getBasePath()}/hrm/holiday`);
            },
            permission: 'holiday',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        }
    ];

    // Settings menu items - sarkhu banv setting mate
    const settingsMenuItems = [
        {
            key: `${getBasePath()}/settings/office`,
            icon: <RiSettings3Line />,
            label: 'Office Settings',
            onClick: () => {
                setSettingsPopoverVisible(false);
                navigate(`${getBasePath()}/settings/office`);
            },
            permission: 'settings'
        },
       
    ];

    const items = [
        {
            key: `${getBasePath()}/dashboard`,
            icon: <RiDashboardFill />,
            label: 'Dashboard',
            onClick: () => handleMenuItemClick(`${getBasePath()}/dashboard`),
            permission: 'dashboard',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/project`,
            icon: <RiFolder3Line />,
            label: 'Project',
            onClick: () => handleMenuItemClick(`${getBasePath()}/project`),
            permission: 'project',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/notes`,
            icon: <RiStickyNoteLine />,
            label: 'Notes',
            onClick: () => handleMenuItemClick(`${getBasePath()}/notes`),
            permission: 'note',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/role`,
            icon: <RiShieldUserLine />,
            label: 'Role',
            onClick: () => handleMenuItemClick(`${getBasePath()}/role`),
            permission: 'role',
            adminOnly: true,
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/inquiry`,
            icon: <RiMessage2Fill />,
            label: 'Inquiry',
            onClick: () => handleMenuItemClick(`${getBasePath()}/inquiry`),
            permission: 'inquiry',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/company`,
            icon: <RiBuildingLine />,
            label: 'Company',
            onClick: () => handleMenuItemClick(`${getBasePath()}/company`),
            permission: 'company',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/admin`,
            icon: <RiShieldUserLine />,
            label: 'Administrators',
            onClick: () => handleMenuItemClick(`${getBasePath()}/admin`),
            permission: 'admin',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        {
            key: `${getBasePath()}/plan`,
            icon: <RiPriceTag3Line />,
            label: 'Plans',
            onClick: () => handleMenuItemClick(`${getBasePath()}/plan`),
            permission: 'plan',
            className: !hasDashboardAccess ? 'disabled-menu-item' : ''
        },
        
    ];

    const menuItems = items.map(item => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
        className: !hasDashboardAccess ? 'disabled-menu-item' : item.className || ''
    }));

    const crmPopoverContent = (
        <div className="crm-popover-menu">
            {crmMenuItems.map(item => (
                <div
                    key={item.key}
                    className={`crm-popover-item ${selectedKey === item.key ? 'active' : ''}`}
                    onClick={item.onClick}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );

    const hrmPopoverContent = (
        <div className="crm-popover-menu">
            {hrmMenuItems.map(item => (
                <div
                    key={item.key}
                    className={`crm-popover-item ${selectedKey === item.key ? 'active' : ''}`}
                    onClick={item.onClick}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );

    const settingsPopoverContent = (
        <div className="crm-popover-menu">
            {settingsMenuItems.map(item => (
                <div
                    key={item.key}
                    className={`crm-popover-item ${selectedKey === item.key ? 'active' : ''}`}
                    onClick={item.onClick}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );

    

    const handleMenuClick = ({ key }) => {
        if (key === 'crm-collapsed' || key === 'hrm-collapsed') {
            return;
        }

        if (!hasDashboardAccess) {
            return; // Don't navigate if user doesn't have dashboard access
        }

        setSelectedKey(key);
        navigate(key);

        if (isMobile && onBackClick) {
            onBackClick();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (crmPopoverVisible &&
                !event.target.closest('.ant-popover') &&
                !event.target.closest('[data-crm-trigger="true"]')) {
                setCrmPopoverVisible(false);
            }

            if (hrmPopoverVisible &&
                !event.target.closest('.ant-popover') &&
                !event.target.closest('[data-hrm-trigger="true"]')) {
                setHrmPopoverVisible(false);
            }
            
            if (settingsPopoverVisible &&
                !event.target.closest('.ant-popover') &&
                !event.target.closest('[data-settings-trigger="true"]')) {
                setSettingsPopoverVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [crmPopoverVisible, hrmPopoverVisible, settingsPopoverVisible]);

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={256}
            collapsedWidth={80}
            className="dashboard-sidebar"
            style={{
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                background: 'var(--bg-primary)',
                boxShadow: '0 1px 4px var(--shadow-color)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                zIndex: 100,
                transform: 'none'
            }}
        >
            <div className="sidebar-logo">
                {isMobile && (
                    <Button
                        type="text"
                        icon={<RiArrowLeftSLine />}
                        onClick={onBackClick}
                        className="back-button"
                        style={{ outline: 'none' }}
                    />
                )}
                <Title level={4} className="sidebar-logo-text">
                    {collapsed && !isMobile ? (userRole?.charAt(0).toUpperCase() || 'U') : (userRole?.charAt(0).toUpperCase() + userRole?.slice(1).toLowerCase() || 'User')}
                </Title>
            </div>

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                openKeys={openKeys}
                onOpenChange={handleOpenChange}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    maxHeight: 'calc(100vh - 160px)',
                    WebkitOverflowScrolling: 'touch'
                }}
                className="sidebar-menu"
            />

            <div className="sidebar-footer">
                {collapsed && !isMobile ? (
                    <div className="sidebar-footer-collapsed">
                        <Tooltip title={user?.username || 'User'} placement="right">
                            <Avatar className="sidebar-footer-avatar">
                                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </Avatar>
                        </Tooltip>
                        <Tooltip title="Profile" placement="right">
                            <div
                                className={`profile-link ${!hasDashboardAccess ? 'disabled-menu-item' : ''}`}
                                onClick={() => handleMenuItemClick(`${getBasePath()}/profile`)}
                            >
                                <RiUserLine />
                            </div>
                        </Tooltip>
                        <Tooltip title="Logout" placement="right">
                            <Button
                                type="text"
                                icon={<RiLogoutCircleFill />}
                                onClick={() => handleMenuItemClick('logout')}
                                className="logout-button"
                            >
                                {!collapsed && 'Logout'}
                            </Button>
                        </Tooltip>
                    </div>
                ) : (
                    <div className="sidebar-footer-expanded">
                        <div className="sidebar-footer-user">
                            <Avatar className="sidebar-footer-avatar">
                                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </Avatar>
                            <div className="sidebar-footer-info">
                                <div className="sidebar-footer-name">
                                    {user?.username || 'User'}
                                </div>
                                <div className="sidebar-footer-role">
                                    {userRole}
                                </div>
                            </div>
                        </div>
                        <div
                            className={`profile-link ${!hasDashboardAccess ? 'disabled-menu-item' : ''}`}
                            onClick={() => handleMenuItemClick(`${getBasePath()}/profile`)}
                        >
                            <RiUserLine />
                            <span>Profile</span>
                        </div>
                        <div className="sidebar-footer-logout" onClick={() => handleMenuItemClick('logout')}>
                            <RiLogoutCircleFill />
                            <span>Logout</span>
                        </div>
                    </div>
                )}
            </div>
        </Sider>
    );
};

export default DashboardSidebar;
