import React, { useState, useEffect, useMemo } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiUserLine } from 'react-icons/ri';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ClientView from './components/ClientView';
import ClientOverview from './overview';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import {
    useGetContactsQuery,
    useDeleteContactMutation,
    useGetContactQuery,
    useCreateContactMutation,
    useUpdateContactMutation,
    useGetProjectsQuery
} from '../../../../config/api/apiServices';
import './client.scss';

const Client = () => {
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [viewModal, setViewModal] = useState({ visible: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [overviewModal, setOverviewModal] = useState({ visible: false, clientId: null });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading } = useGetContactsQuery({
        page: currentPage,
        limit: pageSize,
        isClient: true
    });

    const { data: projectsResponse, isLoading: isLoadingProjects } = useGetProjectsQuery({ limit: 'all' });

    const { data: viewingClientResponse, isLoading: isViewLoading } = useGetContactQuery(
        viewModal.id,
        { skip: !viewModal.id }
    );

    const viewingClient = viewingClientResponse?.data;

    const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();
    const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
    const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();

    const clients = response?.data?.items?.filter(contact => contact.isClient === true) || [];
    const projects = projectsResponse?.data?.items || [];
    const total = clients.length;
    const currentPageFromServer = response?.data?.currentPage || 1;

    // Use useMemo to calculate clientsWithProjectCount to avoid unnecessary re-renders
    const clientsWithProjectCount = useMemo(() => {
        if (!clients.length || !projects.length) {
            return clients;
        }

        return clients.map(client => {
            const clientProjects = projects.filter(project => project.client === client.id);
            return {
                ...client,
                projectCount: clientProjects.length
            };
        });
    }, [clients, projects]);

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (client) => setFormModal({ visible: true, data: client });
    const handleView = (client) => {
        setViewModal({ visible: true, id: client.id });
    };
    const handleDelete = (client) => setDeleteModal({ visible: true, data: client });
    const handleViewOverview = (client) => setOverviewModal({ visible: true, clientId: client.id });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleViewCancel = () => setViewModal({ visible: false, id: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });
    const handleOverviewCancel = () => setOverviewModal({ visible: false, clientId: null });

    const handleFormSubmit = async (values) => {
        try {
            const clientData = {
                ...values,
                isClient: true
            };

            if (formModal.data) {
                await updateContact({
                    id: formModal.data.id,
                    data: clientData
                }).unwrap();
                message.success('Client updated successfully');
            } else {
                await createContact(clientData).unwrap();
                message.success('Client created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} client: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteContact(deleteModal.data.id).unwrap();
            message.success('Client deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete client');
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
                    await deleteContact(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} client${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} client${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <ModuleLayout
            module="contact"
            title="Clients"
            showViewToggle={true}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onAddClick={handleAdd}
            className="client"
        >
            <ClientList
                clients={clientsWithProjectCount}
                isLoading={isLoading || isLoadingProjects}
                viewMode={viewMode}
                pagination={{
                    current: currentPageFromServer,
                    pageSize: pageSize,
                    total: total,
                    onChange: handlePageChange
                }}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onViewOverview={handleViewOverview}
            />

            <Modal
                title={<ModalTitle icon={RiUserLine} title={formModal.data ? 'Edit Client' : 'Add Client'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={700}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <ClientForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <ClientView
                client={viewingClient}
                isLoading={isViewLoading}
                visible={viewModal.visible}
                onClose={handleViewCancel}
            />

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Client" />}
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
                <p>Are you sure you want to delete client "{deleteModal.data?.name}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Clients" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
                okText="Delete All"
                cancelText="Cancel"
                className="delete-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected clients?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            {overviewModal.visible && (
                <ClientOverview
                    clientId={overviewModal.clientId}
                    visible={overviewModal.visible}
                    onClose={handleOverviewCancel}
                />
            )}
        </ModuleLayout>
    );
};

export default Client; 