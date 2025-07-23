import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, message } from 'antd';
import { FilterOutlined, DeleteOutlined } from '@ant-design/icons';
import { FiUserPlus } from 'react-icons/fi';
import LeadList from '../../../../crm/lead/components/LeadList';
import LeadForm from '../../../../crm/lead/components/LeadForm';
import {
    useGetLeadsQuery,
    useDeleteLeadMutation,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useGetFiltersQuery,
    useGetStagesQuery,
    useGetPipelinesQuery
} from '../../../../../../config/api/apiServices';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import './leads.scss';

const ClientLeads = ({ client }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });

    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const { data: stagesResponse } = useGetStagesQuery({ limit: 'all' });
    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });

    const filters = filtersResponse?.data?.items || [];
    const stages = stagesResponse?.data?.items || [];
    const pipelines = pipelinesResponse?.data?.items || [];

    const { data: response, isLoading, error } = useGetLeadsQuery({
        page: currentPage,
        limit: pageSize,
        contact: client?.id
    }, { skip: !client?.id });

    const [deleteLead] = useDeleteLeadMutation();
    const [createLead] = useCreateLeadMutation();
    const [updateLead] = useUpdateLeadMutation();

    const leads = response?.data?.items || [];
    const total = response?.data?.total || 0;

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormModal({
            visible: true,
            data: { contact: client?.id }
        });
    };

    const handleEdit = (lead) => {
        setFormModal({ visible: true, data: lead });
    };

    const handleDelete = (lead) => setDeleteModal({ visible: true, data: lead });

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };

    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            const leadData = {
                ...values,
                contact: client?.id
            };

            if (formModal.data?.id) {
                await updateLead({
                    id: formModal.data.id,
                    data: leadData
                }).unwrap();
                message.success('Lead updated successfully');
            } else {
                await createLead(leadData).unwrap();
                message.success('Lead created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data?.id ? 'update' : 'create'} lead: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteLead(deleteModal.data.id).unwrap();
            message.success('Lead deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to delete lead: ${error.data?.message || error.message}`);
        }
    };

    const handleBulkDelete = async (ids) => {
        setBulkDeleteModal({ visible: true, ids });
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const deletePromises = bulkDeleteModal.ids.map(id => deleteLead(id).unwrap());
            await Promise.all(deletePromises);
            message.success(`${bulkDeleteModal.ids.length} leads deleted successfully`);
            setBulkDeleteModal({ visible: false, ids: [] });
        } catch (error) {
            message.error('Failed to delete some leads');
        }
    };

    return (
        <div className="lead-module">
            <ModuleLayout
                title={`${client?.name}'s Leads`}
                icon={<FiUserPlus />}
                showAddButton={false}
            >
                <LeadList
                    leads={leads}
                    isLoading={isLoading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={handlePageChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                    pipelines={pipelines}
                    stages={stages}
                    filters={filters}
                    hideContactColumn={true}
                />

                <Modal
                    title={<ModalTitle
                        icon={<FiUserPlus />}
                        title={formModal.data?.id ? 'Edit Lead' : 'Add Lead'}
                    />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={800}
                    destroyOnClose
                >
                    <LeadForm
                        initialValues={formModal.data}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        hideContactField={true}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Lead" />}
                    open={deleteModal.visible}
                    onOk={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                >
                    <p>Are you sure you want to delete this lead?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Leads" />}
                    open={bulkDeleteModal.visible}
                    onOk={handleBulkDeleteConfirm}
                    onCancel={handleBulkDeleteCancel}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                >
                    <p>Are you sure you want to delete {bulkDeleteModal.ids.length} leads?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default ClientLeads; 