import React from "react";
import { createBrowserRouter, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import ErrorBoundary from '../components/ErrorBoundary';

import Login from "../auth/login/index.jsx";
import Dashboard from "../project/index.jsx";
import DashboardLayout from "../project/layout/index.jsx";
import NotFound from "../common/notFound/index.jsx";
import Lead from "../project/module/crm/lead/index.jsx";
import LeadOverview from "../project/module/crm/lead/overview/index.jsx";
import Contact from "../project/module/crm/contact/index.jsx";
import Client from "../project/module/crm/client/index.jsx";
import ClientOverview from "../project/module/crm/client/overview/index.jsx";
import CRMSystem from "../project/module/crm/system/index.jsx";
import Proposal from "../project/module/crm/proposal/index.jsx";
import Project from "../project/module/crm/project/index.jsx";
import ProjectOverview from "../project/module/crm/project/overview/index.jsx";
import Role from "../project/module/role/index.jsx";
import EmployeeModule from "../project/module/hrm/employee/index.jsx";
import DesignationModule from "../project/module/hrm/designation/index.jsx";
import DepartmentModule from "../project/module/hrm/department/index.jsx";
import TeamMemberModule from "../project/module/hrm/teamMember/index.jsx";
import TeamMemberOverview from "../project/module/hrm/teamMember/overview/index.jsx";
import NotesPage from "../project/module/notes/NotesPage.jsx";
import ContactOverview from "../project/module/crm/contact/overview/index.jsx";
import HolidayModule from "../project/module/hrm/holiday/index.jsx";
import LeaveModule from "../project/module/hrm/leave/index.jsx";
import AttendanceModule from "../project/module/hrm/attendance/index.jsx";
import InquiryModule from "../project/module/hrm/inquiry/index.jsx";
import CompanyModule from "../project/module/hrm/company/index.jsx";
import PlanModule from "../project/module/hrm/plan/index.jsx";
import SettingsModule from "../project/module/hrm/settings/index.jsx";
import Profile from "../project/module/profile/index.jsx";
import { parsePermissions, hasPermission } from '../utils/permissionUtils.jsx';
import Task from "../project/module/crm/task/index.jsx";
import CompanyDetailsPage from '../project/module/profile/components/CompanyDetailsPage';
import { BuildOutlined } from '@ant-design/icons';


const ProtectedRoute = ({ children, requiredPermission }) => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userType = user?.userType?.replace(/\s+/g, '-') || localStorage.getItem('userType')?.replace(/\s+/g, '-') || 'admin';
    const permissions = parsePermissions(user?.permissions);
    const location = useLocation();

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // If employee without dashboard access trying to access anything except dashboard
    // Note: They still need dashboard route access to see the restriction message
    if (user?.userType === 'employee' && user?.isDashboard === false &&
        !location.pathname.includes('/dashboard')) {
        return <Navigate to={`/${userType}/dashboard`} replace />;
    }

    // Check if module permission is required and user has it
    if (requiredPermission && !hasPermission(userType, permissions, requiredPermission.module, requiredPermission.action)) {
        // Redirect to dashboard if no permission
        return <Navigate to={`/${userType}/dashboard`} replace />;
    }

    return children;
};

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType')?.replace(/\s+/g, '-') || 'admin';

    // If authenticated, redirect to dashboard
    if (token) {
        const dashboardPath = `/${userType}/dashboard`;
        return <Navigate to={dashboardPath} replace />;
    }

    return children;
};

const createRoutes = config => Object.entries(config).map(([path, component]) =>
    typeof component === 'object' && component.element
        ? { path, ...component }
        : { path, element: component }
);

const modules = {
    main: {
        "dashboard": <Dashboard />,
        "profile": <Profile />,
        "notes": <NotesPage />,
        "role": <ProtectedRoute requiredPermission={{ module: "role", action: "read" }}><Role /></ProtectedRoute>,
        "project": <ProtectedRoute requiredPermission={{ module: "project", action: "read" }}><Project /></ProtectedRoute>,
        "project/overview/:id": <ProtectedRoute requiredPermission={{ module: "project", action: "read" }}><ProjectOverview /></ProtectedRoute>
    },
    crm: {
        "lead": <ProtectedRoute requiredPermission={{ module: "lead", action: "read" }}><Lead /></ProtectedRoute>,
        "lead/overview/:id": <ProtectedRoute requiredPermission={{ module: "lead", action: "read" }}><LeadOverview /></ProtectedRoute>,
        "contact": <ProtectedRoute requiredPermission={{ module: "contact", action: "read" }}><Contact /></ProtectedRoute>,
        "contact/overview/:id": <ProtectedRoute requiredPermission={{ module: "contact", action: "read" }}><ContactOverview /></ProtectedRoute>,
        "client": <ProtectedRoute requiredPermission={{ module: "client", action: "read" }}><Client /></ProtectedRoute>,
        "client/overview/:id": <ProtectedRoute requiredPermission={{ module: "client", action: "read" }}><ClientOverview /></ProtectedRoute>,
        "proposal": <ProtectedRoute requiredPermission={{ module: "proposal", action: "read" }}><Proposal /></ProtectedRoute>,
        "system": {
            element: <ProtectedRoute requiredPermission={{ module: "system", action: "read" }}><CRMSystem /></ProtectedRoute>,
            children: [
                { path: ":name", element: <ProtectedRoute requiredPermission={{ module: "system", action: "read" }}><CRMSystem /></ProtectedRoute> },
                { index: true, element: <Navigate to="pipeline" replace /> }
            ]
        },
        "task": <ProtectedRoute requiredPermission={{ module: "task", action: "read" }}><Task /></ProtectedRoute>,
    },
    hrm: {
        "employee": <ProtectedRoute requiredPermission={{ module: "employee", action: "read" }}><EmployeeModule /></ProtectedRoute>,
        "designation": <ProtectedRoute requiredPermission={{ module: "designation", action: "read" }}><DesignationModule /></ProtectedRoute>,
        "department": <ProtectedRoute requiredPermission={{ module: "department", action: "read" }}><DepartmentModule /></ProtectedRoute>,
        "team-member": <ProtectedRoute requiredPermission={{ module: "teamMember", action: "read" }}><TeamMemberModule /></ProtectedRoute>,
        "team-member/overview/:id": <ProtectedRoute requiredPermission={{ module: "teamMember", action: "read" }}><TeamMemberOverview /></ProtectedRoute>,
        "holiday": <ProtectedRoute requiredPermission={{ module: "holiday", action: "read" }}><HolidayModule /></ProtectedRoute>,
        "leave": <ProtectedRoute requiredPermission={{ module: "leave", action: "read" }}><LeaveModule /></ProtectedRoute>,
        "attendance": <ProtectedRoute requiredPermission={{ module: "attendance", action: "read" }}><AttendanceModule /></ProtectedRoute>,
        "inquiry": <ProtectedRoute requiredPermission={{ module: "inquiry", action: "read" }}><InquiryModule /></ProtectedRoute>,
        "company": <ProtectedRoute requiredPermission={{ module: "company", action: "read" }}><CompanyModule /></ProtectedRoute>,
        "plan": <ProtectedRoute requiredPermission={{ module: "plan", action: "read" }}><PlanModule /></ProtectedRoute>,
    },
    settings: {
        "office": <ProtectedRoute requiredPermission={{ module: "settings", action: "read" }}><SettingsModule /></ProtectedRoute>
    }
};

const mainRoutes = [
    ...createRoutes(modules.main),
    {
        path: "crm",
        element: <Outlet />,
        children: createRoutes(modules.crm)
    },
    {
        path: "hrm",
        element: <Outlet />,
        children: createRoutes(modules.hrm)
    },
    {
        path: "settings",
        element: <Outlet />,
        children: createRoutes(modules.settings)
    }
];

const router = createBrowserRouter([
    {
        path: "/",
        element: <ErrorBoundary><PublicRoute><Login /></PublicRoute></ErrorBoundary>
    },
    {
        path: "/login",
        element: <ErrorBoundary><PublicRoute><Login /></PublicRoute></ErrorBoundary>
    },
    {
        path: "/dashboard",
        element: <ErrorBoundary><Navigate to={`/${localStorage.getItem('userType')?.replace(/\s+/g, '-') || 'admin'}/dashboard`} replace /></ErrorBoundary>
    },
    {
        path: "/:role",
        element: <ErrorBoundary><ProtectedRoute><DashboardLayout /></ProtectedRoute></ErrorBoundary>,
        children: [
            {
                index: true,
                element: <ErrorBoundary><Navigate to="dashboard" replace /></ErrorBoundary>
            },
            {
                path: "dashboard",
                element: <ErrorBoundary><Dashboard /></ErrorBoundary>
            },
            {
                path: "notes",
                element: <ErrorBoundary><NotesPage /></ErrorBoundary>
            },
            {
                path: "role",
                element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "role", action: "read" }}><Role /></ProtectedRoute></ErrorBoundary>
            },
            {
                path: "project",
                element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "project", action: "read" }}><Project /></ProtectedRoute></ErrorBoundary>
            },
            {
                path: "project/overview/:id",
                element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "project", action: "read" }}><ProjectOverview /></ProtectedRoute></ErrorBoundary>
            },
            {
                path: "profile",
                element: <ErrorBoundary><Profile /></ErrorBoundary>
            },
            {
                path: "company-details",
                element: <ErrorBoundary><CompanyDetailsPage /></ErrorBoundary>
            },
            {
                path: "crm",
                children: [
                    {
                        path: "lead",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "lead", action: "read" }}><Lead /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "lead/overview/:id",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "lead", action: "read" }}><LeadOverview /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "contact",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "contact", action: "read" }}><Contact /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "client",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "client", action: "read" }}><Client /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "client/overview/:id",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "client", action: "read" }}><ClientOverview /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "contact/overview/:id",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "contact", action: "read" }}><ContactOverview /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "proposal",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "proposal", action: "read" }}><Proposal /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "system",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "system", action: "read" }}><CRMSystem /></ProtectedRoute></ErrorBoundary>,
                        children: [
                            {
                                path: ":name",
                                element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "system", action: "read" }}><CRMSystem /></ProtectedRoute></ErrorBoundary>
                            },
                            {
                                index: true,
                                element: <ErrorBoundary><Navigate to="pipeline" replace /></ErrorBoundary>
                            }
                        ]
                    },
                    {
                        path: "task",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "task", action: "read" }}><Task /></ProtectedRoute></ErrorBoundary>
                    }
                ]
            },
            {
                path: "hrm",
                children: [
                    {
                        path: "employee",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "employee", action: "read" }}><EmployeeModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "designation",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "designation", action: "read" }}><DesignationModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "department",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "department", action: "read" }}><DepartmentModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "team-member",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "teamMember", action: "read" }}><TeamMemberModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "team-member/overview/:id",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "teamMember", action: "read" }}><TeamMemberOverview /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "holiday",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "holiday", action: "read" }}><HolidayModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "leave",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "leave", action: "read" }}><LeaveModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "attendance",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "attendance", action: "read" }}><AttendanceModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "inquiry",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "inquiry", action: "read" }}><InquiryModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "company",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "company", action: "read" }}><CompanyModule /></ProtectedRoute></ErrorBoundary>
                    },
                    {
                        path: "plan",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "plan", action: "read" }}><PlanModule /></ProtectedRoute></ErrorBoundary>
                    },
                ]
            },
            {
                path: "settings",
                children: [
                    {
                        path: "office",
                        element: <ErrorBoundary><ProtectedRoute requiredPermission={{ module: "settings", action: "read" }}><SettingsModule /></ProtectedRoute></ErrorBoundary>
                    }
                ]
            }
        ]
    },
    { path: "*", element: <ErrorBoundary><NotFound /></ErrorBoundary> }
]);

export default router;
