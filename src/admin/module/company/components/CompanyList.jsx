import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip, Tag } from 'antd';
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

    const getStatusTag = (status) => {
        let color = '';
        switch (status) {
            case 'active':
                color = 'green';
                break;
            case 'inactive':
                color = 'gray';
                break;
            default:
                color = 'default';
        }
        return <Tag color={color}>{status}</Tag>;
    };

    const getPaymentStatusTag = (status) => {
        let color = '';
        switch (status) {
            case 'paid':
                color = 'green';
                break;
            case 'unpaid':
                color = 'red';
                break;
            case 'pending':
                color = 'orange';
                break;
            default:
                color = 'default';
        }
        return <Tag color={color}>{status}</Tag>;
    };

    const fields = [
        {
            name: 'name',
            title: 'Company Name',
            render: (text) => (
                <div className="name-container">
                    <Tooltip title={text}>
                        <span className="name">
                            {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                        </span>
                    </Tooltip>
                </div>
            )
        },
        {
            name: 'email',
            title: 'Email',
            render: (text) => text || 'N/A'
        },
        {
            name: 'phone',
            title: 'Phone',
            render: (text) => text || 'N/A'
        },
        {
            name: 'category',
            title: 'Category',
            render: (text) => text || 'N/A'
        },
        {
            name: 'payment_status',
            title: 'Payment',
            render: (status) => getPaymentStatusTag(status)
        },
        {
            name: 'status',
            title: 'Status',
            render: (status) => getStatusTag(status)
        },
        {
            name: 'createdAt',
            title: 'Created',
            render: (date) => dayjs(date).format('DD/MM/YYYY')
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