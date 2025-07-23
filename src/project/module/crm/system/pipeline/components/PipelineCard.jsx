import React from 'react';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import dayjs from 'dayjs';
import { useGetStagesQuery } from '../../../../../../config/api/apiServices';
import { FiMoreHorizontal } from 'react-icons/fi';

const PipelineCard = ({ pipeline, onEdit, onDelete, onView }) => {
    const { data: stagesResponse } = useGetStagesQuery({ limit: 100 });
    const allStages = stagesResponse?.data?.items || [];

    const pipelineStages = allStages.filter(stage => stage.pipeline === pipeline.id);
    const hasStages = pipelineStages.length > 0;

    const isSystemCreated = pipeline.created_by === 'SYSTEM';

    const getActionMenu = (pipeline) => {
        const menuItems = [];

        if (hasStages) {
            menuItems.push({
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Pipeline',
                onClick: () => onView(pipeline)
            });
        }

        menuItems.push({
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit Pipeline',
            onClick: () => onEdit(pipeline)
        });

        if (!isSystemCreated) {
            menuItems.push(
                {
                    type: 'divider'
                },
                {
                    key: 'delete',
                    icon: <DeleteOutlined style={{ color: 'var(--text-error)' }} />,
                    label: <span className="text-error">Delete Pipeline</span>,
                    danger: true,
                    onClick: () => onDelete(pipeline)
                }
            );
        }

        return { items: menuItems };
    };

    const renderActionButton = () => (
        <Dropdown
            menu={getActionMenu(pipeline)}
            trigger={['click']}
            placement="bottomRight"
            overlayClassName="pipeline-actions-dropdown"
        >
            <button className="action-button">
                <FiMoreHorizontal />
            </button>
        </Dropdown>
    );

    const pipelineStats = [
        {
            label: 'Stages',
            value: pipelineStages.length
        },
        {
            label: 'Created',
            value: dayjs(pipeline.createdAt).format('MMM DD, YYYY')
        }
    ];

    return (
        <div className="pipeline-card">
            <div className="pipeline-card-header">
                <h3 className="pipeline-card-title">{pipeline.name}</h3>
                {renderActionButton()}
            </div>
            <div className="pipeline-card-content">
                {pipelineStats.map((stat, index) => (
                    <div key={index} className="pipeline-card-info">
                        <span className="stat-label">{stat.label}</span>
                        <span className="stat-value">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PipelineCard; 