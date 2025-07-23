import React from 'react';
import { Spin } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CommonTable from '../../../../../../components/CommonTable';
import ModuleGrid from '../../../../../../components/ModuleGrid';
import { generateColumns } from '../../../../../../utils/tableUtils.jsx';
import FilterCard from './FilterCard';

const FilterList = ({
    filters = [],
    isLoading,
    viewMode,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete
}) => {
    const fields = [
        {
            name: 'name',
            title: 'Name',
            render: (name) => (
                <div style={{ fontWeight: '600' }}>{name}</div>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            name: 'type',
            title: 'Type',
            render: (type) => (
                <span className={`filter-type-tag ${type || 'general'}`}>
                    {type?.toUpperCase() || 'GENERAL'}
                </span>
            )
        },
        {
            name: 'created_by_display',
            title: 'Created By',
            render: (text, record) => text || record.created_by || 'System'
        },
        { name: 'createdAt', title: 'Created At' }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'filter',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            shouldShow: (filter) => filter.created_by !== 'SYSTEM',
            module: 'filter',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt']
    });

    const renderFilterCard = (filter) => (
        <FilterCard
            key={filter.id}
            filter={filter}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );

    if (isLoading && filters.length === 0) {
        return <div className="center-spinner"><Spin size="large" /></div>;
    }

    if (viewMode === 'grid') {
        return (
            <ModuleGrid
                items={filters}
                renderItem={renderFilterCard}
                isLoading={isLoading}
                emptyMessage="No filters found"
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={filters}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} filters`,
                    showQuickJumper: true
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'filters',
                    className: 'filter-table'
                }}
                searchableColumns={['name', 'type', 'created_by_display']}
                dateColumns={['createdAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="filter"
            />
        </div>
    );
};

export default FilterList;