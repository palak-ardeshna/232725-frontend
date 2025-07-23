import React from 'react';
import { Spin } from 'antd';
import { DeleteOutlined, FileOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, FileWordOutlined, EyeOutlined } from '@ant-design/icons';
import FileCard from './FileCard';
import ModuleGrid from '../../../../../../../components/ModuleGrid';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils.jsx';

const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FilePdfOutlined />;
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return <FileExcelOutlined />;
    if (fileType?.includes('image')) return <FileImageOutlined />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileWordOutlined />;
    return <FileOutlined />;
};

const FilesList = ({
    files,
    isLoading,
    onDelete,
    viewMode = 'list',
    filterType = null,
    currentPage = 1,
    pageSize = 10,
    total = 0,
    onPageChange
}) => {
    // Filter files by category if filterType is provided
    const filteredFiles = filterType
        ? files.filter(file => file.category === filterType)
        : files;

    if (isLoading) {
        return (
            <div className="loading-files">
                <Spin size="large" />
                <p>Loading files...</p>
            </div>
        );
    }

    const fields = [
        {
            name: 'file_name',
            title: 'File Name',
            render: (text, record) => (
                <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                    <span className="file-icon-cell">{getFileIcon(record.type)}</span> {text}
                </a>
            )
        },
        {
            name: 'category',
            title: 'Category',
            render: (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : 'N/A'
        },
        {
            name: 'type',
            title: 'Type',
            render: (text) => text || 'Unknown'
        },
        {
            name: 'created_at',
            title: 'Uploaded On',
            render: (text) => text ? new Date(text).toLocaleDateString() : 'N/A'
        }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <EyeOutlined />,
            handler: (file) => window.open(file.file_url, '_blank'),
            module: 'file',
            permission: 'read'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'file',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['created_at']
    });

    const renderFileCard = (file) => (
        <FileCard
            key={file.file_url}
            file={file}
            onDelete={onDelete}
        />
    );

    if (viewMode === 'grid') {
        return (
            <ModuleGrid
                items={filteredFiles}
                renderItem={renderFileCard}
                isLoading={isLoading}
                emptyMessage={filterType
                    ? `No ${filterType} files found`
                    : "No files found"}
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={filteredFiles}
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
                    itemName: 'files',
                    className: 'files-table'
                }}
                searchableColumns={['file_name', 'category', 'type']}
                dateColumns={['created_at']}
                module="file"
            />
        </div>
    );
};

export default FilesList; 