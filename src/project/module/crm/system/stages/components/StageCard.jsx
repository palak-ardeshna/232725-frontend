import React from 'react';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { useGetPipelinesQuery } from '../../../../../../config/api/apiServices';

const StageCard = ({ stage, onEdit, onDelete }) => {
    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 100 });
    const pipelines = pipelinesResponse?.data?.items || [];

    const isSystemCreated = stage.created_by === 'SYSTEM';

    const getPipelineName = (pipelineId) => {
        const pipeline = pipelines.find(p => p.id === pipelineId);
        return pipeline ? pipeline.name : pipelineId;
    };

    const getActionMenu = (stage) => {
        const menuItems = [
            {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Stage',
                onClick: () => onEdit(stage)
            }
        ];

        if (!isSystemCreated) {
            menuItems.push(
                {
                    type: 'divider'
                },
                {
                    key: 'delete',
                    icon: <DeleteOutlined style={{ color: 'var(--text-error)' }} />,
                    label: <span className="text-error">Delete Stage</span>,
                    danger: true,
                    onClick: () => onDelete(stage)
                }
            );
        }

        return { items: menuItems };
    };

    const renderActionButton = () => (
        <Dropdown
            menu={getActionMenu(stage)}
            trigger={['click']}
            placement="bottomRight"
            overlayClassName="stage-actions-dropdown"
        >
            <button className="action-button">
                <MoreOutlined />
            </button>
        </Dropdown>
    );

    const renderTypeLabel = (type) => (
        <span className="type-label">
            {type.toUpperCase()}
        </span>
    );

    const renderDefault = (isDefault) => {
        return isDefault ? <span className="default-yes">YES</span> : <span className="default-no">No</span>;
    };

    const stageStats = [
        {
            label: 'Type',
            value: renderTypeLabel(stage.type)
        },
        {
            label: 'Default',
            value: renderDefault(stage.is_default)
        },
        {
            label: 'Pipeline',
            value: <span className="pipeline-name">{getPipelineName(stage.pipeline)}</span>
        }
    ];

    return (
        <div className="stage-card">
            <div className="stage-card-header">
                <h3 className="stage-card-title">{stage.name}</h3>
                {renderActionButton()}
            </div>
            <div className="stage-card-content">
                {stageStats.map((stat, index) => (
                    <div key={index} className="stage-card-info">
                        <span className="stat-label">{stat.label}</span>
                        <span className="stat-value">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StageCard; 