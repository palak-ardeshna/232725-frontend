import React, { useState, useEffect, useRef } from 'react';
import { Layout, Drawer } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../auth/services/authSlice';
import { useGetRoleQuery } from '../../config/api/apiServices';
import DashboardHeader from './header';
import DashboardSidebar from './sidebar';
import DashboardFooter from './footer';
import './styles.scss';

const { Content } = Layout;

const DashboardLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const location = useLocation();
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();

    const hasRefetched = useRef(false);

    const { refetch } = useGetRoleQuery(user?.role_id, {
        skip: !user?.role_id || hasRefetched.current,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false
    });

    useEffect(() => {
        if (user?.role_id && !hasRefetched.current) {
            hasRefetched.current = true;
        }
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
            if (window.innerWidth <= 1024) {
                setCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const toggleMobileMenu = () => {
        if (isMobile) {
            setMobileDrawerVisible(!mobileDrawerVisible);
        } else {
            setCollapsed(!collapsed);
        }
    };

    const closeMobileDrawer = () => {
        setMobileDrawerVisible(false);
    };

    useEffect(() => {
        setMobileDrawerVisible(false);
    }, [location.pathname]);

    return (
        <Layout className="dashboard-layout">
            {!isMobile && <DashboardSidebar collapsed={collapsed} />}

            {isMobile && (
                <Drawer
                    placement="left"
                    closable={false}
                    onClose={closeMobileDrawer}
                    open={mobileDrawerVisible}
                    width={256}
                    styles={{ body: { padding: 0 } }}
                    className="mobile-sidebar-drawer"
                >
                    <DashboardSidebar
                        collapsed={false}
                        isMobile={true}
                        onBackClick={closeMobileDrawer}
                    />
                </Drawer>
            )}

            <Layout
                className={`dashboard-layout-main ${!collapsed && !isMobile ? 'expanded' : ''}`}
            >
                <DashboardHeader
                    collapsed={collapsed}
                    setCollapsed={toggleMobileMenu}
                    isMobile={isMobile}
                />

                <div className="dashboard-content-wrapper">
                    <Content className="dashboard-layout-content">
                        <Outlet />
                    </Content>
                </div>

                <DashboardFooter />
            </Layout>
        </Layout>
    );
};

export default DashboardLayout; 