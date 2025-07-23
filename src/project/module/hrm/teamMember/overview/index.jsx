import React, { useState, useEffect } from 'react';
import { Spin, Empty, Button, Space, Avatar, Badge, Modal, message, Tooltip, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, UserAddOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons';
import { RiTeamLine, RiUserLine } from 'react-icons/ri';
import { teamMemberApi, employeeApi, roleApi, designationApi } from '../../../../../config/api/apiServices';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import { ModalTitle } from '../../../../../components/AdvancedForm';
import TeamMemberForm from '../components/TeamMemberForm';
import './overview.scss';

const TeamMemberOverview = () => {
    const { id: teamId } = useParams();
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState([]);
    const [roleMap, setRoleMap] = useState({});
    const [designationMap, setDesignationMap] = useState({});
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [formModal, setFormModal] = useState({ visible: false });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: teamData, isLoading, error, refetch } = teamMemberApi.useGetByIdQuery(teamId, {
        skip: !teamId
    });

    const { data: employeesData, isLoading: isLoadingEmployees } = employeeApi.useGetAllQuery({
        page: 1,
        limit: 100
    });

    const { data: rolesData, isLoading: isLoadingRoles } = roleApi.useGetAllQuery({
        limit: 'all'
    });

    const { data: designationsData, isLoading: isLoadingDesignations } = designationApi.useGetAllQuery({
        limit: 'all'
    });

    const [updateTeamMember, { isLoading: isUpdating }] = teamMemberApi.useUpdateMutation();

    const team = teamData?.data;
    const employees = employeesData?.data?.items || [];
    const roles = rolesData?.data?.items || [];
    const designations = designationsData?.data?.items || [];

    useEffect(() => {
        if (roles && roles.length > 0) {
            const map = {};
            roles.forEach(role => {
                map[role.id] = role.role_name || role.name || 'Employee';
            });
            setRoleMap(map);
        }
    }, [roles]);

    useEffect(() => {
        if (designations && designations.length > 0) {
            const map = {};
            designations.forEach(designation => {
                map[designation.id] = designation.designation;
            });
            setDesignationMap(map);
        }
    }, [designations]);

    useEffect(() => {
        if (team && employees.length > 0) {
            let membersList = [];

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

            membersList = memberIds.map(memberId => {
                const employee = employees.find(employee => employee.id === memberId);
                const isTeamLead = team.teamLead === memberId;

                if (employee) {
                    let roleName = 'Employee';
                    if (employee.role_id && roleMap[employee.role_id]) {
                        roleName = roleMap[employee.role_id];
                    } else if (employee.role && typeof employee.role === 'object' && employee.role.role_name) {
                        roleName = employee.role.role_name;
                    } else if (employee.role && typeof employee.role === 'string') {
                        roleName = employee.role;
                    }

                    let designationName = 'Not specified';
                    if (employee.designation && designationMap[employee.designation]) {
                        designationName = designationMap[employee.designation];
                    }

                    return {
                        ...employee,
                        roleName,
                        designationName,
                        isTeamLead
                    };
                }

                return {
                    id: memberId,
                    employee_id: 'Unknown',
                    first_name: 'Unknown',
                    last_name: 'Employee',
                    roleName: 'Employee',
                    designationName: 'Not specified',
                    isTeamLead
                };
            });

            setTeamMembers(membersList);
        }
    }, [team, employees, roleMap, designationMap]);

    const handleBack = () => {
        navigate('/admin/hrm/team-member');
    };

    const handleAddMember = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true });
    };

    const handleFormCancel = () => {
        setFormModal({ visible: false });
    };

    const handleFormSubmit = async (values) => {
        try {
            if (!team) return;

            // Process members data
            let processedMembers = values.members || [];
            if (!Array.isArray(processedMembers)) {
                if (typeof processedMembers === 'string') {
                    try {
                        processedMembers = JSON.parse(processedMembers);
                    } catch (e) {
                        processedMembers = [];
                    }
                } else if (typeof processedMembers === 'object') {
                    processedMembers = Object.values(processedMembers);
                }
            }

            // Ensure teamLead is included in members
            if (values.teamLead && !processedMembers.includes(values.teamLead)) {
                processedMembers.push(values.teamLead);
            }

            const updateData = {
                teamName: values.teamName,
                teamLead: values.teamLead,
                members: processedMembers
            };

            await updateTeamMember({
                id: teamId,
                data: updateData
            }).unwrap();

            message.success('Team members updated successfully');
            setFormModal({ visible: false });
            refetch();
        } catch (error) {
            message.error(`Failed to update team members: ${error.data?.message || error.message}`);
        }
    };

    const fields = [
        {
            name: 'username',
            title: 'Employee',
            render: (text, record) => (
                <div className="name-container">
                    <Avatar>
                        {record.isTeamLead ? <CrownOutlined /> : (record.username?.charAt(0) || 'E').toUpperCase()}
                    </Avatar>
                    <Tooltip title={record.username || 'Unknown'}>
                        <span className={`name ${record.isTeamLead ? 'team-lead-name' : ''}`}>
                            {
                                (() => {
                                    const name = record.username || 'Unknown';
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
            name: 'designationName',
            title: 'Designation',
            render: (designationName, record) => {
                return (
                    <Tooltip title={designationName || 'Not specified'}>
                        <Badge
                            status="processing"
                            text={(designationName || 'Not specified')}
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
            render: (roleName, record) => {
                const displayRole = roleName || 'Employee';
                return (
                    <Tooltip title={displayRole}>
                        <Badge
                            status="processing"
                            text={displayRole}
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
                    onClick={() => handleRemoveMember(record)}
                    disabled={record.isTeamLead && team && team.members && team.members.length > 1}
                >
                    Delete
                </Button>
            )
        }
    ];

    const columns = generateColumns(fields);

    const handleRemoveMember = (member) => {
        if (member.isTeamLead && team && team.members && team.members.length > 1) {
            Modal.confirm({
                title: 'Remove Team Leader',
                content: (
                    <div>
                        <p>You are about to remove the team leader. A new team leader will be assigned from the remaining members.</p>
                        <p>Are you sure you want to continue?</p>
                    </div>
                ),
                onOk: () => setDeleteModal({ visible: true, data: member }),
                okText: 'Yes, Remove',
                cancelText: 'Cancel',
                okButtonProps: { danger: true }
            });
        } else if (member.isTeamLead && team && team.members && team.members.length <= 1) {
            message.error('Cannot remove the team leader as they are the only member. Delete the team instead.');
        } else {
            setDeleteModal({ visible: true, data: member });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ visible: false, data: null });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!team || !deleteModal.data) return;

            let currentMembers = [];
            if (Array.isArray(team.members)) {
                currentMembers = [...team.members];
            } else if (typeof team.members === 'string') {
                try {
                    const parsed = JSON.parse(team.members);
                    if (Array.isArray(parsed)) {
                        currentMembers = [...parsed];
                    } else if (typeof parsed === 'object') {
                        currentMembers = Object.keys(parsed);
                    }
                } catch (e) {
                    currentMembers = [];
                }
            } else if (typeof team.members === 'object') {
                currentMembers = Object.keys(team.members);
            }

            const updatedMembers = currentMembers.filter(id => id !== deleteModal.data.id);

            // Check if we're deleting the team lead
            const isRemovingTeamLead = team.teamLead === deleteModal.data.id;
            let updatedData = {
                teamName: team.teamName,
                members: updatedMembers
            };

            // If removing team lead, we need to assign a new one or set to null
            if (isRemovingTeamLead) {
                updatedData.teamLead = updatedMembers.length > 0 ? updatedMembers[0] : null;
            }

            await updateTeamMember({
                id: teamId,
                data: updatedData
            }).unwrap();

            setTeamMembers(prev => prev.filter(member => member.id !== deleteModal.data.id));
            message.success('Team member deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete team member');
            console.error('Error deleting team member:', error);
        }
    };

    if (isLoading || isLoadingEmployees || isLoadingRoles || isLoadingDesignations) {
        return (
            <div className="team-member-overview-page">
                <div className="team-member-overview-loading">
                    <Spin size="large" />
                    <p>Loading team information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="team-member-overview-page">
                <div className="team-member-overview-error">
                    <Empty
                        description="Error loading team information"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button type="primary" onClick={handleBack} className="btn btn-primary" style={{ marginTop: 16 }}>
                        <ArrowLeftOutlined /> <span>Back to Teams</span>
                    </Button>
                </div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="team-member-overview-page">
                <div className="team-member-overview-empty">
                    <Empty description="No team information available" />
                    <Button type="primary" onClick={handleBack} className="btn btn-primary" style={{ marginTop: 16 }}>
                        <ArrowLeftOutlined /> <span>Back to Teams</span>
                    </Button>
                </div>
            </div>
        );
    }
    const hasMember = teamMembers.length > 0;
    const addButtonText = hasMember ? 'Update Team Member' : 'Add Team Member';

    return (
        <div className="team-member-overview-page">
            <div className="team-member-overview-header">
                <div className="header-left">
                    <h1 className="team-heading">
                        <span className="title-icon"><RiTeamLine /></span>
                        <Tooltip title={team.teamName}>
                            <span className="team-title">
                                {team.teamName.length > 40 ? `${team.teamName.substring(0, 40)}...` : team.teamName}
                            </span>
                        </Tooltip>
                    </h1>
                </div>
                <div className="header-right">
                    <Space size="middle">
                        <Button onClick={handleBack} icon={<ArrowLeftOutlined />} className="btn btn-secondary">
                            <span>Back to Teams</span>
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleAddMember}
                            icon={<UserAddOutlined />}
                            className="btn btn-primary"
                        >
                            <span>{addButtonText}</span>
                        </Button>
                    </Space>
                </div>
            </div>
            <div className="team-member-overview">
                <div className="members-section">
                    <div className="table-list">
                        <CommonTable
                            module="teamMember"
                            data={teamMembers.map(member => ({
                                ...member,
                                key: member.id,
                                username: member.username || member.name || 'Unknown',
                                roleName: member.roleName || 'Employee',
                                designationName: member.designationName || 'Not specified'
                            }))}
                            columns={columns}
                            isLoading={isLoading || isLoadingEmployees || isLoadingRoles || isLoadingDesignations}
                            pagination={false}
                            extraProps={{
                                itemName: 'team members',
                                className: 'member-table'
                            }}
                            searchableColumns={['username', 'roleName', 'designationName']}
                        />
                    </div>
                </div>
            </div>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Team Member" />}
                open={deleteModal.visible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                className="delete-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    danger: true,
                    loading: isUpdating
                }}
            >
                <p>Are you sure you want to Delete {deleteModal.data?.username || deleteModal.data?.name || 'this member'} from this team?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={RiTeamLine} title="Update Team" />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <TeamMemberForm
                    key={formKey}
                    initialValues={team ? {
                        teamName: team.teamName,
                        teamLead: team.teamLead,
                        members: team.members
                    } : null}
                    users={employees}
                    isLoadingUsers={isLoadingEmployees}
                    isSubmitting={isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>
        </div>
    );
};

export default TeamMemberOverview; 