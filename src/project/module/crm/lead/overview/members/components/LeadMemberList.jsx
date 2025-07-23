import React from 'react';
import { DeleteOutlined, EditOutlined, CrownOutlined } from '@ant-design/icons';
import { Avatar, Button, Badge, Typography, Spin, Card, Tag, Tooltip } from 'antd';
import { FiUsers } from 'react-icons/fi';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils.jsx';

const { Text } = Typography;

const LeadMemberList = ({
    members = [],
    isLoading = false,
    onDelete,
    team,
    employees = [],
    roles = [],
    designations = [],
    onEditTeamMembers,
    hideTeamHeader = false
}) => {

    const teamLead = team?.teamLead;

    const processedMembers = React.useMemo(() => {
        if (!team || !employees.length) return [];

        let memberIds = [];
        if (Array.isArray(team.members)) {
            memberIds = [...team.members];
        } else if (typeof team.members === 'string') {
            try {
                const parsed = JSON.parse(team.members);
                if (Array.isArray(parsed)) {
                    memberIds = [...parsed];
                } else if (typeof parsed === 'object') {
                    memberIds = Object.keys(parsed);
                }
            } catch (e) {
                memberIds = [];
            }
        } else if (typeof team.members === 'object') {
            memberIds = Object.keys(team.members);
        }

        if (team.teamLead && !memberIds.includes(team.teamLead)) {
            memberIds.push(team.teamLead);
        }

        // Create designation map
        const designationMap = {};
        if (designations && designations.length > 0) {
            designations.forEach(designation => {
                designationMap[designation.id] = designation.designation;
            });
        }

        return memberIds.map(memberId => {
            const employee = employees.find(emp => emp.id === memberId);
            const isTeamLead = team.teamLead === memberId;

            if (employee) {
                let roleName = 'Employee';
                if (employee.role_id && roles.length > 0) {
                    const role = roles.find(r => r.id === employee.role_id);
                    if (role) {
                        roleName = role.role_name;
                    }
                }

                const designationName = designationMap[employee.designation] || 'Not specified';

                return {
                    ...employee,
                    isTeamLead,
                    roleName: roleName,
                    designationName: designationName
                };
            }

            const existingMember = members.find(m => m.id === memberId);
            if (existingMember) {
                return {
                    ...existingMember,
                    isTeamLead,
                    roleName: existingMember.roleName || 'Employee',
                    designationName: existingMember.designationName || 'Not specified'
                };
            }

            return {
                id: memberId,
                username: 'Unknown Employee',
                roleName: 'Employee',
                designationName: 'Not specified',
                isTeamLead
            };
        });
    }, [team, employees, members, roles, designations]);

    const fields = [
        {
            name: 'username',
            title: 'Username',
            render: (text, record) => (
                <div className="name-container">
                    <Avatar>
                        {record.isTeamLead ? <CrownOutlined /> : text?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Tooltip title={text || 'Unknown'}>
                        <span className={`name ${record.isTeamLead ? 'team-lead-name' : ''}`}>
                            {
                                (() => {
                                    const name = text || 'Unknown';
                                    return name.length > 30 ? `${name.substring(0, 30)}...` : name;
                                })()
                            }
                        </span>
                    </Tooltip>
                    {record.isTeamLead && (
                        <span style={{ color: 'var(--primary-color)', marginLeft: '8px', fontWeight: 'bold' }}>Team Leader</span>
                    )}
                </div>
            )
        },
        {
            name: 'designation',
            title: 'Designation',
            render: (_, record) => {
                const designation = record.designationName || 'Not specified';
                return (
                    <Tooltip title={designation}>
                        <Badge
                            status="processing"
                            text={designation}
                            style={{ color: 'var(--primary-color)' }}
                            className="role-badge"
                        />
                    </Tooltip>
                );
            }
        },
        {
            name: 'roleName',
            title: 'Role',
            render: (_, record) => {
                const roleDisplay = record.roleName || 'Employee';
                return (
                    <Tooltip title={roleDisplay}>
                        <Badge
                            status="processing"
                            text={roleDisplay}
                            style={{ color: 'var(--primary-color)' }}
                            className="role-badge"
                        />
                    </Tooltip>
                );
            }
        },
        {
            name: 'action',
            title: 'Action',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    className='btn-delete'
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(record)}
                    disabled={record.isTeamLead && team && team.members && team.members.length > 1}
                >
                    Delete
                </Button>
            )
        }
    ];
    const columns = generateColumns(fields);

    const membersToDisplay = processedMembers.length > 0 ? processedMembers : members;

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
                <Text>Loading team information...</Text>
            </div>
        );
    }

    return (
        <div className="team-container">
            {team && !hideTeamHeader && (
                <Card className="team-header-card">
                    <div className="team-header">
                        <div className="team-info">
                            <FiUsers className="team-icon" />
                            <Text strong className="team-name">Team: {team.teamName}</Text>
                            <Badge count={membersToDisplay.length} className="member-count" />
                            {teamLead && (
                                <Tag color="gold" className="leader-tag">
                                    <CrownOutlined /> Team Leader: {membersToDisplay.find(m => m.isTeamLead)?.username || 'Assigned'}
                                </Tag>
                            )}
                        </div>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={onEditTeamMembers}
                        >
                            Edit Members
                        </Button>
                    </div>
                </Card>
            )}
            <div className="table-list">
                <CommonTable
                    module="teamMember"
                    isLoading={isLoading}
                    data={membersToDisplay.map((member, index) => {
                        return {
                            ...member,
                            key: member.id || index,
                            roleName: member.roleName || 'Employee'
                        };
                    })}
                    columns={columns}
                    pagination={false}
                    extraProps={{
                        itemName: 'members',
                        className: 'member-table'
                    }}
                    searchableColumns={['username', 'roleName', 'designationName']}
                />
            </div>
        </div>
    );
};

export default LeadMemberList; 