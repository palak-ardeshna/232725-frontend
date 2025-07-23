import React from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Tooltip, Badge, Tag } from 'antd';
import ContactCard from './ContactCard.jsx';
import CommonTable from '../../../../../components/CommonTable';
import ModuleGrid from '../../../../../components/ModuleGrid';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import getRole from '../../client/components/getRole';


const ContactList = ({
    contacts = [],
    isLoading = false,
    viewMode = 'list',
    pagination,
    onEdit,
    onView,
    onDelete,
    onBulkDelete,
    onConvertToClient
}) => {
    const navigate = useNavigate();
    const role = getRole();

    const navigateToContactDetails = (contact) => {
        navigate(`/${role}/crm/contact/overview/${contact.id}`);
    };

    const fields = [
        {
            name: 'name',
            title: 'Name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text, record) => (
                <div className="name-container" style={{ fontWeight: '600' }}>
                    <Tooltip title={text}>
                        <span className="name">{text.length > 30 ? `${text.substring(0, 30)}...` : text}</span>
                    </Tooltip>
                </div>
            )
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
            title: 'Phone'
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
            name: 'leadCount',
            title: 'Leads',
            render: (_, record) => (
                <Tag color={record.leadCount > 0 ? 'blue' : 'default'}>
                    {record.leadCount || 0}
                </Tag>
            ),
            sorter: (a, b) => (a.leadCount || 0) - (b.leadCount || 0)
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
            module: 'contact',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'contact',
            permission: 'update'
        },
        {
            key: 'convertToClient',
            label: 'Convert to Client',
            icon: <UserAddOutlined />,
            handler: onConvertToClient,
            module: 'contact',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'contact',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt', 'updatedAt']
    });

    const renderContactCard = (contact) => (
        <ContactCard
            key={contact.id}
            contact={contact}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            onConvertToClient={onConvertToClient}
            onTitleClick={() => navigateToContactDetails(contact)}
            leadCount={contact.leadCount || 0}
        />
    );

    return (
        <div>
            {viewMode === 'grid' ? (
                <ModuleGrid
                    items={contacts}
                    renderItem={renderContactCard}
                    isLoading={isLoading}
                    emptyMessage="No contacts found"
                />
            ) : (
                <div className="table-list">
                    <CommonTable
                        data={contacts}
                        columns={columns}
                        isLoading={isLoading}
                        pagination={pagination}
                        actionItems={actions}
                        extraProps={{
                            itemName: 'contacts',
                            className: 'contact-table'
                        }}
                        searchableColumns={['name', 'email', 'phone']}
                        dateColumns={['createdAt', 'updatedAt']}
                        rowSelection={true}
                        onBulkDelete={onBulkDelete}
                        module="contact"
                        onRowClick={navigateToContactDetails}
                    />
                </div>
            )}
        </div>
    );
};

export default ContactList;
