import React, { useState } from 'react';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { message, Tooltip, Switch, Tag, Modal, Form } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../components/CommonTable';
import { generateColumns } from '../../../../utils/tableUtils.jsx';
import { inquiryApi } from '../../../../config/api/apiServices';
import { RiBuildingLine, RiMessage2Fill } from 'react-icons/ri';
import { ModalTitle } from '../../../../components/AdvancedForm';
import InquiryForm from './InquiryForm';


const InquiryList = ({
    inquiries,
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    refetchInquiries
}) => {
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());
    
    const [updateInquiry, { isLoading: isUpdating }] = inquiryApi.useUpdateMutation();
    const [deleteInquiry, { isLoading: isDeleting }] = inquiryApi.useDeleteMutation();
    const [createInquiry, { isLoading: isCreating }] = inquiryApi.useCreateMutation();

    const handleStatusToggle = async (record) => {
        try {
            const newStatus = record.status === 'open' ? 'closed' : 'open';
            await updateInquiry({
                id: record.id,
                data: { status: newStatus }
            });
            message.success('Status updated successfully');
            refetchInquiries();
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const handleConvertToCompany = async (record) => {
        try {
            await updateInquiry({
                id: record.id,
                data: { isConverted: true }
            }).unwrap();
            
            message.success('Successfully converted inquiry to company');
            refetchInquiries();
        } catch (error) {
            console.error('Conversion error:', error);
            message.error('Failed to convert inquiry to company');
        }
    };

    const getStatusSwitch = (status, record) => {
        return (
            <Switch
                checked={status === 'open'}
                onChange={() => handleStatusToggle(record)}
                checkedChildren="Open"
                unCheckedChildren="Closed"
                size="small"
            />
        );
    };

    const getPriorityTag = (priority) => {
        if (!priority) return null;
        const textColors = {
            low: 'var(--text-success)',
            medium: 'var(--text-warning)',
            high: 'var(--text-error)'
        };
        return <span style={{ color: textColors[priority] }}>{priority}</span>;
    };

    const fields = [
        {
            name: 'inquiryName',
            title: 'Name',
            dataIndex: 'inquiryName',
            render: (text) => {
                if (!text) return '-';
                return (
                    <Tooltip title={text}>
                        <span>{text.length > 30 ? `${text.substring(0, 30)}...` : text}</span>
                    </Tooltip>
                );
            }
        },
        {
            name: 'inquiryEmail',
            title: 'Email',
            dataIndex: 'inquiryEmail',
            render: (text) => {
                if (!text) return '-';
                return (
                    <Tooltip title={text}>
                        <span>{text.length > 20 ? `${text.substring(0, 20)}...` : text}</span>
                    </Tooltip>
                );
            }
        },
        {
            name: 'inquiryPhone',
            title: 'Phone',
            dataIndex: 'inquiryPhone',
            render: (text) => text || '-'
        },
        {
            name: 'inquiryCategory',
            title: 'Category',
            dataIndex: 'inquiryCategory',
            render: (text) => text || '-'
        },
        {
            name: 'priority',
            title: 'Priority',
            dataIndex: 'priority',
            render: (priority) => getPriorityTag(priority)
        },
        {
            name: 'status',
            title: 'Status',
            dataIndex: 'status',
            render: (status, record) => getStatusSwitch(status, record)
        },
        {
            name: 'createdAt',
            title: 'Date',
            dataIndex: 'createdAt',
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
        }
    ];

    const handleEdit = (inquiry) => setFormModal({ visible: true, data: inquiry });
    const handleDelete = (inquiry) => setDeleteModal({ visible: true, data: inquiry });
    
    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateInquiry({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Inquiry updated successfully');
            } else {
                await createInquiry(values).unwrap();
                message.success('Inquiry created successfully');
            }
            setFormModal({ visible: false, data: null });
            refetchInquiries();
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} inquiry: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteInquiry(deleteModal.data.id).unwrap();
            message.success('Inquiry deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetchInquiries();
        } catch (error) {
            message.error('Failed to delete inquiry');
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
                    await deleteInquiry(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete inquiry with ID ${id}:`, error);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            refetchInquiries();

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} inquiry${successCount > 1 ? 'ies' : 'y'}`);
            }
            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} inquiry${errorCount > 1 ? 'ies' : 'y'}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <div className="table-list">
            <CommonTable
                data={inquiries.map(inquiry => ({ ...inquiry, key: inquiry.id }))}
                columns={fields}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange
                }}
                actionItems={[
                    {
                        key: 'edit',
                        label: 'Edit',
                        icon: <EditOutlined />,
                        handler: handleEdit,
                        module: 'inquiry',
                        permission: 'update'
                    },
                    {
                        key: 'convertToCompany',
                        label: 'Convert to Company',
                        icon: <RiBuildingLine />,
                        handler: handleConvertToCompany,
                        module: 'company',
                        permission: 'create'
                    },
                    {
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteOutlined />,
                        danger: true,
                        handler: handleDelete,
                        module: 'inquiry',
                        permission: 'delete'
                    }
                ]}
                extraProps={{
                    itemName: 'inquiries',
                    className: 'inquiry-table'
                }}
                searchableColumns={['inquiryName', 'inquiryEmail', 'inquiryPhone', 'status']}
                dateColumns={['createdAt']}
                rowSelection={(record) => true}
                onBulkDelete={handleBulkDelete}
                module="inquiry"
            />

            <Modal
                title={<ModalTitle icon={RiMessage2Fill} title={formModal.data ? 'Edit Inquiry' : 'Add Inquiry'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <InquiryForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Inquiry" />}
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
                <p>Are you sure you want to delete inquiry from "
                    {deleteModal.data?.inquiryName && (
                        <Tooltip title={deleteModal.data.inquiryName}>
                            <span>
                                {deleteModal.data.inquiryName.length > 30 
                                    ? `${deleteModal.data.inquiryName.substring(0, 30)}...` 
                                    : deleteModal.data.inquiryName}
                            </span>
                        </Tooltip>
                    )}"?
                </p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Inquiries" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected inquiries?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default InquiryList;