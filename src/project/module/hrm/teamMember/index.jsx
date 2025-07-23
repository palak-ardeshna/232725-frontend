import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiTeamLine } from 'react-icons/ri';
import { useNavigate, useLocation } from 'react-router-dom';
import TeamMemberList from './components/TeamMemberList';
import TeamMemberForm from './components/TeamMemberForm';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import { teamMemberApi, employeeApi, useGetRolesQuery, designationApi } from '../../../../config/api/apiServices';
import './teamMember.scss';

const TeamMember = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [viewModal, setViewModal] = useState({ visible: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());
    const [processedTeamMembers, setProcessedTeamMembers] = useState([]);
    const [editingTeamId, setEditingTeamId] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    const { data: response, isLoading } = teamMemberApi.useGetAllQuery({
        page: currentPage,
        limit: pageSize,
    });

    const { data: employeesData, isLoading: isLoadingEmployees } = employeeApi.useGetAllQuery({
        page: 1,
        limit: 100
    });

    // Fetch roles for employee display
    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({
        limit: 'all'
    });

    // Fetch designations for employee display
    const { data: designationsData, isLoading: isLoadingDesignations } = designationApi.useGetAllQuery({
        page: 1,
        limit: 'all',
    });

    const { data: viewingTeamMemberResponse, isLoading: isViewLoading } = teamMemberApi.useGetByIdQuery(
        viewModal.id,
        { skip: !viewModal.id }
    );

    const { data: editTeamMemberResponse, isLoading: isEditLoading } = teamMemberApi.useGetByIdQuery(
        editingTeamId,
        { skip: !editingTeamId }
    );

    const [deleteTeamMember, { isLoading: isDeleting }] = teamMemberApi.useDeleteMutation();
    const [createTeamMember, { isLoading: isCreating }] = teamMemberApi.useCreateMutation();
    const [updateTeamMember, { isLoading: isUpdating }] = teamMemberApi.useUpdateMutation();

    const teamMembers = response?.data?.items || [];
    const employees = employeesData?.data?.items || [];
    const roles = rolesData?.data?.items || [];
    const designations = designationsData?.data?.items || [];
    const total = response?.data?.total || 0;
    const currentPageFromServer = response?.data?.currentPage || 1;
    const viewingTeamMember = viewingTeamMemberResponse?.data;
    const editTeamMember = editTeamMemberResponse?.data;

    // Handle loading edit data
    useEffect(() => {
        if (editingTeamId && editTeamMember) {
            let processedTeamMember = { ...editTeamMember };

            if (typeof processedTeamMember.members === 'string') {
                try {
                    processedTeamMember.members = JSON.parse(processedTeamMember.members);
                } catch (e) {
                    processedTeamMember.members = [];
                }
            }

            setFormKey(Date.now());
            setFormModal({ visible: true, data: processedTeamMember });
        }
    }, [editTeamMemberResponse]);

    // Process team members data
    useEffect(() => {
        if (teamMembers.length > 0) {
            const processed = teamMembers.map(teamMember => {
                let processedMembers = teamMember.members;

                if (typeof processedMembers === 'string') {
                    try {
                        processedMembers = JSON.parse(processedMembers);
                    } catch (e) {
                        processedMembers = [];
                    }
                }

                return {
                    ...teamMember,
                    members: processedMembers
                };
            });

            setProcessedTeamMembers(processed);
        } else {
            setProcessedTeamMembers([]);
        }
    }, [teamMembers]);

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setEditingTeamId(null);
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (teamMember) => {
        // Set the editing team ID to trigger the API call
        setEditingTeamId(teamMember.id);
    };

    const handleView = (teamMember) => setViewModal({ visible: true, id: teamMember.id });
    const handleDelete = (teamMember) => setDeleteModal({ visible: true, data: teamMember });

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
        setEditingTeamId(null);
    };

    const handleViewCancel = () => setViewModal({ visible: false, id: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateTeamMember({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Team member updated successfully');
            } else {
                await createTeamMember(values).unwrap();
                message.success('Team member created successfully');
            }
            setFormModal({ visible: false, data: null });
            setEditingTeamId(null);
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} team member: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const teamData = deleteModal.data;

            // Delete the entire team instead of just removing members
            await deleteTeamMember(teamData.id).unwrap();
            message.success('Team deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to delete team: ${error.data?.message || error.message}`);
        }
    };

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteTeamMember(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete team member with ID ${id}:`, error);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} team member${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} team member${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const getEmployeeDisplayName = (employee) => {
        if (!employee) return 'Unknown';

        return employee.username || 'Unknown';
    };

    return (
        <ModuleLayout
            title="Teams"
            onAddClick={handleAdd}
            className="team-member"
            module="teamMember"
        >
            <TeamMemberList
                teamMembers={processedTeamMembers}
                employees={employees}
                roles={roles}
                designations={designations}
                isLoading={isLoading || isLoadingEmployees || isLoadingRoles || isLoadingDesignations}
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                getEmployeeDisplayName={getEmployeeDisplayName}
            />

            <Modal
                title={<ModalTitle icon={RiTeamLine} title={formModal.data ? 'Edit Team' : 'Add Team'} />}
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
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Team" />}
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
                    loading: isDeleting
                }}
            >
                <p>Are you sure you want to delete team "{deleteModal.data?.teamName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Selected Teams" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                className="delete-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected teams?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default TeamMember; 