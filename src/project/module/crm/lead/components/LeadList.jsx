import React from 'react';
import { Switch } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import { useUpdateLeadMutation, useGetFiltersQuery } from '../../../../../config/api/apiServices';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import FancyLoader from '../../../../../components/FancyLoader';
import getRole from '../../client/components/getRole';
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

const LeadList = ({
    leads = [],
    isLoading,
    viewMode,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete,
    pipelines = [],
    stages = []
}) => {
    const [updateLead] = useUpdateLeadMutation();
    const navigate = useNavigate();
    const role = getRole();
    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const filters = filtersResponse?.data?.items || [];
    const sources = filters.filter(filter => filter.type === 'source');

    const navigateToLeadDetails = (lead) => {
        navigate(`/${role}/crm/lead/overview/${lead.id}`);
    };

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'var(--text-error)';
            case 'medium':
                return 'var(--text-warning)';
            case 'low':
                return 'var(--text-success)';
            default:
                return 'var(--text-primary)';
        }
    };

    const getPipelineName = (pipelineId) => {
        if (!pipelineId) return "No Pipeline";
        const pipeline = pipelines.find(p => p.id === pipelineId);
        return pipeline ? pipeline.name : "No Pipeline";
    };

    const getStageName = (stageId) => {
        if (!stageId) return "No Stage";
        const stage = stages.find(s => s.id === stageId);
        return stage ? stage.name : "No Stage";
    };

    const getSourceName = (sourceId) => {
        if (!sourceId) return null;
        const source = sources.find(s => s.id === sourceId);
        return source ? source.name : null;
    };

    const renderPipelineStageInfo = (lead) => {
        const pipelineName = getPipelineName(lead.pipeline);
        const stageName = getStageName(lead.stage);

        return (
            <div className="pipeline-stage-info">
                <div className="pipeline-name">{truncateText(pipelineName || "No Pipeline", 20)}</div>
                <div className="stage-name">{truncateText(stageName || "No Stage", 20)}</div>
            </div>
        );
    };

    const handleStatusToggle = async (record, checked) => {
        try {
            const newStatus = checked ? 'open' : 'closed';
            await updateLead({
                id: record.id,
                data: {
                    ...record,
                    status: newStatus
                }
            }).unwrap();
        } catch (error) {
        }
    };

    const fields = [
        {
            name: 'leadTitle',
            title: 'Title',
            render: (title, record) => (
                <div
                    className="name-container"
                    style={{ fontWeight: '600', cursor: 'pointer' }}
                    onClick={() => navigateToLeadDetails(record)}
                >
                    <Tooltip title={title}>
                        <span className="name">{title.length > 30 ? `${title.substring(0, 30)}...` : title}</span>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => a.leadTitle.localeCompare(b.leadTitle)
        },
        {
            name: 'leadValue',
            title: 'Value',
            render: (value) => (
                <div className="inr-value formatted small">
                    {parseFloat(value).toLocaleString('en-IN')}
                </div>
            ),
            sorter: (a, b) => a.leadValue - b.leadValue
        },
        {
            name: 'pipeline',
            title: 'Pipeline / Stage',
            render: (_, record) => {
                const pipelineName = getPipelineName(record.pipeline);
                const stageName = getStageName(record.stage);
                const fullInfo = `${pipelineName} / ${stageName}`;

                return (
                    <div className="name-container">
                        <Tooltip title={fullInfo}>
                            {renderPipelineStageInfo(record)}
                        </Tooltip>
                    </div>
                );
            }
        },
        {
            name: 'source',
            title: 'Source',
            render: (sourceId) => sourceId ? <span>{truncateText(getSourceName(sourceId), 20)}</span> : null,
            filters: sources.map(source => ({ text: source.name, value: source.id })),
            onFilter: (value, record) => record.source === value,
            filterSearch: true
        },
        {
            name: 'status',
            title: 'Status',
            render: (status, record) => (
                <Switch
                    checked={status === 'open'}
                    onChange={(checked) => handleStatusToggle(record, checked)}
                    checkedChildren="Open"
                    unCheckedChildren="Closed"
                />
            ),
            filters: [
                { text: 'Open', value: 'open' },
                { text: 'Closed', value: 'closed' }
            ],
            onFilter: (value, record) => record.status === value
        },
        {
            name: 'priority',
            title: 'Priority',
            render: (priority) => priority ?
                <span style={{ fontWeight: '600', color: getPriorityColor(priority) }}>{priority}</span>
                : null,
            filters: [
                { text: 'High', value: 'high' },
                { text: 'Medium', value: 'medium' },
                { text: 'Low', value: 'low' }
            ],
            onFilter: (value, record) => record.priority === value,
            filterSearch: true
        }
    ];

    const actions = [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'lead',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'lead',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields);

    if (isLoading && leads.length === 0) {
        return (
            <FancyLoader
                message="Loading your leads..."
                subMessage="Please wait while we prepare your data"
                subMessage2="This may take a few moments"
                processingText="PROCESSING"
            />
        );
    }

    if (viewMode === 'grid') {
        return null;
    }

    return (
        <div className="table-list">
            <CommonTable
                data={leads}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} leads`,
                    showQuickJumper: true
                }}
                actionItems={actions}
                extraProps={{
                    itemName: 'leads',
                    className: 'lead-table'
                }}
                searchableColumns={['leadTitle', 'status', 'priority', 'source']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="lead"
            />
        </div>
    );
};

export default LeadList;