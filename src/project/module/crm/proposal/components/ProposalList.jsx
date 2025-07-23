import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import FancyLoader from '../../../../../components/FancyLoader';

// Function to truncate text
const truncateText = (text, maxLength = 25) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;

    return (
        <Tooltip title={text}>
            <span className="name">{text.substring(0, maxLength)}...</span>
        </Tooltip>
    );
};

const ProposalList = ({
    proposals = [],
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    leads = [],
    selectedLead,
    onLeadFilterChange,
    onBulkDelete
}) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const getLeadTitle = (leadId) => {
        const lead = leads.find(l => l.id === leadId);
        return lead ? lead.leadTitle : 'No Lead';
    };

    const getStatusBadge = (status) => {
        let className = '';
        switch (status) {
            case 'draft':
                className = 'status-draft';
                break;
            case 'sent':
                className = 'status-sent';
                break;
            case 'accepted':
                className = 'status-accepted';
                break;
            case 'rejected':
                className = 'status-rejected';
                break;
            case 'expired':
                className = 'status-expired';
                break;
            default:
                className = '';
        }
        return <span className={`status-badge ${className}`}>{status}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const fields = [
        {
            name: 'title',
            title: 'Title',
            render: (title) => (
                <div className="name-container proposal-title">
                    <Tooltip title={title}>
                        <span className="name">{title.length > 30 ? `${title.substring(0, 30)}...` : title}</span>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => a.title.localeCompare(b.title)
        },
        {
            name: 'lead',
            title: 'Lead',
            render: (leadId) => {
                const leadTitle = getLeadTitle(leadId);
                return (
                    <div className="name-container lead-info">
                        <Tooltip title={leadTitle}>
                            <span className="name">{leadTitle.length > 25 ? `${leadTitle.substring(0, 25)}...` : leadTitle}</span>
                        </Tooltip>
                    </div>
                );
            },
            filters: leads.map(lead => ({ text: lead.leadTitle, value: lead.id })),
            onFilter: (value, record) => record.lead === value,
            filterSearch: true
        },
        {
            name: 'amount',
            title: 'Amount',
            render: (amount) => (
                <div className="proposal-amount">
                    {formatCurrency(amount)}
                </div>
            ),
            sorter: (a, b) => a.amount - b.amount
        },
        {
            name: 'status',
            title: 'Status',
            render: (status) => getStatusBadge(status),
            filters: [
                { text: 'Draft', value: 'draft' },
                { text: 'Sent', value: 'sent' },
                { text: 'Accepted', value: 'accepted' },
                { text: 'Rejected', value: 'rejected' },
                { text: 'Expired', value: 'expired' }
            ],
            onFilter: (value, record) => record.status === value
        },
        {
            name: 'validUntil',
            title: 'Valid Until',
            render: (date) => formatDate(date)
        }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'proposal',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'proposal',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields);

    if (isLoading && proposals.length === 0) {
        return (
            <FancyLoader
                message="Loading proposals..."
                subMessage="Please wait while we prepare your data"
                processingText="PROCESSING"
            />
        );
    }

    return (
        <div className='table-list'>
            <CommonTable
                data={proposals}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} proposals`,
                    showQuickJumper: true
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'proposals',
                    rowClassName: (record) => `proposal-row status-${record.status}`
                }}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="proposal"
            />
        </div>
    );
};

export default ProposalList; 