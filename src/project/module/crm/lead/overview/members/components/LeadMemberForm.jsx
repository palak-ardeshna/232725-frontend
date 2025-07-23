import React, { useState } from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../../../components/AdvancedForm';
import { Button, Modal, message } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useCreateTeamMemberMutation } from '../../../../../../../config/api/apiServices';
import TeamMemberForm from '../../../../../../module/hrm/teamMember/components/TeamMemberForm';

const validationSchema = Yup.object().shape({
    teamId: Yup.string().required('Please select a team')
});

const LeadMemberForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    teams = [],
    isUpdateMode = false,
    initialTeamIds = [],
    refetchTeams
}) => {
    const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
    const [createTeamMember, { isLoading: isCreatingTeam }] = useCreateTeamMemberMutation();

    const teamOptions = teams.map(team => ({
        label: team.teamName,
        value: team.id
    }));

    const formFields = [
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

    const initialTeamId = initialTeamIds && initialTeamIds.length > 0 ? initialTeamIds[0] : '';

    const initialValues = {
        teamId: initialTeamId
    };

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
            }
            
            setIsTeamModalVisible(false);
        } catch (error) {
            message.error('Failed to add team');
        }
    };

    const handleSubmit = (values) => {
        const { teamId } = values;
        onSubmit({ teamIds: [teamId] });
    };

    return (
        <>
            <AdvancedForm
                initialValues={initialValues}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                fields={formFields}
                validationSchema={validationSchema}
                submitButtonText={isUpdateMode ? 'Update Team' : 'Add Team'}
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

export default LeadMemberForm;