import React, { useEffect, useMemo } from 'react';
import { Badge, Card, Empty, Spin, Typography } from 'antd';
import { FiFlag, FiEdit, FiTrash2, FiCalendar, FiEye } from 'react-icons/fi';
import { MoreOutlined } from '@ant-design/icons';
import { useGetMilestonesQuery } from '../../../../../../../config/api/apiServices';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils';
import moment from 'moment';

const { Text } = Typography;


const MilestoneList = ({
    project,
    onEdit,
    onReschedule,
    onDelete,
    onSelect,
    selectedMilestone,
    onBulkDelete,
    paymentTypeFilter = 'all',
    onView,
    customMilestones
}) => {
    const {
        data: milestonesData,
        isLoading: isMilestonesLoading
    } = useGetMilestonesQuery(
        { project_id: project?.id },
        {
            skip: !project?.id || !!customMilestones,
            pollingInterval: 5000
        }
    );

    const colorMap = {
        'Pending': 'var(--text-warning)',
        'In Progress': 'var(--text-primary)',
        'Completed': 'var(--text-success)',
        'Overdue': 'var(--text-error)',
        'Cancelled': 'var(--text-error)'
    };

    const milestones = useMemo(() => {
        if (customMilestones) return customMilestones;

        const allMilestones = milestonesData?.data?.items || [];

        // Filter by payment type if needed
        let filteredMilestones = [...allMilestones];
        if (paymentTypeFilter !== 'all') {
            filteredMilestones = filteredMilestones.filter(m => m.payment_type === paymentTypeFilter);
        }

        // Sort by due date - create a new array to avoid modifying a read-only array
        return [...filteredMilestones].sort((a, b) =>
            moment(a.due_date).diff(moment(b.due_date))
        );

    }, [milestonesData, paymentTypeFilter, customMilestones]);

    const milestoneFields = useMemo(() => [
        {
            name: 'title',
            title: 'Title',
            render: (text) => (
                <div className="title-container">
                    <span className="title">{text}</span>
                </div>
            )
        },
        {
            name: 'due_date',
            title: 'Due Date',
            render: (date) => date ? moment(date).format('DD MMM YYYY') : '-'
        },
        {
            name: 'status',
            title: 'Status',
            render: (status) => status || 'Pending'
        },
        {
            name: 'payment_trigger_value',
            title: 'Amount',
            render: (value) => value ? `₹${parseFloat(value).toLocaleString('en-IN')}` : '-'
        }
    ], []);

    const milestoneColumns = useMemo(() => generateColumns(milestoneFields), [milestoneFields]);

    const fields = [
        {
            name: 'title',
            title: 'Title',
            sorter: true,
            render: (text) => (
                <Text strong className="milestone-title-text">{text}</Text>
            )
        },
        {
            name: 'due_date',
            title: 'Due Date',
            sorter: true,
            render: (date) => date ? moment(date).format('DD MMM YYYY') : '-'
        },
        {
            name: 'status',
            title: 'Status',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'In Progress', value: 'In Progress' },
                { text: 'Completed', value: 'Completed' },
                { text: 'Overdue', value: 'Overdue' }
            ],
            render: (status) => {
                if (!status) return '-';
                return <Badge status="processing" color={colorMap[status]} text={status} />;
            }
        },
        {
            name: 'progress_percent',
            title: 'Progress',
            sorter: true,
            render: (progress, record) => {
                if (record.payment_type === 'unconditional') {
                    return <Text strong>100%</Text>;
                }

                let formattedProgress;

                if (progress === null || progress === undefined) {
                    formattedProgress = "0";
                } else {
                    let progressNum;
                    try {
                        progressNum = typeof progress === 'string' ? parseFloat(progress) : Number(progress);

                        if (progressNum === Math.floor(progressNum)) {
                            formattedProgress = progressNum.toString();
                        } else {
                            formattedProgress = progressNum.toFixed(2);
                        }
                        if (formattedProgress === "NaN") {
                            formattedProgress = "0";
                            console.error("Progress was NaN:", progress);
                        }
                    } catch (e) {
                        console.error("Error formatting progress:", e);
                        formattedProgress = "0";
                    }
                }

                const progressText = `${formattedProgress}%`;
                return <Text>{progressText}</Text>;
            }
        },
        {
            name: 'payment_type',
            title: 'Type',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'Conditional', value: 'conditional' },
                { text: 'Advance', value: 'unconditional' }
            ],
            render: (type) => {
                if (!type) return '-';

                if (type === 'unconditional') {
                    return 'Advance';
                }

                return type.charAt(0).toUpperCase() + type.slice(1);
            }
        },
        {
            name: 'payment_request_stage',
            title: 'Stage',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'During Progress', value: 'during_progress' },
                { text: 'On Completion', value: 'on_completion' }
            ],
            render: (stage, record) => {
                if (record.payment_type !== 'conditional') return '-';
                if (!stage) return '-';
                const formattedStage = stage.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');

                return <Text>{formattedStage}</Text>;
            }
        },
        {
            name: 'payment_status',
            title: 'Payment Status',
            sorter: true,
            filterMultiple: false,
            filters: [
                { text: 'Paid', value: 'Paid' },
                { text: 'Unpaid', value: 'Unpaid' }
            ],
            render: (status, record) => {
                if (record.payment_type === 'unconditional') {
                    return <Badge status="processing" text="Paid" />;
                }

                if (!status) return <Badge status="warning" text="Unpaid" />;

                if (status === 'Fully Paid' || status === 'Completed') {
                    return <Badge status="success" color="var(--text-success)" text="Paid" />;
                } else {
                    return <Badge status="default" color="var(--text-error)" text="Unpaid" />;
                }
            }
        }
    ];

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <FiEye size={16} />,
            handler: onView,
            module: 'milestone',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <FiEdit size={16} />,
            handler: onEdit,
            module: 'milestone',
            permission: 'update'
        },
        {
            key: 'reschedule',
            label: 'Reschedule',
            icon: <FiCalendar size={16} />,
            handler: onReschedule,
            disabled: (record) => !record.reset_due_on_fail,
            module: 'milestone',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <FiTrash2 size={16} />,
            danger: true,
            handler: onDelete,
            module: 'milestone',
            permission: 'delete'
        }
    ];

    const columns = generateColumns(fields);

    if (isMilestonesLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
                <Text>Loading milestones...</Text>
            </div>
        );
    }

    if (!project?.id) {
        return (
            <div className="empty-state">
                <Empty
                    description="No project selected"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    return (
        <div className="milestone-container">
            <div className="table-list">
                <CommonTable
                    data={milestones}
                    columns={columns}
                    pagination={false}
                    extraProps={{
                        itemName: 'milestones',
                        className: 'milestone-table'
                    }}
                    searchableColumns={['title', 'status', 'payment_status', 'payment_request_stage', 'payment_trigger_value']}
                    rowSelection={true}
                    onBulkDelete={onBulkDelete}
                    actionItems={actions}
                    module="milestone"
                    locale={{
                        emptyText: (
                            <div className="empty-state">
                                <Empty
                                    description={
                                        paymentTypeFilter !== 'all'
                                            ? `No ${paymentTypeFilter.charAt(0).toUpperCase() + paymentTypeFilter.slice(1)} milestones found for this project`
                                            : "No milestones found for this project"
                                    }
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </div>
                        )
                    }}
                    onRow={(record) => ({
                        onClick: () => onSelect && onSelect(record),
                        className: selectedMilestone && selectedMilestone.id === record.id ? 'selected-row' : ''
                    })}
                />
            </div>
        </div>
    );
};

export default MilestoneList; 