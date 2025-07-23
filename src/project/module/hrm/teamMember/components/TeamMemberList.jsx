import React from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Badge, Tooltip, Tag, Space, Avatar, Spin } from 'antd';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';

const TeamMemberList = ({
    teamMembers = [],
    employees = [],
    roles = [],
    designations = [],
    isLoading = false,
    currentPage = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete,
    getEmployeeDisplayName
}) => {
    const navigate = useNavigate();

    // Create designation map
    const designationMap = {};
    if (designations && designations.length > 0) {
        designations.forEach(designation => {
            designationMap[designation.id] = designation.designation;
        });
    }

    const getMemberCount = (members) => {
        if (!members) return 0;

        if (Array.isArray(members)) {
            return members.length;
        } else if (typeof members === 'object') {
            return Object.keys(members).length;
        } else if (typeof members === 'string') {
            try {
                const parsed = JSON.parse(members);
                if (Array.isArray(parsed)) {
                    return parsed.length;
                } else if (typeof parsed === 'object') {
                    return Object.keys(parsed).length;
                }
            } catch (e) {
                return 0;
            }
        }
        return 0;
    };

    // Function to get member names with roles for display
    const getMemberNames = (members) => {
        if (!members || !Array.isArray(members) || members.length === 0) return 'No members';

        // Find employee objects for each member ID
        const memberEmployees = members.map(memberId => {
            return employees.find(employee => employee.id === memberId);
        }).filter(Boolean);

        // Get display names for the first 2 members
        const displayMembers = memberEmployees.slice(0, 2).map(employee => {
            let roleName = '';
            if (employee.role_id) {
                const employeeRole = roles.find(r => r.id === employee.role_id);
                roleName = employeeRole ? (employeeRole.role_name || employeeRole.name || 'Employee') : '';
            } else if (employee.role && typeof employee.role === 'object' && employee.role.role_name) {
                roleName = employee.role.role_name;
            } else if (employee.role && typeof employee.role === 'string') {
                roleName = employee.role;
            }

            const employeeName = employee.username || 'Unknown';

            return (
                <div key={employee.id} className="member-item">
                    <Tooltip title={employeeName}>
                        <span className="member-name">
                            {employeeName.length > 20 ? `${employeeName.substring(0, 20)}...` : employeeName}
                        </span>
                    </Tooltip>
                    {roleName && (
                        <span className="role-badge-small">
                            <Badge status="processing" size="small" />
                            <Tooltip title={roleName}>
                                <span className="role-text-small">
                                    {roleName.length > 15 ? `${roleName.substring(0, 15)}...` : roleName}
                                </span>
                            </Tooltip>
                        </span>
                    )}
                </div>
            );
        });

        // Add "and X more" if there are more than 2 members
        if (members.length > 2) {
            return (
                <div className="member-list">
                    {displayMembers}
                    <div className="more-members">and {members.length - 2} more</div>
                </div>
            );
        }

        return <div className="member-list">{displayMembers}</div>;
    };

    const getTeamLeaderInfo = (teamLeadId) => {
        if (isLoading || !employees) {
            return <Spin size="small" />;
        }

        if (!teamLeadId) {
            return <span className="no-leader">Not assigned</span>;
        }

        const teamLead = employees.find(employee => employee.id === teamLeadId);
        if (!teamLead) {
            return (
                <div className="name-container dropdown-item">
                    <Space align="center">
                        <Avatar style={{ backgroundColor: 'var(--error-color)' }}>!</Avatar>
                        <Space direction="vertical" size={0}>
                            <span className="name error-text">Employee not found</span>
                            <div className="role-badge">
                                <Badge status="error" />
                                <span className="role-text">ID: {teamLeadId}</span>
                            </div>
                        </Space>
                    </Space>
                </div>
            );
        }

        const leaderName = teamLead.username || 'Unknown';
        const designationName = designationMap[teamLead.designation] || '';

        return (
            <div className="name-container dropdown-item">
                <Space align="center">
                    <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                        {leaderName ? leaderName.charAt(0).toUpperCase() : 'E'}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <Tooltip title={leaderName}>
                            <span className="name">
                                {leaderName.length > 20 ? `${leaderName.substring(0, 20)}...` : leaderName}
                            </span>
                        </Tooltip>
                        {designationName && (
                            <Tooltip title={designationName}>
                                <Badge
                                    className="role-badge"
                                    status="processing"
                                    text={designationName}
                                    style={{ color: 'var(--primary-color)' }}
                                />
                            </Tooltip>
                        )}
                    </Space>
                </Space>
            </div>
        );
    };

    const handleTeamNameClick = (record) => {
        navigate(`/admin/hrm/team-member/overview/${record.id}`);
    };

    const fields = [
        {
            name: 'teamName',
            title: 'Team Name',
            render: (text, record) => (
                <div className="name-container">
                    <Tooltip title={text}>
                        <span className="team-name" onClick={() => handleTeamNameClick(record)} style={{ cursor: 'pointer' }}>
                            {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                        </span>
                    </Tooltip>
                </div>
            )
        },
        {
            name: 'teamLead',
            title: 'Team Leader',
            render: (teamLeadId, record) => {
                if (isLoading || !employees) {
                    return <Spin size="small" />;
                }

                if (!teamLeadId) {
                    return <span className="no-leader">Not assigned</span>;
                }

                const teamLead = employees.find(employee => employee.id === teamLeadId);
                if (!teamLead) {
                    return (
                        <div className="name-container">
                            <Avatar style={{ backgroundColor: 'var(--error-color)' }}>!</Avatar>
                            <span className="name error-text">Employee not found</span>
                        </div>
                    );
                }

                const leaderName = teamLead.username || 'Unknown';
                const designationName = designationMap[teamLead.designation] || '';

                return (
                    <div className="name-container">
                        <Avatar style={{ backgroundColor: 'var(--primary-color)' }}>
                            {leaderName ? leaderName.charAt(0).toUpperCase() : 'E'}
                        </Avatar>
                        <Space direction="vertical" size={0}>
                            <Tooltip title={leaderName}>
                                <span className="name">
                                    {leaderName.length > 30 ? `${leaderName.substring(0, 30)}...` : leaderName}
                                </span>
                            </Tooltip>
                            {designationName && (
                                <Tooltip title={designationName}>
                                    <Badge
                                        className="role-badge"
                                        status="processing"
                                        text={designationName}
                                        style={{ color: 'var(--primary-color)' }}
                                    />
                                </Tooltip>
                            )}
                        </Space>
                    </div>
                );
            },
            width: '300px'
        },
        {
            name: 'members',
            title: 'Members',
            render: (members, record) => {
                const count = getMemberCount(members);
                return (
                    <div className="member-count">
                        {count} {count === 1 ? 'member' : 'members'}
                    </div>
                );
            }
        },
        {
            name: 'roleName',
            title: 'Role',
            render: (text, record) => {
                const teamLead = employees.find(employee => employee.id === record.teamLead);
                if (!teamLead) return '-';

                let roleName = '';
                if (teamLead.role_id) {
                    const role = roles.find(r => r.id === teamLead.role_id);
                    roleName = role ? (role.role_name || role.name || 'Employee') : '';
                } else if (teamLead.role && typeof teamLead.role === 'object' && teamLead.role.role_name) {
                    roleName = teamLead.role.role_name;
                } else if (teamLead.role && typeof teamLead.role === 'string') {
                    roleName = teamLead.role;
                }

                return roleName ? (
                    <Tooltip title={roleName}>
                        <Badge
                            className="role-badge"
                            style={{ color: 'var(--primary-color)' }}
                            status="processing"
                            text={roleName.length > 20 ? `${roleName.substring(0, 20)}...` : roleName}
                        />
                    </Tooltip>
                ) : '-';
            }
        },
        { name: 'createdAt', title: 'Created At' },
        { name: 'updatedAt', title: 'Updated At' }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: (record) => handleTeamNameClick(record),
            module: 'teamMember',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'teamMember',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: (record) => {
                onDelete(record);
            },
            module: 'teamMember',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt', 'updatedAt']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={teamMembers.map(teamMember => ({ ...teamMember, key: teamMember.id }))}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'team members',
                    className: 'team-member-table'
                }}
                searchableColumns={['teamName']}
                dateColumns={['createdAt', 'updatedAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="teamMember"
                onRowClick={handleTeamNameClick}
            />
        </div>
    );
};

export default TeamMemberList; 