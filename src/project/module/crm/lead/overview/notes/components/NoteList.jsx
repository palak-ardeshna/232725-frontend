import React from 'react';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Badge, Typography, Dropdown, Switch, Tooltip } from 'antd';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils.jsx';
import '../../../../../../../styles/_variables.scss';
import FancyLoader from '../../../../../../../components/FancyLoader';

const { Text } = Typography;

const NoteList = ({
    notes = [],
    isLoading = false,
    currentPage = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete
}) => {
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

    // Function to truncate text
    const truncateText = (text, maxLength = 30) => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;

        return (
            <Tooltip title={text}>
                <span className="truncated-text">{text.substring(0, maxLength)}...</span>
            </Tooltip>
        );
    };

    // Define fields for the table
    const fields = [
        {
            name: 'noteTitle',
            title: 'Title',
            render: (text) => truncateText(text, 25)
        },
        {
            name: 'description',
            title: 'Description',
            render: (text, record) => {
                const content = record.description || '';
                return truncateText(content, 40);
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
            // Only show edit for notes created by the current user
            shouldShow: (record) => true
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            // Only show delete for notes created by the current user
            shouldShow: (record) => true
        }
    ];

    const columns = generateColumns(fields);

    const notesArray = Array.isArray(notes) ? notes : [];

    if (isLoading) {
        return <FancyLoader />;
    }

    // Custom row selection function to allow selecting only user's own notes
    const rowSelectionFunction = (record) => {
        // Allow selection of all notes since we're already filtering by user_id
        return true;
    };

    return (
        <div className="table-list">
            <CommonTable
                data={notesArray.map((note, index) => ({ ...note, key: note.id || index }))}
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
                    itemName: 'notes',
                    className: 'note-table'
                }}
                searchableColumns={['noteTitle', 'description', 'priority']}
                rowSelection={rowSelectionFunction}
                onBulkDelete={onBulkDelete}
                module="note" // Note is a public module, so all users have access
            />
        </div>
    );
};

export default NoteList;
