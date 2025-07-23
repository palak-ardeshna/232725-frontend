import React, { useState } from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../../../components/AdvancedForm';
import { Badge, Space, Typography, Tabs, Button, Modal, message } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useCreateTeamMemberMutation, useGetTeamMembersQuery } from '../../../../../../../config/api/apiServices';
import TeamMemberForm from '../../../../../../module/hrm/teamMember/components/TeamMemberForm';

const { Text } = Typography;
const { TabPane } = Tabs;

const validationSchema = Yup.object().shape({
    teamId: Yup.string().required('Please select a team')
});

const ProjectMemberForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    users,
    employees = [],
    roles,
    isUpdateMode = false,
    initialMemberIds = [],
    initialTeamIds = [],
    refetchTeams
}) => {
    const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
    const [createTeamMember, { isLoading: isCreatingTeam }] = useCreateTeamMemberMutation();
    const { data: teamsData, isLoading: isLoadingTeams } = useGetTeamMembersQuery({ limit: 'all' });
    
    const teams = teamsData?.data?.items || [];
    
    const teamOptions = teams.map(team => ({
        label: team.teamName,
        value: team.id
    }));

    const handleAddTeam = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setIsTeamModalVisible(true);
    };

    const handleTeamModalClose = () => {
        setIsTeamModalVisible(false);
    };

    const handleTeamSubmit = async (values) => {
        try {
            await createTeamMember(values).unwrap();
            message.success('Team added successfully');
            
            if (refetchTeams) {
                await refetchTeams();
            } else {
                const { refetch } = teamsData;
                if (refetch) {
                    refetch();
                }
            }
            
            setIsTeamModalVisible(false);
        } catch (error) {
            message.error('Failed to add team');
        }
    };

    const availableUsers = users.filter(user =>
        !initialMemberIds.includes(user.id) || isUpdateMode
    );

    const availableEmployees = employees.filter(employee =>
        !initialMemberIds.includes(employee.id) || isUpdateMode
    );

    const userOptions = availableUsers.map(user => {
        let roleName = '';

        if (user.role_id) {
            const userRole = roles.find(r => r.id === user.role_id);
            roleName = userRole ? userRole.role_name : '';
        }

        const userName = user.username || '';

        const label = (
            <Space size={12}>
                <Text strong>{userName}</Text>
                {roleName && <Badge status="processing" text={roleName} />}
            </Space>
        );

        return {
            value: user.id,
            label: label
        };
    });

    const employeeOptions = availableEmployees.map(employee => {
        let roleName = '';

        if (employee.role_id) {
            const employeeRole = roles.find(r => r.id === employee.role_id);
            roleName = employeeRole ? employeeRole.role_name : '';
        }

        const employeeName = employee.username || employee.name || '';

        const label = (
            <Space size={12}>
                <Text strong>{employeeName}</Text>
                {roleName && <Badge status="processing" text={roleName} />}
            </Space>
        );

        return {
            value: employee.id,
            label: label
        };
    });

    const allOptions = [...userOptions, ...employeeOptions];

    const memberFields = [
        {
            name: 'teamId',
            label: 'Select Team',
            type: 'select',
            placeholder: 'Select a team to assign',
            options: teamOptions,
            rules: [{ required: true, message: 'Please select a team' }],
            span: 24,
            popupRender: (menu) => (
                <div>
                    {menu}
                    <div style={{
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <Button
                            type="primary"
                            size="small"
                            onClick={handleAddTeam}
                            style={{ width: '100%', height: '38px' }}
                        >
                            Add Team
                        </Button>
                    </div>
                </div>
            )
        }
    ];

    const initialValues = {
        teamId: initialTeamIds && initialTeamIds.length > 0 ? initialTeamIds[0] : ''
    };
        
    const handleSubmit = (values) => {
        const { teamId } = values;
        onSubmit({ teamIds: [teamId] });
    };

    const submitButtonText = isUpdateMode ? 'Update Team' : 'Add Team';

    return (
        <>
            <AdvancedForm
                initialValues={initialValues}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                fields={memberFields}
                validationSchema={validationSchema}
                submitButtonText={submitButtonText}
                cancelButtonText="Cancel"
            />

            <Modal
                open={isTeamModalVisible}
                onCancel={handleTeamModalClose}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        <TeamOutlined />
                        Add New Team
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <TeamMemberForm
                    initialValues={null}
                    isSubmitting={isCreatingTeam}
                    onSubmit={handleTeamSubmit}
                    onCancel={handleTeamModalClose}
                />
            </Modal>
        </>
    );
};

export default ProjectMemberForm; 