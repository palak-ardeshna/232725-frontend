import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../components/AdvancedForm';
import { Button, Modal, message, Badge, Tooltip, Avatar, Space } from 'antd';
import { UserAddOutlined, ProjectOutlined } from '@ant-design/icons';
import { designationApi } from '../../../../../config/api/apiServicesImpl';
import EmployeeForm from '../../../hrm/employee/components/EmployeeForm';
import { useGetRolesQuery, useGetEmployeesQuery, useGetProjectsQuery, useGetTeamMembersQuery } from '../../../../../config/api/apiServices';
import { ModalTitle } from '../../../../../components/AdvancedForm';
import { getFilteredRoles } from '../../../../../utils/roleUtils';

const validationSchema = Yup.object().shape({
    teamName: Yup.string()
        .required('Team name is required')
        .min(3, 'Team name must be at least 3 characters')
        .max(50, 'Team name must be less than 50 characters'),
    teamLead: Yup.string()
        .nullable(),
    members: Yup.array()
        .nullable()
});

const TeamMemberForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const [processedValues, setProcessedValues] = useState(initialValues || { teamName: '', teamLead: null, members: null });
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({ limit: 'all' });
    const { data: projectsData } = useGetProjectsQuery({ limit: 'all' });
    const { data: teamsData } = useGetTeamMembersQuery({ limit: 'all' });

    // Fetch employees
    const { data: employeesData, isLoading: isLoadingEmployees, refetch: refetchEmployees } = useGetEmployeesQuery({
        page: 1,
        limit: 1000 // Fetch a large number to ensure we get all employees
    });

    // Use the common utility function to filter out employee roles
    const roles = getFilteredRoles(rolesData, employeesData);
    const allRoles = rolesData?.data?.items || [];
    const projects = projectsData?.data?.items || [];
    const teams = teamsData?.data?.items || [];
    const employees = employeesData?.data?.items || [];

    const { data: designationsData, isLoading: isLoadingDesignations } = designationApi.useGetAllQuery({
        limit: 'all'
    });

    const designations = designationsData?.data?.items || [];

    // Create a map for designations
    const designationMap = {};
    if (designations && designations.length > 0) {
        designations.forEach(designation => {
            designationMap[designation.id] = designation.designation;
        });
    }

    // Get project count and names for each team member
    const getProjectInfo = (userId) => {
        // Count projects where this user is in the team
        let count = 0;
        let projectNames = [];

        if (projects && projects.length > 0) {
            // Get all teamIds from projects
            const teamIds = projects
                .filter(project => project.teamId)
                .map(project => project.teamId);

            // Get unique teamIds
            const uniqueTeamIds = [...new Set(teamIds)];

            // For each unique teamId, check if the user is a member
            uniqueTeamIds.forEach(teamId => {
                // Find the team in the teams data
                const team = teams.find(t => t.id === teamId);
                if (team && team.members) {
                    let memberIds = [];

                    // Parse the members based on its type
                    if (typeof team.members === 'string') {
                        try {
                            memberIds = JSON.parse(team.members);
                        } catch (e) {
                            memberIds = [];
                        }
                    } else if (Array.isArray(team.members)) {
                        memberIds = team.members;
                    } else if (typeof team.members === 'object') {
                        memberIds = Object.keys(team.members);
                    }

                    // If the user is a member of this team, count the projects assigned to this team
                    if (memberIds.includes(userId)) {
                        const projectsForTeam = projects.filter(p => p.teamId === teamId);
                        count += projectsForTeam.length;

                        // Collect project names
                        projectsForTeam.forEach(project => {
                            if (project.projectTitle) {
                                projectNames.push(project.projectTitle);
                            }
                        });
                    }
                }
            });
        }
        return { count, projectNames };
    };

    const getEmployeeDisplayName = (employee) => {
        return employee.first_name && employee.last_name
            ? `${employee.first_name} ${employee.last_name}`
            : employee.username || 'Unnamed Employee';
    };

    const getTeamLeaderOptions = () => {
        if (!employees || employees.length === 0) return [];

        return employees.map(employee => ({
            value: employee.id,
            label: (
                <div className="name-container">
                    <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                        {(employee.username || 'E').charAt(0).toUpperCase()}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <span className="name">{employee.username || 'Unknown'}</span>
                        {employee.designation && (
                            <div className="role-badge">
                                <Badge status="success" />
                                <span className="role-text">
                                    {typeof employee.designation === 'object'
                                        ? employee.designation.designation
                                        : employee.designation}
                                </span>
                            </div>
                        )}
                        {employee.role && (
                            <div className="role-badge">
                                <Badge status="processing" />
                                <span className="role-text">
                                    {typeof employee.role === 'object'
                                        ? employee.role.role_name
                                        : employee.role}
                                </span>
                            </div>
                        )}
                    </Space>
                </div>
            )
        }));
    };

    const getMemberOptions = () => {
        if (!employees || employees.length === 0) return [];

        return employees.map(employee => ({
            value: employee.id,
            label: (
                <div className="name-container">
                    <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                        {(employee.username || 'E').charAt(0).toUpperCase()}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <span className="name">{employee.username || 'Unknown'}</span>
                        {employee.designation && (
                            <div className="role-badge">
                                <Badge status="success" />
                                <span className="role-text">
                                    {typeof employee.designation === 'object'
                                        ? employee.designation.designation
                                        : employee.designation}
                                </span>
                            </div>
                        )}
                        {employee.role && (
                            <div className="role-badge">
                                <Badge status="processing" />
                                <span className="role-text">
                                    {typeof employee.role === 'object'
                                        ? employee.role.role_name
                                        : employee.role}
                                </span>
                            </div>
                        )}
                    </Space>
                </div>
            )
        }));
    };

    useEffect(() => {
        if (initialValues) {
            let processedMembers = [];

            if (initialValues.members) {
                if (Array.isArray(initialValues.members)) {
                    processedMembers = initialValues.members;
                } else if (typeof initialValues.members === 'object') {
                    processedMembers = Object.values(initialValues.members);
                } else if (typeof initialValues.members === 'string') {
                    try {
                        const parsed = JSON.parse(initialValues.members);
                        if (Array.isArray(parsed)) {
                            processedMembers = parsed;
                        } else if (typeof parsed === 'object') {
                            processedMembers = Object.values(parsed);
                        }
                    } catch (e) {
                        processedMembers = [];
                    }
                }
            }

            setProcessedValues({
                ...initialValues,
                members: processedMembers
            });
        } else {
            setProcessedValues({ teamName: '', teamLead: null, members: null });
        }
    }, [initialValues]);

    const handleAddEmployee = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setEmployeeModalVisible(true);
    };

    const handleEmployeeCancel = () => {
        setEmployeeModalVisible(false);
    };

    const handleEmployeeSubmit = async (values) => {
        try {
            // Handle employee creation through the employee form
            setEmployeeModalVisible(false);
            refetchEmployees();
            message.success('Employee added successfully');
        } catch (error) {
            message.error('Failed to add employee');
        }
    };

    const employeeOptions = Array.isArray(employees)
        ? employees.map(employee => {
            const employeeName = employee.first_name && employee.last_name
                ? `${employee.first_name} ${employee.last_name}`
                : employee.username || 'Unnamed Employee';

            const { count, projectNames } = getProjectInfo(employee.id);

            // Get role name
            let roleName = 'User';
            if (employee.role_id) {
                const userRole = allRoles.find(r => r.id === employee.role_id);
                roleName = userRole ? (userRole.role_name || userRole.name || 'User') : 'User';
            } else if (employee.role && typeof employee.role === 'object' && employee.role.role_name) {
                roleName = employee.role.role_name;
            } else if (employee.role && typeof employee.role === 'string') {
                roleName = employee.role;
            }

            // Get designation name from designation_id
            let designationName = null;
            if (employee.designation_id && designationMap[employee.designation_id]) {
                designationName = designationMap[employee.designation_id];
            } else if (employee.designation && typeof employee.designation === 'object' && employee.designation.designation) {
                designationName = employee.designation.designation;
            } else if (employee.designation && typeof employee.designation === 'string') {
                designationName = employee.designation;
            }

            const label = (
                <div className="name-container dropdown-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tooltip title={employeeName}>
                            <span className="name">
                                {employeeName.length > 20 ? `${employeeName.substring(0, 20)}...` : employeeName}
                            </span>
                        </Tooltip>
                        {roleName && (
                            <span className="role-badge">
                                <Badge status="processing" />
                                <Tooltip title={roleName}>
                                    <span className="role-text">
                                        {roleName.length > 15 ? `${roleName.substring(0, 15)}...` : roleName}
                                    </span>
                                </Tooltip>
                            </span>
                        )}
                        {designationName && (
                            <span className="role-badge">
                                <Badge status="success" />
                                <Tooltip title={designationName}>
                                    <span className="role-text">
                                        {designationName.length > 15 ? `${designationName.substring(0, 15)}...` : designationName}
                                    </span>
                                </Tooltip>
                            </span>
                        )}
                    </div>
                    <Tooltip title={
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                {count} project{count !== 1 ? 's' : ''} assigned:
                            </div>
                            {projectNames.length > 0 ? (
                                <ul style={{ margin: '0', paddingLeft: '15px' }}>
                                    {projectNames.map((name, index) => (
                                        <li key={index} style={{ marginBottom: '2px' }}>{name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div>No projects assigned</div>
                            )}
                        </div>
                    }>
                        <div
                            className="project-count-badge"
                            style={{
                                backgroundColor: count > 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                border: `1px solid ${count > 0 ? 'var(--primary-color)' : 'var(--bg-primary)'}`,
                            }}
                        >
                            <ProjectOutlined style={{
                                color: count > 0 ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontSize: '12px',
                            }} />
                            <span style={{
                                color: count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}>
                                {count}
                            </span>
                        </div>
                    </Tooltip>
                </div>
            );

            return {
                value: employee.id,
                label: label
            };
        })
        : [];

    const teamMemberFields = [
        {
            name: 'teamName',
            label: 'Team Name',
            type: 'text',
            placeholder: 'Enter team name',
            rules: [
                { required: true, message: 'Please enter team name' },
                { min: 3, message: 'Team name must be at least 3 characters' },
                { max: 50, message: 'Team name must be less than 50 characters' }
            ],
            span: 24
        },
        {
            name: 'members',
            label: 'Team Members',
            type: 'select',
            placeholder: 'Select team members',
            mode: 'multiple',
            options: employeeOptions,
            loading: isLoadingEmployees,
            disabled: isLoadingEmployees,
            span: 24,
            rules: [
                { required: true, message: 'Please select at least one team member' }
            ],
            popupRender: (menu) => (
                <>
                    {menu}
                    <div style={{
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        width: '100%',
                        boxSizing: 'border-box',
                        gap: '8px'
                    }}>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={handleAddEmployee}
                            style={{
                                backgroundColor: '#00a76f',
                                borderColor: '#00a76f',
                                width: '30%',
                                height: '38px'
                            }}
                        >
                            Add Employee
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                if (document.activeElement) {
                                    document.activeElement.blur();
                                }
                            }}
                            style={{
                                width: '30%',
                                height: '38px'
                            }}
                        >
                            Done
                        </Button>
                    </div>
                </>
            )
        },
        {
            name: 'teamLead',
            label: 'Team Leader',
            type: 'select',
            placeholder: 'Select team leader',
            options: getTeamLeaderOptions(),
            loading: isLoadingEmployees,
            disabled: isLoadingEmployees,
            span: 24,
            rules: [
                { required: true, message: 'Please select team leader' }
            ],
            dependencies: ['members'],
            shouldUpdate: (prevValues, currentValues) => prevValues.members !== currentValues.members,
            renderComponent: ({ field, form }) => {
                // Filter options to only show selected team members
                const selectedMembers = form.getFieldValue('members') || [];
                const filteredOptions = getMemberOptions().filter(option =>
                    selectedMembers.includes(option.value)
                );

                return (
                    <AdvancedForm.Item
                        name={field.name}
                        label={field.label}
                        rules={field.rules}
                    >
                        <AdvancedForm.Select
                            placeholder={field.placeholder}
                            options={filteredOptions}
                            loading={field.loading}
                            disabled={field.disabled || filteredOptions.length === 0}
                            allowClear
                        />
                    </AdvancedForm.Item>
                );
            }
        }
    ];

    return (
        <>
            <AdvancedForm
                initialValues={processedValues}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
                onCancel={onCancel}
                fields={teamMemberFields}
                validationSchema={validationSchema}
                submitButtonText={initialValues ? 'Update Team' : 'Create Team'}
                resetOnSubmit={true}
            />

            <Modal
                title={<ModalTitle icon={<UserAddOutlined />} title="Add Employee" />}
                open={employeeModalVisible}
                onCancel={handleEmployeeCancel}
                footer={null}
                width={800}
                className="employee-form-modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <EmployeeForm
                    roles={roles}
                    isLoadingRoles={isLoadingRoles}
                    isSubmitting={false}
                    onSubmit={handleEmployeeSubmit}
                    onCancel={handleEmployeeCancel}
                />
            </Modal>
        </>
    );
};

export default TeamMemberForm; 