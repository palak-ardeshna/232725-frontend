import React from 'react';
import { Table, Card, Row, Col, Empty, Spin, Button, Tag, Space, Pagination, Dropdown, Input } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { RiRoadMapLine } from 'react-icons/ri';
import StageCard from './StageCard';
import dayjs from 'dayjs';
import { useGetPipelinesQuery } from '../../../../../../config/api/apiServices';
import CommonTable from '../../../../../../components/CommonTable';
import ModuleGrid from '../../../../../../components/ModuleGrid';
import { generateColumns } from '../../../../../../utils/tableUtils.jsx';

const StageList = ({
    viewMode,
    stages = [],
    isLoading,
    pagination,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete
}) => {
    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const pipelines = pipelinesResponse?.data?.items || [];

    const getPipelineName = (pipelineId) => {
        const pipeline = pipelines.find(p => p.id === pipelineId);
        return pipeline ? pipeline.name : pipelineId;
    };

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
                <span className="type-label">{type.toUpperCase()}</span>
            )
        },
        {
            name: 'is_default',
            title: 'Default',
            render: (isDefault) => (
                isDefault ? <span className="default-yes">YES</span> : <span className="default-no">No</span>
            )
        },
        {
            name: 'pipeline',
            title: 'Pipeline',
            render: (pipelineId) => (
                <span className="pipeline-name">{getPipelineName(pipelineId)}</span>
            )
        }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'stage',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            shouldShow: (stage) => stage.created_by !== 'SYSTEM',
            module: 'stage',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields);

    const renderStageCard = (stage) => (
        <StageCard
            key={stage.id}
            stage={stage}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );

    if (isLoading && stages.length === 0) {
        return <div className="center-spinner"><Spin size="large" /></div>;
    }

    if (viewMode === 'grid') {
        return (
            <ModuleGrid
                items={stages}
                renderItem={renderStageCard}
                isLoading={isLoading}
                emptyMessage="No stages found"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} stages`,
                    showQuickJumper: true
                }}
            />
        );
    }

    return (
        <div className="table-list">
            <CommonTable
                data={stages}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} stages`,
                    showQuickJumper: true
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'stages',
                    className: 'stage-table'
                }}
                searchableColumns={['name', 'type', 'pipeline']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="stage"
                emptyMessage={
                    <div className="empty-state">
                        <RiRoadMapLine className="empty-icon" />
                        <p className="empty-text">No stages found. Create one to get started.</p>
                    </div>
                }
            />
        </div>
    );
};

export default StageList;