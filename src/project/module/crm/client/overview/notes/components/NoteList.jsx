import React from 'react';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Badge, Typography, Dropdown, Switch } from 'antd';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils.jsx';
import '../../../../../../../styles/_variables.scss';
import FancyLoader from '../../../../../../../components/FancyLoader';

const { Text } = Typography;

const NoteList = ({
    notes = [],
    isLoading = false,
    onEdit,
    onDelete,
    onBulkDelete
}) => {
    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'var(--text-error)';
            case 'important':
                return 'var(--text-warning)';
            default:
                return 'var(--text-success)';
        }
    };

    // Define fields for the table
    const fields = [
        {
            name: 'noteTitle',
            title: 'Title',
            render: (text, record) => (
                <div className="title-container">
                    <span className="title">{text}</span>
                </div>
            )
        },
        {
            name: 'noteType',
            title: 'Type',
            render: (type) => {
                if (!type) return '-';
                return <Badge status="processing" text={type.charAt(0).toUpperCase() + type.slice(1)} />;
            }
        },
        {
            name: 'priority',
            title: 'Priority',
            render: (priority) => {
                if (!priority) return '-';
                return (
                    <Text style={{ color: getPriorityColor(priority), fontWeight: 500 }}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                );
            }
        },
        {
            name: 'createdAt',
            title: 'Date',
            render: (date) => {
                if (!date) return '-';
                return new Date(date).toLocaleDateString();
            }
        }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'note',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'note',
            permission: 'delete'
        }
    ];

    // Generate columns
    const columns = generateColumns(fields);

    // Ensure notes is always an array
    const notesArray = Array.isArray(notes) ? notes : [];

    if (isLoading) {
        return <FancyLoader />;
    }

    return (
        <div className="table-list">
            <CommonTable
                data={notesArray.map((note, index) => ({ ...note, key: note.id || index }))}
                columns={columns}
                isLoading={isLoading}
                pagination={false}
                actionItems={actions}
                extraProps={{
                    itemName: 'notes',
                    className: 'note-table'
                }}
                searchableColumns={['noteTitle', 'noteType', 'priority']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="note"
            />
        </div>
    );
};

export default NoteList; 