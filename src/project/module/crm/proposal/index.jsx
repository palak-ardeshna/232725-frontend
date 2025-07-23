import React, { useState, useEffect } from 'react';
import { Modal, message, Button, Tooltip } from 'antd';
import { DeleteOutlined, FileExcelOutlined, PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import ModuleLayout from '../../../../components/ModuleLayout';
import ProposalList from './components/ProposalList';
import ProposalForm from './components/ProposalForm';
import {
    useGetProposalsQuery,
    useDeleteProposalMutation,
    useCreateProposalMutation,
    useUpdateProposalMutation,
    useGetLeadsQuery
} from '../../../../config/api/apiServices';
import { ModalTitle } from '../../../../components/AdvancedForm';
import './proposal.scss';
import AiTextGenerator from '../../../../utils/Ai';
import { exportToExcel } from '../../../../utils/exportUtils';

window.AiTextGenerator = AiTextGenerator;

const Proposal = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [selectedLead, setSelectedLead] = useState(null);
    const [filterParams, setFilterParams] = useState({});
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading } = useGetProposalsQuery({
        page: currentPage,
        limit: pageSize,
        ...filterParams
    });

    const { data: leadsResponse } = useGetLeadsQuery({ limit: 'all' });
    const leads = leadsResponse?.data?.items || [];

    const [deleteProposal, { isLoading: isDeleting }] = useDeleteProposalMutation();
    const [createProposal, { isLoading: isCreating }] = useCreateProposalMutation();
    const [updateProposal, { isLoading: isUpdating }] = useUpdateProposalMutation();

    const proposals = response?.data?.items || [];
    const total = response?.data?.total || 0;

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };
    const handleEdit = (proposal) => setFormModal({ visible: true, data: proposal });
    const handleDelete = (proposal) => setDeleteModal({ visible: true, data: proposal });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateProposal({ id: formModal.data.id, data: values }).unwrap();
                message.success('Proposal updated successfully');
            } else {
                await createProposal(values).unwrap();
                message.success('Proposal created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(error.data?.message || 'Failed to save proposal');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteProposal(deleteModal.data.id).unwrap();
            message.success('Proposal deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error(error.data?.message || 'Failed to delete proposal');
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
                    await deleteProposal(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} proposal${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} proposal${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const handleLeadFilterChange = (value) => {
        setSelectedLead(value);
        if (value) {
            setFilterParams(prev => ({ ...prev, lead: value }));
        } else {
            const { lead, ...rest } = filterParams;
            setFilterParams(rest);
        }
    };

    const handleExportToExcel = async () => {
        try {
            const columns = {
                title: { title: 'Title', width: 30 },
                lead: { title: 'Lead', width: 20 },
                amount: { title: 'Amount', width: 15 },
                status: { title: 'Status', width: 15 },
                validUntil: { title: 'Valid Until', width: 15 },
                createdAt: { title: 'Created At', width: 15 }
            };

            const exportData = proposals.map(proposal => ({
                title: proposal.title || '',
                lead: getLeadTitle(proposal.lead) || '',
                amount: proposal.amount || 0,
                status: proposal.status || '',
                validUntil: proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : 'N/A',
                createdAt: proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'N/A'
            }));

            await exportToExcel({
                data: exportData,
                columns,
                filename: `proposals_export_${new Date().toISOString().split('T')[0]}`,
                sheetName: 'Proposals'
            });
        } catch (error) {
            message.error('Failed to export to Excel');
        }
    };

    const getLeadTitle = (leadId) => {
        const lead = leads.find(l => l.id === leadId);
        return lead ? lead.leadTitle : 'No Lead';
    };

    const exportButton = (
        <Tooltip title="Export to Excel">
            <Button
                type="default"
                className="btn btn-secondary"
                icon={<FileExcelOutlined />}
                onClick={handleExportToExcel}
            >
                <span className="btn-text">Export</span>
            </Button>
        </Tooltip>
    );

    const addButton = (
        <motion.button
            className="btn btn-primary add-button"
            onClick={handleAdd}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <PlusOutlined /> <span className="btn-text">Add Proposal</span>
        </motion.button>
    );

    return (
        <ModuleLayout
            title="Proposals"
            onAddClick={handleAdd}
            showAddButton={false}
            extraHeaderContent={
                <div className="module-header-buttons">
                    {exportButton}
                    {addButton}
                </div>
            }
        >
            <ProposalList
                proposals={proposals}
                isLoading={isLoading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                leads={leads}
                selectedLead={selectedLead}
                onLeadFilterChange={handleLeadFilterChange}
                onBulkDelete={handleBulkDelete}
            />

            <Modal
                title={<ModalTitle title={formModal.data ? 'Edit Proposal' : 'Create Proposal'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                destroyOnHidden={true}
                className="proposal-form-modal"
            >
                <ProposalForm
                    key={formKey}
                    initialValues={formModal.data}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    isSubmitting={isCreating || isUpdating}
                    leads={leads}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Proposal" />}
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
                <p>Are you sure you want to delete proposal "{deleteModal.data?.title}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Proposals" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected proposals?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Proposal; 