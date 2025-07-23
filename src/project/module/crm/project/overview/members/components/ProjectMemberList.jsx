import React from 'react';
import { DeleteOutlined, TeamOutlined, EditOutlined, CrownOutlined } from '@ant-design/icons';
import { Avatar, Button, Badge, Space, Typography, Empty, Spin, Card, Tag, Tooltip } from 'antd';
import { FiUsers } from 'react-icons/fi';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils.jsx';

const { Text } = Typography;

const ProjectMemberList = ({
    members = [],
    isLoading = false,
    onDelete,
    team,
    users = [],
    designations = [],
    hasTeam,
    onEditTeamMembers,
    hideTeamHeader = false
}) => {

    const teamLead = team?.teamLead;

    const fields = [
        {
            name: 'username',
            title: 'Username',
            render: (text, record) => (
                <div className="name-container">
                    <Avatar style={record.isTeamLead ? { backgroundColor: '#faad14' } : {}}>
                        {record.isTeamLead ? <CrownOutlined /> : text?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="user-details">
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
                            <Tag color="gold" className="team-leader-tag">
                                Team Leader
                            </Tag>
                        )}
                    </div>
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
            render: (role) => {
                if (!role) return '-';
                const displayRole = role || 'User';
                return (
                    <Tooltip title={displayRole}>
                        <Badge
                            status="processing"
                            text={displayRole.length > 20 ? `${displayRole.substring(0, 20)}...` : displayRole}
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

    // Process members similar to TeamMemberOverview
    const processedMembers = React.useMemo(() => {
        if (!team || !users.length) return [];

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

        // Check if team lead exists in memberIds, if not add it
        if (team.teamLead && !memberIds.includes(team.teamLead)) {
            memberIds.push(team.teamLead);
        }

        return memberIds.map(memberId => {
            const user = users.find(user => user.id === memberId);
            const isTeamLead = team.teamLead === memberId;

            if (user) {
                // Find designation name if designation_id exists
                let designationName = 'Not specified';
                if (user.designation_id && designations.length > 0) {
                    const designation = designations.find(d => d.id === user.designation_id);
                    if (designation) {
                        designationName = designation.designation;
                    }
                }

                return {
                    ...user,
                    isTeamLead,
                    designationName
                };
            }

            // If user not found in users array, use from members array
            const existingMember = members.find(m => m.id === memberId);
            if (existingMember) {
                return {
                    ...existingMember,
                    isTeamLead,
                    designationName: existingMember.designationName || 'Not specified'
                };
            }

            return {
                id: memberId,
                username: 'Unknown User',
                roleName: 'User',
                isTeamLead,
                designationName: 'Not specified'
            };
        });
    }, [team, users, members, designations]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
                <Text>Loading team information...</Text>
            </div>
        );
    }

    // Prioritize using members directly from props if available, otherwise use processedMembers
    const membersToDisplay = members.length > 0 ? members : processedMembers;

    // Preserve original roleName when available in the direct members data
    const enhancedMembers = membersToDisplay.map(member => {
        // Find the matching member in the original members array to preserve roleNames
        const originalMember = members.find(m => m.id === member.id);

        // If we have an original member with a user id, try to find the full user object
        const userWithDesignation = users.find(u => u.id === member.id);

        // Check if this member is a team lead
        const isTeamLead = team?.teamLead === member.id;

        // Get designation from designations array if user has designation_id
        let designationName = member.designationName || 'Not specified';

        // Try to get designation from user object if available
        if (userWithDesignation?.designation_id && designations.length > 0) {
            const designation = designations.find(d => d.id === userWithDesignation.designation_id);
            if (designation) {
                designationName = designation.designation;
            }
        }
        // Otherwise try from member's designation_id
        else if (member.designation_id && designations.length > 0) {
            const designation = designations.find(d => d.id === member.designation_id);
            if (designation) {
                designationName = designation.designation;
            }
        }
        // If still no designation but we have a designationName from the member, use that
        else if (member.designationName) {
            designationName = member.designationName;
        }

        return {
            ...member,
            // Prioritize the original roleName from the members prop
            roleName: originalMember?.roleName || member.roleName || 'User',
            // Ensure isTeamLead flag is set correctly
            isTeamLead: isTeamLead,
            // Set designation name
            designationName: designationName
        };
    });

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
                    data={enhancedMembers.map((member, index) => {
                        return { ...member, key: member.id || index };
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

export default ProjectMemberList; 