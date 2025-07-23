import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Empty, Spin, Tag, Dropdown, message, Tooltip, Modal, Form, Input, Avatar, Space, Badge } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined, EyeOutlined } from '@ant-design/icons';
import { RiEditLine, RiFileList3Line } from 'react-icons/ri';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import '../styles/KanbanView.scss';
import CommonForm from './CommonForm';
import { ModalTitle } from './AdvancedForm';

const { TextArea } = Input;

const CommonKanbanView = ({
    items = [],
    isLoading,
    onEdit,
    onDelete,
    onViewItem,
    pipelines = [],
    stages = [],
    selectedPipeline,
    moduleType,
    updateItemMutation,
    updateStageMutation,
    getContactOrClientName,
    getSourceName,
    getStatusName,
    navigateUrl,
    titleField,
    valueField,
    contactOrClientField,
    contactOrClientLabel,
    disableColumnDrag = false,
    users = [],
    roles = [],
    employees = []
}) => {
    const [stageGroups, setStageGroups] = useState({});
    const [pipelineStages, setPipelineStages] = useState([]);
    const [updateItem] = updateItemMutation();
    const [updateStage] = updateStageMutation();
    const navigate = useNavigate();

    const [statusChangeModal, setStatusChangeModal] = useState({
        visible: false,
        itemId: null,
        fromStatus: null,
        toStatus: null,
        reason: '',
        loading: false
    });
    const [statusChangeForm] = Form.useForm();

    useEffect(() => {
        if (selectedPipeline) {
            const filteredStages = stages.filter(
                stage => stage.pipeline === selectedPipeline && stage.type === moduleType
            );

            const sortedStages = [...filteredStages].sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return 0;
            });

            if (sortedStages.length === 0) {
                const allModuleStages = stages.filter(stage => stage.type === moduleType);

                if (allModuleStages.length === 0) {
                    setPipelineStages([{
                        id: 'default-stage',
                        name: 'Default Stage',
                        pipeline: selectedPipeline,
                        type: moduleType,
                        order: 0
                    }]);
                } else {
                    setPipelineStages(allModuleStages);
                }
            } else {
                setPipelineStages(sortedStages);
            }
        } else {
            const allModuleStages = stages.filter(stage => stage.type === moduleType);

            if (allModuleStages.length === 0) {
                setPipelineStages([{
                    id: 'default-stage',
                    name: 'Default Stage',
                    pipeline: null,
                    type: moduleType,
                    order: 0
                }]);
            } else {
                setPipelineStages(allModuleStages);
            }
        }
    }, [selectedPipeline, stages, moduleType]);

    const processedItems = useMemo(() => {
        if (!items || items.length === 0) {
            return [];
        }

        const filteredItems = selectedPipeline
            ? items.filter(item => item.pipeline === selectedPipeline)
            : items;

        return filteredItems.map(item => ({
            ...item,
            contactOrClientName: getContactOrClientName ?
                getContactOrClientName(item[contactOrClientField]) :
                item[contactOrClientField],
            sourceName: getSourceName ?
                getSourceName(item.source) :
                item.source,
            statusName: getStatusName && moduleType === 'project' && item.status ?
                getStatusName(item.status) :
                (item.statusName || item.status)
        }));
    }, [
        items,
        selectedPipeline,
        getContactOrClientName,
        contactOrClientField,
        getSourceName,
        getStatusName,
        moduleType
    ]);

    useEffect(() => {
        if (!processedItems || processedItems.length === 0) {
            setStageGroups({});
            return;
        }

        const groups = {};

        pipelineStages.forEach(stage => {
            groups[stage.id] = {
                id: stage.id,
                name: stage.name,
                items: []
            };
        });

        processedItems.forEach(item => {
            const stageId = moduleType === 'task' ? item.status || 'Pending' : item.stage;

            if (groups[stageId]) {
                groups[stageId].items.push(item);
            } else if (stageId && !groups[stageId]) {
                groups[stageId] = {
                    id: stageId,
                    name: stageId,
                    items: [item]
                };
            } else {
                const defaultStage = pipelineStages.find(s => s.is_default) ||
                    (pipelineStages.length > 0 ? pipelineStages[0] : null);

                if (defaultStage) {
                    groups[defaultStage.id].items.push(item);
                }
            }
        });

        setStageGroups(groups);
    }, [processedItems, pipelineStages, moduleType]);

    const handleViewItem = useCallback((item) => {
        if (onViewItem) {
            onViewItem(item);
        } else if (navigateUrl) {
            navigate(`${navigateUrl}${item.id}`);
        }
    }, [navigate, navigateUrl, onViewItem]);

    const getActionItems = useCallback((record) => [
        {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View',
            onClick: (e) => {
                e.domEvent.stopPropagation();
                handleViewItem(record);
            }
        },
        {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onEdit(record);
            }
        },
        {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onDelete(record);
            },
            danger: true
        }
    ], [onEdit, onDelete, handleViewItem]);

    const renderEmptyState = () => (
        <div className="empty-state">
            <RiFileList3Line className="empty-icon" />
            <p className="empty-text">No {moduleType}s found. Create one to get started.</p>
        </div>
    );

    const handleDragEnd = useCallback(async (result) => {
        const { source, destination, draggableId, type } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        if (type === 'COLUMN' && !disableColumnDrag) {
            const stage = pipelineStages[source.index];

            if (!stage) return;

            try {
                await updateStage({
                    id: stage.id,
                    data: {
                        ...stage,
                        order: destination.index
                    }
                }).unwrap();
            } catch (error) {
                message.error('Failed to update stage order');
            }
            return;
        }

        const itemId = draggableId;
        const item = items.find(i => i.id === itemId);

        if (!item) return;

        if (moduleType === 'task' && source.droppableId !== destination.droppableId) {
            setStatusChangeModal({
                visible: true,
                itemId,
                fromStatus: source.droppableId,
                toStatus: destination.droppableId,
                reason: '',
                loading: false
            });
            statusChangeForm.resetFields();
            return;
        }

        try {
            if (moduleType === 'task') {
                await updateItem({
                    id: item.id,
                    data: {
                        ...item,
                        status: destination.droppableId
                    }
                }).unwrap();
            } else {
                await updateItem({
                    id: item.id,
                    data: {
                        ...item,
                        stage: destination.droppableId
                    }
                }).unwrap();
            }
        } catch (error) {
            message.error(`Failed to move ${moduleType}`);
        }
    }, [items, pipelineStages, updateItem, updateStage, moduleType, disableColumnDrag, statusChangeForm]);

    const handleStatusChangeConfirm = async (values) => {
        try {
            setStatusChangeModal(prev => ({ ...prev, loading: true }));

            const item = items.find(i => i.id === statusChangeModal.itemId);
            if (!item) return;

            await updateItem({
                id: item.id,
                data: {
                    ...item,
                    status: statusChangeModal.toStatus,
                    statusNote: values.reason
                }
            }).unwrap();

            message.success(`${moduleType.charAt(0).toUpperCase() + moduleType.slice(1)} status updated successfully`);
            setStatusChangeModal({
                visible: false,
                itemId: null,
                fromStatus: null,
                toStatus: null,
                reason: '',
                loading: false
            });
        } catch (error) {
            message.error(`Failed to update status: ${error.message || 'Unknown error'}`);
            setStatusChangeModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleStatusChangeCancel = () => {
        setStatusChangeModal({
            visible: false,
            itemId: null,
            fromStatus: null,
            toStatus: null,
            reason: '',
            loading: false
        });
    };

    const renderActionButton = useCallback((item) => (
        <Dropdown
            menu={{ items: getActionItems(item) }}
            trigger={['click']}
            placement="bottomRight"
            onClick={(e) => e.stopPropagation()}
        >
            <button className="action-button" onClick={(e) => e.stopPropagation()}>
                <MoreOutlined />
            </button>
        </Dropdown>
    ), [getActionItems]);

    const getAssignedUserDetails = useCallback((userId) => {
        if (isLoading) {
            return { name: 'Loading...', role: '', type: null };
        }

        if (!userId) {
            return { name: 'Unassigned', role: '', type: null };
        }

        let type = null;
        let id = userId;

        if (typeof userId === 'string') {
            if (userId.startsWith('user_')) {
                type = 'user';
                id = userId.replace('user_', '');
            } else if (userId.startsWith('employee_')) {
                type = 'employee';
                id = userId.replace('employee_', '');
            }
        }

        if (type === 'user' || !type) {
            const user = users.find(u => u.id === id || u.id === userId);
            if (user) {
                let roleName = '';
                if (user.role_id) {
                    const userRole = roles.find(r => r.id === user.role_id);
                    roleName = userRole ? userRole.role_name : '';
                }
                const userName = user.username || 'Unnamed User';
                return { name: userName, role: roleName, type: 'user' };
            }
        }

        if (type === 'employee' || !type) {
            const employee = employees.find(e => e.id === id || e.id === userId);
            if (employee) {
                let roleName = employee.designation || 'Employee';
                const employeeName = employee.username || employee.employee_id || 'Unnamed Employee';
                return { name: employeeName, role: roleName, type: 'employee' };
            }
        }

        return { name: 'Unassigned', role: '', type: null };
    }, [users, roles, employees, isLoading]);

    const renderAssignedUser = useCallback((userId) => {
        // First check if we can get user details from the arrays
        const userDetails = getAssignedUserDetails(userId);

        // If the user is "Unassigned" and we have no role, try to use contactOrClientName
        if (userDetails.name === 'Unassigned' && !userDetails.role) {
            // For items that have contactOrClientName already set (from getContactOrClientName)
            const item = processedItems.find(item => item[contactOrClientField] === userId);
            if (item && item.contactOrClientName) {
                return (
                    <div className="user-info-container">
                        <Space align="center">
                            <Avatar size="small" style={{ backgroundColor: 'var(--primary-color)' }}>
                                {item.contactOrClientName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Space direction="vertical" size={0} className="user-details">
                                <span className="user-name">{item.contactOrClientName}</span>
                            </Space>
                        </Space>
                    </div>
                );
            }
        }

        // Default rendering
        return (
            <div className="user-info-container">
                <Space align="center">
                    <Avatar size="small" style={{ backgroundColor: 'var(--primary-color)' }}>
                        {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Space direction="vertical" size={0} className="user-details">
                        <span className="user-name">{userDetails.name}</span>
                        {userDetails.role && (
                            <div className="role-badge">
                                <Badge status={userDetails.type === 'user' ? "processing" : "default"} />
                                <span className="role-text">{userDetails.role}</span>
                            </div>
                        )}
                    </Space>
                </Space>
            </div>
        );
    }, [getAssignedUserDetails, processedItems, contactOrClientField]);

    const renderKanbanCard = useCallback((item, provided) => (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`${moduleType}-card`}
            onClick={(e) => {
                if (e.target.closest('.action-button') || e.target.closest('.ant-dropdown')) {
                    e.stopPropagation();
                    return;
                }
                handleViewItem(item);
            }}
        >
            <div className={`${moduleType}-card-header`}>
                <Tooltip title={item[titleField]}>
                    <h3 className={`${moduleType}-card-title`}>{item[titleField]}</h3>
                </Tooltip>
                {renderActionButton(item)}
            </div>
            <div className={`${moduleType}-card-content`}>
                {item[contactOrClientField] && (
                    <div className={`${moduleType}-card-info`}>
                        <span className="stat-label">{contactOrClientLabel}</span>
                        <div className="stat-value user-value">
                            {renderAssignedUser(item[contactOrClientField])}
                        </div>
                    </div>
                )}
                <div className={`${moduleType}-card-info`}>
                    <span className="stat-label">{moduleType === 'task' ? 'Description' : 'Value'}</span>
                    <span className="stat-value">
                        {moduleType === 'task'
                            ? item[valueField]
                            : `₹${parseFloat(item[valueField] || 0).toLocaleString()}`
                        }
                    </span>
                </div>
                <div className={`${moduleType}-card-status-row`}>
                    {item.status && moduleType !== 'task' && (
                        <Tooltip title={`Status: ${moduleType === 'project' ? (item.statusName || item.status) : item.status}`}>
                            <span className={`stat-tag ${(item.statusName || item.status).toLowerCase().replace(/\s+/g, '-')}`}>
                                {moduleType === 'project' ?
                                    (item.statusName || item.status) :
                                    item.status}
                            </span>
                        </Tooltip>
                    )}
                    {item.priority && (
                        <Tooltip title={`Priority: ${item.priority}`}>
                            <span className={`stat-tag ${item.priority.toLowerCase()}`}>{item.priority}</span>
                        </Tooltip>
                    )}
                    {!item.status && !item.priority && (
                        <Tooltip title={`Status: ${moduleType === 'project' ? 'In Progress' : 'Open'}`}>
                            <span className="stat-tag open">{moduleType === 'project' ? 'In Progress' : 'Open'}</span>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    ), [handleViewItem, moduleType, renderActionButton, titleField, contactOrClientField, contactOrClientLabel, valueField, renderAssignedUser]);

    if (isLoading) {
        return <div className="center-spinner"><Spin size="large" /></div>;
    }

    if (items.length === 0 && pipelineStages.length === 0) {
        return renderEmptyState();
    }

    return (
        <>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className={`${moduleType}-kanban`}>
                    <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                        {(provided) => (
                            <Row
                                className="kanban-container"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {pipelineStages.map((stage, index) => {
                                    const stageGroup = stageGroups[stage.id] || { items: [] };

                                    if (disableColumnDrag) {
                                        return (
                                            <Col
                                                key={stage.id}
                                                className="kanban-column"
                                            >
                                                <div className="kanban-column-header">
                                                    <h3>{stage.name}</h3>
                                                    <Tag>{stageGroup.items.length}</Tag>
                                                </div>
                                                <Droppable droppableId={stage.id} type="CARD">
                                                    {(provided) => (
                                                        <div
                                                            className="kanban-column-content"
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                        >
                                                            {stageGroup.items.length === 0 ? (
                                                                <Empty
                                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                    description={`No ${moduleType}s in this stage`}
                                                                    className="kanban-empty"
                                                                />
                                                            ) : (
                                                                stageGroup.items.map((item, index) => (
                                                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                                                        {(provided) => renderKanbanCard(item, provided)}
                                                                    </Draggable>
                                                                ))
                                                            )}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </Col>
                                        );
                                    }

                                    return (
                                        <Draggable key={stage.id} draggableId={stage.id} index={index}>
                                            {(provided) => (
                                                <Col
                                                    className="kanban-column"
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                >
                                                    <div className="kanban-column-header" {...provided.dragHandleProps}>
                                                        <h3>{stage.name}</h3>
                                                        <Tag>{stageGroup.items.length}</Tag>
                                                    </div>
                                                    <Droppable droppableId={stage.id} type="CARD">
                                                        {(provided) => (
                                                            <div
                                                                className="kanban-column-content"
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                            >
                                                                {stageGroup.items.length === 0 ? (
                                                                    <Empty
                                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                        description={`No ${moduleType}s in this stage`}
                                                                        className="kanban-empty"
                                                                    />
                                                                ) : (
                                                                    stageGroup.items.map((item, index) => (
                                                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                                                            {(provided) => renderKanbanCard(item, provided)}
                                                                        </Draggable>
                                                                    ))
                                                                )}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </Col>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </Row>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>

            <Modal
                title={<ModalTitle icon={<RiEditLine />} title={`Update ${moduleType} Status`} />}
                open={statusChangeModal.visible}
                onOk={() => { }}
                onCancel={handleStatusChangeCancel}
                footer={null}
                maskClosable={false}
                destroyOnClose
            >
                <CommonForm
                    onSubmit={handleStatusChangeConfirm}
                    onCancel={handleStatusChangeCancel}
                    isSubmitting={statusChangeModal.loading}
                    submitButtonText="Update Status"
                    initialValues={{ reason: '' }}
                >
                    <Form.Item
                        label={`Changing status from ${statusChangeModal.fromStatus} to ${statusChangeModal.toStatus}`}
                        name="reason"
                        rules={[
                            { required: true, message: 'Please provide a reason for the status change' },
                            { min: 5, message: 'Reason must be at least 5 characters' },
                            { max: 500, message: 'Reason cannot exceed 500 characters' }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter the reason for changing the status"
                        />
                    </Form.Item>
                </CommonForm>
            </Modal>
        </>
    );
};

export default CommonKanbanView; 