import React from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Tooltip, Tag } from 'antd';
import ClientCard from './ClientCard.jsx';
import CommonTable from '../../../../../components/CommonTable';
import ModuleGrid from '../../../../../components/ModuleGrid';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import getRole from './getRole';
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



const ClientList = ({
    clients = [],
    isLoading = false,
    viewMode = 'list',
    pagination,
    onEdit,
    onView,
    onDelete,
    onBulkDelete
}) => {
    const navigate = useNavigate();
    const role = getRole();
    const navigateToClientDetails = (client) => {
        navigate(`/${role}/crm/client/overview/${client.id}`);
    };

    const fields = [
        {
            name: 'name',
            title: 'Name',
            render: (name, record) => (
                <div className="name-container" style={{ fontWeight: '600' }}>
                    <Tooltip title={name}>
                        <span className="name">{name.length > 30 ? `${name.substring(0, 30)}...` : name}</span>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            name: 'email',
            title: 'Email',
            render: (email) => (
                <div className="name-container">
                    <Tooltip title={email}>
                        <span className="name">{email && email.length > 25 ? `${email.substring(0, 25)}...` : email || '-'}</span>
                    </Tooltip>
                </div>
            )
        },
        {
            name: 'phone',
            title: 'Phone',
            render: (phone) => (
                <div className="name-container">
                    <Tooltip title={phone}>
                        <span className="name">{phone || '-'}</span>
                    </Tooltip>
                </div>
            )
        },
        {
            name: 'address',
            title: 'Location',
            render: (address) => {
                if (!address) return '-';

                const city = address.city || '-';
                const state = address.state || '';
                const country = address.country || '';

                return (
                    <div className="location-container" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="city" style={{ fontWeight: '500' }}>
                            {city}
                        </div>
                        <div className="state-country" style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                            {state && country ? `${state}, ${country}` : state || country || '-'}
                        </div>
                    </div>
                );
            }
        },
        {
            name: 'projectCount',
            title: 'Projects',
            render: (_, record) => (
                <Tag color={record.projectCount > 0 ? 'green' : 'default'}>
                    {record.projectCount || 0}
                </Tag>
            ),
            sorter: (a, b) => (a.projectCount || 0) - (b.projectCount || 0)
        },
        { name: 'createdAt', title: 'Created At' },
        { name: 'updatedAt', title: 'Updated At' }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: onView,
            module: 'client',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'client',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'client',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt', 'updatedAt']
    });

    const renderClientCard = (client) => (
        <ClientCard
            key={client.id}
            client={client}
            onEdit={onEdit}
            onView={() => navigateToClientDetails(client)}
            onDelete={onDelete}
            projectCount={client.projectCount || 0}
        />
    );

    if (viewMode === 'grid') {
        return (
            <ModuleGrid
                items={clients}
                renderItem={renderClientCard}
                isLoading={isLoading}
                emptyMessage="No clients found"
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={clients}
                columns={columns}
                isLoading={isLoading}
                pagination={pagination}
                actionItems={actions}
                extraProps={{
                    itemName: 'clients',
                    className: 'client-table'
                }}
                searchableColumns={['name', 'email', 'phone']}
                dateColumns={['createdAt', 'updatedAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                onRowClick={navigateToClientDetails}
                module="client"
            />
        </div>
    );
};

export default ClientList; 