import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip, Tag, Switch, message } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../components/CommonTable';
import { generateColumns } from '../../../../utils/tableUtils.jsx';
import { companyApi } from '../../../../config/api/apiServices';

const CompanyList = ({
    companies,
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete,
    refetchCompanies
}) => {
    const [updateCompany] = companyApi.useUpdateMutation();

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
            handler: onDelete,
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
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="company"
            />
        </div>
    );
};

export default CompanyList; 