import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';

const DesignationList = ({
    designations = [],
    branches = [],
    isLoading = false,
    currentPage = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete
}) => {
    const fields = [
        {
            name: 'designation',
            title: 'Designation',
            render: (text, record) => (
                <div className="name-container">
                    <Tooltip title={text}>
                        <span className="name">
                            {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                        </span>
                    </Tooltip>
                </div>
            )
        },
        { name: 'createdAt', title: 'Created At' },
        { name: 'updatedAt', title: 'Updated At' }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'designation',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'designation',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt', 'updatedAt']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={designations.map(designation => ({ ...designation, key: designation.id }))}
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
                    itemName: 'designations',
                    className: 'designation-table'
                }}
                searchableColumns={['designation']}
                dateColumns={['createdAt', 'updatedAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="designation"
            />
        </div>
    );
};

export default DesignationList;