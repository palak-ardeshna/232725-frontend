import React from 'react';
import { Table, Dropdown, Empty, Pagination, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined, EyeOutlined } from '@ant-design/icons';
import { RiFlowChart } from 'react-icons/ri';
import PipelineCard from './PipelineCard';
import dayjs from 'dayjs';
import { useGetStagesQuery } from '../../../../../../config/api/apiServices';
import CommonTable from '../../../../../../components/CommonTable';
import ModuleGrid from '../../../../../../components/ModuleGrid';
import { generateColumns } from '../../../../../../utils/tableUtils.jsx';

const PipelineList = ({
    viewMode,
    pipelines = [],
    isLoading,
    pagination,
    onPageChange,
    onEdit,
    onDelete,
    onView,
    onBulkDelete
}) => {
    const { data: stagesResponse } = useGetStagesQuery({ limit: 100 });
    const allStages = stagesResponse?.data?.items || [];

    const getStagesCount = (pipelineId) => {
        return allStages.filter(stage => stage.pipeline === pipelineId).length;
    };

    const fields = [
        {
            name: 'name',
            title: 'Name',
            render: (name, pipeline) => (
                <span className="pipeline-name">
                    {name} <span className="pipeline-count">({getStagesCount(pipeline.id)})</span>
                </span>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            name: 'createdAt',
            title: 'Created At'
        }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View Pipeline',
            icon: <EyeOutlined />,
            handler: onView,
            shouldShow: (pipeline) => getStagesCount(pipeline.id) > 0,
            module: 'pipeline',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit Pipeline',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'pipeline',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete Pipeline',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            shouldShow: (pipeline) => pipeline.created_by !== 'SYSTEM',
            module: 'pipeline',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt']
    });

    const renderPipelineCard = (pipeline) => (
        <PipelineCard
            key={pipeline.id}
            pipeline={pipeline}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
        />
    );

    if (isLoading && pipelines.length === 0) {
        return <div className="center-spinner"><Spin size="large" /></div>;
    }

    if (viewMode === 'grid') {
        return (
            <ModuleGrid
                items={pipelines}
                renderItem={renderPipelineCard}
                isLoading={isLoading}
                emptyMessage="No pipelines found"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} pipelines`,
                    showQuickJumper: true
                }}
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={pipelines}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} pipelines`,
                    showQuickJumper: true
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'pipelines',
                    className: 'pipeline-table'
                }}
                searchableColumns={['name']}
                dateColumns={['createdAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="pipeline"
            />
        </div>
    );
};

export default PipelineList;