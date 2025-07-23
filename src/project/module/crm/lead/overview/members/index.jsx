import React, { useState, useEffect } from 'react';
import { Modal, message, Spin, Empty, Typography, Badge, Button } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { FiUsers } from 'react-icons/fi';
import LeadMemberForm from './components/LeadMemberForm';
import LeadMemberList from './components/LeadMemberList';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import CommonTable from '../../../../../../components/CommonTable';
import TeamMemberForm from '../../../../hrm/teamMember/components/TeamMemberForm';
import {
    useUpdateLeadMutation,
    useGetLeadQuery,
    useGetTeamMembersQuery,
    useGetEmployeesQuery,
    useGetRolesQuery,
    useUpdateTeamMemberMutation,
    useGetDesignationsQuery
} from '../../../../../../config/api/apiServices';
import './members.scss';

const { Text } = Typography;

const MembersTab = ({ lead }) => {
    const [teamId, setTeamId] = useState(null);
    const [teamDetails, setTeamDetails] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [formModal, setFormModal] = useState({ visible: false });
    const [editMembersModal, setEditMembersModal] = useState({ visible: false });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });

    const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
    const [updateTeamMember, { isLoading: isUpdatingTeam }] = useUpdateTeamMemberMutation();
    const { data: leadData, isLoading: isLoadingLead, refetch } = useGetLeadQuery(lead?.id, {
        skip: !lead?.id,
        refetchOnMountOrArgChange: true
    });

    const { data: teamsData, isLoading: isLoadingTeams } = useGetTeamMembersQuery({ limit: 'all' });
    const teams = teamsData?.data?.items || [];

    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({ limit: 'all' });
    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({ limit: 'all' });
    const { data: designationsData, isLoading: isLoadingDesignations } = useGetDesignationsQuery({ limit: 'all' });
    const employees = employeesData?.data?.items || [];
    const roles = rolesData?.data?.items || [];
    const designations = designationsData?.data?.items || [];

    useEffect(() => {
        if (lead?.id) {
            refetch();
        }
    }, [lead?.id, refetch]);

    useEffect(() => {
        const leadTeam = leadData?.data?.teamId || lead?.teamId;
        setTeamId(leadTeam);
    }, [leadData, lead]);

    useEffect(() => {
        if (!teams.length || !teamId) {
            setTeamDetails(null);
            setTeamMembers([]);
            return;
        }

        const team = teams.find(t => t.id === teamId);
        if (team) {
            setTeamDetails(team);

            let memberIds = [];
            if (team.members) {
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
            }

            const membersList = memberIds.map(memberId => {
                const employee = employees.find(e => e.id === memberId);
                if (employee) {
                    // Find role information
                    let roleName = 'Employee';
                    let roleObj = null;

                    if (employee.role_id) {
                        roleObj = roles.find(r => r.id === employee.role_id);
                        if (roleObj) {
                            roleName = roleObj.role_name;
                        }
                    }

                    return {
                        id: memberId,
                        key: memberId,
                        username: employee.username || 'Unknown',
                        roleName: roleName,
                        role_id: employee.role_id,
                        roleObject: roleObj
                    };
                }
                return {
                    id: memberId,
                    key: memberId,
                    username: 'Unknown Employee',
                    roleName: 'Unknown'
                };
            });

            setTeamMembers(membersList);
        } else {
            setTeamDetails(null);
            setTeamMembers([]);
        }
    }, [teamId, teams, employees, roles]);

    const handleAdd = () => setFormModal({ visible: true });
    const handleEditMembers = () => setEditMembersModal({ visible: true });
    const handleDelete = (member) => setDeleteModal({ visible: true, data: member });
    const handleFormCancel = () => setFormModal({ visible: false });
    const handleEditMembersCancel = () => setEditMembersModal({ visible: false });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });

    const handleFormSubmit = async (values) => {
        try {
            const { teamIds } = values;

            if (!teamIds || teamIds.length === 0) {
                message.error('No team selected');
                return;
            }

            const selectedTeamId = teamIds[0];

            await updateLead({
                id: lead.id,
                data: { teamId: selectedTeamId }
            }).unwrap();

            setTeamId(selectedTeamId);
            message.success('Team assigned successfully');
            setFormModal({ visible: false });
            refetch();
        } catch (error) {
            message.error(`Failed to assign team: ${error.data?.message || error.message}`);
            console.error('Error:', error);
        }
    };

    const handleEditMembersSubmit = async (values) => {
        try {
            if (!teamDetails) {
                message.error('No team selected');
                return;
            }

            await updateTeamMember({
                id: teamId,
                data: {
                    teamName: teamDetails.teamName,
                    members: values.members || [],
                    teamLead: values.teamLead
                }
            }).unwrap();

            message.success('Team members updated successfully');
            setEditMembersModal({ visible: false });

            const { refetch: refetchTeams } = teamsData;
            if (refetchTeams) {
                refetchTeams();
            }
        } catch (error) {
            message.error(`Failed to update team members: ${error.data?.message || error.message}`);
            console.error('Error:', error);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!teamDetails || !deleteModal.data) return;

            if (deleteModal.data.id === teamDetails.teamLead) {
                message.error('Cannot delete team leader. Please assign a new team leader first.');
                setDeleteModal({ visible: false, data: null });
                return;
            }

            let currentMembers = [];
            if (Array.isArray(teamDetails.members)) {
                currentMembers = [...teamDetails.members];
            } else if (typeof teamDetails.members === 'string') {
                try {
                    const parsed = JSON.parse(teamDetails.members);
                    if (Array.isArray(parsed)) {
                        currentMembers = [...parsed];
                    } else if (typeof parsed === 'object') {
                        currentMembers = Object.keys(parsed);
                    }
                } catch (e) {
                    currentMembers = [];
                }
            } else if (typeof teamDetails.members === 'object') {
                currentMembers = Object.keys(teamDetails.members);
            }

            const updatedMembers = currentMembers.filter(id => id !== deleteModal.data.id);

            await updateTeamMember({
                id: teamId,
                data: {
                    teamName: teamDetails.teamName,
                    members: updatedMembers,
                    teamLead: teamDetails.teamLead
                }
            }).unwrap();

            setTeamMembers(prev => prev.filter(member => member.id !== deleteModal.data.id));
            message.success('Team member deleted successfully');
            setDeleteModal({ visible: false, data: null });

            const { refetch: refetchTeams } = teamsData;
            if (refetchTeams) {
                refetchTeams();
            }
        } catch (error) {
            message.error('Failed to delete team member');
            console.error('Error deleting team member:', error);
        }
    };

    const getExistingMemberIds = () => {
        if (!teamDetails || !teamDetails.members) return [];

        if (Array.isArray(teamDetails.members)) {
            return teamDetails.members;
        } else if (typeof teamDetails.members === 'string') {
            try {
                const parsed = JSON.parse(teamDetails.members);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        } else if (typeof teamDetails.members === 'object') {
            return Object.keys(teamDetails.members);
        }

        return [];
    };

    const isLoading = lead?.id ? (isLoadingLead || isLoadingTeams || isLoadingEmployees || isLoadingRoles || isLoadingDesignations) : false;
    const hasTeam = !!teamId;
    const addButtonText = hasTeam ? 'Update Team' : 'Add Team';
    const modalTitle = hasTeam ? 'Update Team' : 'Add Team';

    const moduleTitle = hasTeam && teamDetails ? `Team ${teamDetails.teamName}` : 'Team';

    const headerActions = hasTeam ? (
        <div className="header-actions">
            <Button
                onClick={handleEditMembers}
                className="btn btn-secondary edit-members-btn"
            >

                <h3 className='edit-members-icon'><EditOutlined /></h3>
                <span>Edit Members</span>
            </Button>
        </div>
    ) : null;

    return (
        <div className="lead-members-tab">
            <ModuleLayout
                title={moduleTitle}
                icon={<FiUsers />}
                onAddClick={handleAdd}
                className="members"
                contentClassName="members-content"
                addButtonText={addButtonText}
                extraHeaderContent={headerActions}
                module="teamMember"
            >
                <LeadMemberList
                    members={teamMembers}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    team={teamDetails}
                    employees={employees}
                    roles={roles}
                    designations={designations}
                    hasTeam={hasTeam}
                    onEditTeamMembers={handleEditMembers}
                    hideTeamHeader={true}
                />

                <Modal
                    title={<ModalTitle icon={<FiUsers />} title={modalTitle} />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={600}
                    className="member-form-modal"
                    maskClosable={true}
                    destroyOnHidden={true}
                >
                    <LeadMemberForm
                        isSubmitting={isUpdating}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        teams={teams}
                        isUpdateMode={hasTeam}
                        initialTeamIds={teamId ? [teamId] : []}
                        refetchTeams={() => {
                            const { refetch: refetchTeams } = teamsData;
                            if (refetchTeams) {
                                return refetchTeams();
                            }
                        }}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<EditOutlined />} title="Edit Team Members" />}
                    open={editMembersModal.visible}
                    onCancel={handleEditMembersCancel}
                    footer={null}
                    width={800}
                    className="member-form-modal"
                    maskClosable={true}
                    destroyOnHidden={true}
                >
                    <TeamMemberForm
                        initialValues={teamDetails ? {
                            teamName: teamDetails.teamName,
                            members: getExistingMemberIds(),
                            teamLead: teamDetails.teamLead
                        } : null}
                        isSubmitting={isUpdatingTeam}
                        onSubmit={handleEditMembersSubmit}
                        onCancel={handleEditMembersCancel}
                    />
                </Modal>

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
                    <p>Are you sure you want to delete {deleteModal.data?.username || deleteModal.data?.name || 'this member'} from this team?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default MembersTab;