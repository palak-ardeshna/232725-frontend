import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Row, Col, Alert, Button } from 'antd';
import { selectCurrentUser, selectIsLogin } from '../auth/services/authSlice';
import { useGetDashboardDataQuery } from './services/dashboardApi';
import Welcome from "../project/components/Welcome";
import StatsCards from '../project/components/StatsCards';
import LeadStatusChart from '../project/components/LeadStatusChart';
import MarketingLeadChart from '../project/components/MarketingLeadChart';
import SalesCategoryChart from '../project/components/SalesCategoryChart';
import LeadsByPipelineChart from '../project/components/LeadsByPipelineChart';
import ProjectStatusChart from '../project/components/ProjectStatusChart';
import ProjectCategoryChart from '../project/components/ProjectCategoryChart';
import ProjectSourceChart from '../project/components/ProjectSourceChart';
import ProjectsByPipelineChart from '../project/components/ProjectsByPipelineChart';
import ProjectPriorityChart from '../project/components/ProjectPriorityChart';
import ProjectCompletionChart from '../project/components/ProjectCompletionChart';
import { useLogout } from '../utils/hooks/useLogout';
import '../project/dashboard.scss';
import { RiLockLine } from 'react-icons/ri';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser);
    const isLoggedIn = useSelector(selectIsLogin);
    const handleLogout = useLogout();

    const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardDataQuery();

    const dashboardCounts = {
        totalLeads: dashboardData?.data?.counts?.totalLeads || 0,
        totalProjects: dashboardData?.data?.counts?.totalProjects || 0,
        totalClients: dashboardData?.data?.counts?.totalClients || 0,
        totalContacts: dashboardData?.data?.counts?.totalContacts || 0
    };

    const leadsByStatus = dashboardData?.data?.leadsByStatus || {};
    const leadsBySource = dashboardData?.data?.leadsBySource || {};
    const leadsByCategory = dashboardData?.data?.leadsByCategory || {};
    const leadsByPipeline = dashboardData?.data?.leadsByPipeline || {};
    const projectsByStatus = dashboardData?.data?.projectsByStatus || {};
    const projectsByCategory = dashboardData?.data?.projectsByCategory || {};
    const projectsBySource = dashboardData?.data?.projectsBySource || {};
    const projectsByPipeline = dashboardData?.data?.projectsByPipeline || {};
    const projectsByPriority = dashboardData?.data?.projectsByPriority || {};
    const projectCompletionTimeline = dashboardData?.data?.projectCompletionTimeline || {};
    const projectValueTimeline = dashboardData?.data?.projectValueTimeline || {};
    const projectDurationTimeline = dashboardData?.data?.projectDurationTimeline || {};
    const checkAuth = useMemo(() => {
        return () => {
            if (!isLoggedIn) {
                navigate('/login', { replace: true });
            }
        };
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (!user) {
        return null;
    }

    // Check if user has dashboard access
    if (user.userType === 'employee' && user.isDashboard === false) {
        return (
            <motion.div
                className="dashboard-restricted"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                    padding: '80px 20px',
                    textAlign: 'center',
                    maxWidth: '800px',
                    margin: '100px auto'
                }}
            >
                <div className="access-restricted-container" style={{
                    background: '#fff0f0',
                    border: '1px solid #ffccc7',
                    borderRadius: '8px',
                    padding: '40px 30px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '80px', color: '#ff4d4f', marginBottom: '20px' }}>
                        <RiLockLine />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', color: '#ff4d4f' }}>
                        Access Restricted
                    </h1>
                    <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                        You do not have permission to access the dashboard.
                    </p>
                    <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                        Your account has been granted limited access to the system.
                    </p>
                    <p style={{ fontSize: '18px', marginBottom: '30px' }}>
                        Please contact your administrator if you believe this is an error.
                    </p>
                </div>
                <Button
                    type="primary"
                    onClick={handleLogout}
                    size="large"
                    style={{
                        fontSize: '18px',
                        height: '50px',
                        paddingLeft: '40px',
                        paddingRight: '40px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    Logout
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Welcome />
            <StatsCards data={dashboardCounts} isLoading={isDashboardLoading} />

            <Row gutter={[16, 16]} className="dashboard-charts-row">
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <LeadStatusChart data={leadsByStatus} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <SalesCategoryChart data={leadsByCategory} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <MarketingLeadChart data={leadsBySource} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <LeadsByPipelineChart data={leadsByPipeline} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <ProjectStatusChart data={projectsByStatus} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <ProjectCategoryChart data={projectsByCategory} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <ProjectSourceChart data={projectsBySource} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <ProjectsByPipelineChart data={projectsByPipeline} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                    <ProjectPriorityChart data={projectsByPriority} isLoading={isDashboardLoading} />
                </Col>
                <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                    <ProjectCompletionChart data={projectCompletionTimeline} isLoading={isDashboardLoading} />
                </Col>
            </Row>
        </motion.div>
    );
};

export default Dashboard; 