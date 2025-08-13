import React, { useState } from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip, Tag, Switch, message, Modal } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../components/CommonTable';
import { generateColumns } from '../../../../utils/tableUtils.jsx';
import { companyApi } from '../../../../config/api/apiServices';
import { ModalTitle } from '../../../../components/AdvancedForm';

const CompanyList = ({
    companies,
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    refetchCompanies
}) => {
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [updateCompany] = companyApi.useUpdateMutation();
    const [deleteCompany, { isLoading: isDeleting }] = companyApi.useDeleteMutation();

    const handleStatusToggle = async (record) => {
        try {
            const newStatus = record.status === 'active' ? 'inactive' : 'active';
            await updateCompany({
                id: record.id,
                data: { status: newStatus }
            }).unwrap();
            message.success('Status updated successfully');
            refetchCompanies();
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const handleDelete = (company) => setDeleteModal({ visible: true, data: company });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });
    
    const handleDeleteConfirm = async () => {
        try {
            await deleteCompany(deleteModal.data.id).unwrap();
            message.success('Company deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetchCompanies();
        } catch (error) {
            message.error('Failed to delete company');
        }
    };

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds && selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        } else {
            message.warning('Please select companies to delete');
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            if (!ids || ids.length === 0) {
                message.error('No companies selected for deletion');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteCompany(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error('Delete error for company ID:', id, error);
                    message.error(`Failed to delete company with ID ${id}`);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            refetchCompanies();

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} company${successCount > 1 ? 'ies' : 'y'}`);
            }
            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} company${errorCount > 1 ? 'ies' : 'y'}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const getStatusSwitch = (status, record) => {
        return (
            <Switch
                checked={status === 'active'}
                onChange={() => handleStatusToggle(record)}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                size="small"
            />
        );
    };

    const getPaymentStatusTag = (status) => {
        if (!status) return null;
        const textColors = {
            paid: 'var(--text-success)',
            unpaid: 'var(--text-error)',
            pending: 'var(--text-warning)'
        };
        return <span style={{ 
            color: textColors[status.toLowerCase()] || 'var(--text-secondary)',
            textTransform: 'capitalize'
        }}>{status}</span>;
    };

    const fields = [
        {
            name: 'companyName',
            title: 'Company Name',
            render: (text) => (
                <div className="name-container">
                    <Tooltip title={text}>
                        <span className="name">
                            {text?.length > 30 ? `${text.substring(0, 30)}...` : text}
                        </span>
                    </Tooltip>
                </div>
            )
        },
        {
            name: 'companyEmail',
            title: 'Email',
            render: (text) => text || 'N/A'
        },
        {
            name: 'companyPhone',
            title: 'Phone',
            render: (text) => text || 'N/A'
        },
        {
            name: 'companyCategory',
            title: 'Category',
            render: (text) => text || 'N/A'
        },
        {
            name: 'paymentStatus',
            title: 'Payment',
            render: (status) => getPaymentStatusTag(status)
        },
        {
            name: 'status',
            title: 'Status',
            render: (status, record) => getStatusSwitch(status, record)
        },
        {
            name: 'covertedAt',
            title: 'Converted Date',
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
        }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'company',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: handleDelete,
            module: 'company',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={companies.map(company => ({ ...company, key: company.id }))}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'companies',
                    className: 'company-table'
                }}
                searchableColumns={['name', 'email', 'phone', 'category', 'status', 'payment_status']}
                dateColumns={['createdAt']}
                rowSelection={{
                    module: 'company',
                    permission: 'delete',
                    type: 'checkbox'
                }}
                onBulkDelete={handleBulkDelete}
                module="company"
            />

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Company" />}
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
                <p>Are you sure you want to delete company "
                    {deleteModal.data?.name && (
                        <Tooltip title={deleteModal.data.name}>
                            <span>
                                {deleteModal.data.name.length > 30 
                                    ? `${deleteModal.data.name.substring(0, 30)}...` 
                                    : deleteModal.data.name}
                            </span>
                        </Tooltip>
                    )}"?
                </p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Companies" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected companies?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default CompanyList; 