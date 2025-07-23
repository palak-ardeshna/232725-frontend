import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { message, Tooltip, Tag } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import { inquiryApi } from '../../../../../config/api/apiServices';
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

    const getStatusTag = (status) => {
        let color = '';
        switch (status) {
            case 'new':
                color = 'blue';
                break;
            case 'in_progress':
                color = 'orange';
                break;
            case 'resolved':
                color = 'green';
                break;
            case 'closed':
                color = 'gray';
                break;
            default:
                color = 'default';
        }
        return <Tag color={color}>{status.replace('_', ' ')}</Tag>;
    };

    const fields = [
        {
            name: 'name',
            title: 'Name',
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
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text.length > 20 ? `${text.substring(0, 20)}...` : text}</span>
                </Tooltip>
            )
        },
        {
            name: 'phone',
            title: 'Phone'
        },
        {
            name: 'subject',
            title: 'Subject',
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text.length > 30 ? `${text.substring(0, 30)}...` : text}</span>
                </Tooltip>
            )
        },
        {
            name: 'status',
            title: 'Status',
            render: (status) => getStatusTag(status)
        },
        {
            name: 'createdAt',
            title: 'Date',
            render: (date) => dayjs(date).format('DD/MM/YYYY')
        }
    ];

    const actions = [
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
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={inquiries.map(inquiry => ({ ...inquiry, key: inquiry.id }))}
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
                    itemName: 'inquiries',
                    className: 'inquiry-table'
                }}
                searchableColumns={['name', 'email', 'subject', 'status']}
                dateColumns={['createdAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="inquiry"
            />
        </div>
    );
};

export default InquiryList; 