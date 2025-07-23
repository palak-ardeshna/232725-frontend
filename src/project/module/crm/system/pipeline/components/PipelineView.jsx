import React, { useState, useEffect } from 'react';
import { List, Tag, Divider, Typography, Button } from 'antd';
import dayjs from 'dayjs';
import { useGetStagesQuery } from '../../../../../../config/api/apiServices';

const { Title, Text } = Typography;

const PipelineView = ({ pipeline, onClose, hideHeader = false }) => {
    
    const { data: stagesResponse, isLoading } = useGetStagesQuery({ limit: 100 });
    const allStages = stagesResponse?.data?.items || [];

    const pipelineStages = allStages.filter(stage => stage.pipeline === pipeline.id);

    const stagesByType = pipelineStages.reduce((acc, stage) => {
        if (!acc[stage.type]) {
            acc[stage.type] = [];
        }
        acc[stage.type].push(stage);
        return acc;
    }, {});

    Object.keys(stagesByType).forEach(type => {
        stagesByType[type].sort((a, b) => a.order - b.order);
    });

    const stageTypes = Object.keys(stagesByType);

    const [selectedType, setSelectedType] = useState(stageTypes.length > 0 ? stageTypes[0] : null);

    useEffect(() => {
        if (stageTypes.length > 0 && !stageTypes.includes(selectedType)) {
            setSelectedType(stageTypes[0]);
        }
    }, [stageTypes, selectedType]);

    const handleCardClick = (type) => {
        setSelectedType(type);
    };

    const typesToShow = selectedType ? [selectedType] : [];

    return (
        <div className="pipeline-view">
            {!hideHeader && (
                <div className="pipeline-view-header">
                    <Title level={3} className="pipeline-view-title">{pipeline.name}</Title>
                    <Text className="pipeline-view-date">
                        Created on {dayjs(pipeline.createdAt).format('MMMM DD, YYYY')}
                    </Text>
                </div>
            )}

            <div className="pipeline-view-stats">
                <div className="pipeline-menu">
                    <div className="total-stages-text">
                        <span className="menu-label">Total Stages</span>
                        <span className="menu-count">{pipelineStages.length}</span>
                    </div>

                    {stageTypes.map(type => (
                        <Button
                            key={type}
                            type={selectedType === type ? "primary" : "default"}
                            className={`menu-item ${type.toLowerCase()}-menu-item ${selectedType === type ? 'active-menu-item' : ''}`}
                            onClick={() => handleCardClick(type)}
                        >
                            <span className="menu-label">{type.charAt(0).toUpperCase() + type.slice(1)} Stages</span>
                            <span className="menu-count">{stagesByType[type].length}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {typesToShow.map(type => (
                <React.Fragment key={type}>
                    <Divider orientation="left" className={`${type.toLowerCase()}-divider selected-divider`}>
                        <span className="divider-text">
                            {type.charAt(0).toUpperCase() + type.slice(1)} Stages
                        </span>
                    </Divider>
                    <List
                        className="stages-list"
                        variant
                        loading={isLoading}
                        dataSource={stagesByType[type]}
                        renderItem={stage => (
                            <List.Item className={`stage-item ${type.toLowerCase()}-stage-item`}>
                                <div className="stage-item-content">
                                    <div className="stage-item-name">
                                        <span>{stage.name}</span>
                                        {stage.is_default && <Tag className="default-badge">Default</Tag>}
                                    </div>
                                    <div className="stage-item-order">Order: {stage.order}</div>
                                </div>
                            </List.Item>
                        )}
                        locale={{ emptyText: `No ${type} stages found` }}
                    />
                </React.Fragment>
            ))}

            {typesToShow.length === 0 && (
                <div className="empty-stages-message">
                    <Text>No stages found. Please select a stage type.</Text>
                </div>
            )}
        </div>
    );
};

export default PipelineView; 