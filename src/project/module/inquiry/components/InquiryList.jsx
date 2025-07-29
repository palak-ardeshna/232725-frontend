import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { message, Tooltip, Switch, Tag } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../components/CommonTable';
import { generateColumns } from '../../../../utils/tableUtils.jsx';
import { inquiryApi } from '../../../../config/api/apiServices';
import { RiBuildingLine } from 'react-icons/ri';

const InquiryList = ({
    inquiries,
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete,
    refetchInquiries,
    onConvertToCompany
}) => {
    const [updateInquiry] = inquiryApi.useUpdateMutation();

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
                        handler: onEdit,
                        module: 'inquiry',
                        permission: 'update'
                    },
                    {
                        key: 'convertToCompany',
                        label: 'Convert to Company',
                        icon: <RiBuildingLine />,
                        handler: onConvertToCompany,
                        module: 'company',
                        permission: 'create'
                    },
                    {
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteOutlined />,
                        danger: true,
                        handler: onDelete,
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
                onBulkDelete={onBulkDelete}
                module="inquiry"
            />
        </div>
    );
};

export default InquiryList;