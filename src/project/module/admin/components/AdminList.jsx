import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip, Tag } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../components/CommonTable';
import { generateColumns } from '../../../../utils/tableUtils.jsx';
import { adminApi } from '../../../../config/api/apiServices';

const AdminList = ({
    admins,
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete,
    refetchAdmins
}) => {
    const [updateAdmin] = adminApi.useUpdateMutation();

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

    const fields = [
        {
            name: 'username',
            title: 'Username',
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
            name: 'firstName',
            title: 'First Name',
            render: (text) => text || 'N/A'
        },
        {
            name: 'lastName',
            title: 'Last Name',
            render: (text) => text || 'N/A'
        },
        {
            name: 'phone',
            title: 'Phone',
            render: (text) => text || 'N/A'
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
            module: 'admin',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'admin',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={admins.map(admin => ({ ...admin, key: admin.id }))}
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
                    itemName: 'admins',
                    className: 'admin-table'
                }}
                searchableColumns={['username', 'email', 'firstName', 'lastName', 'phone', 'status']}
                dateColumns={['createdAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="admin"
            />
        </div>
    );
};

export default AdminList; 