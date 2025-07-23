import React, { useState, useEffect } from 'react';
import { useGetActivityQuery } from '../../../../../../config/api/apiServices';
import { Modal, message, Typography, Badge } from 'antd';
import { FiActivity } from 'react-icons/fi';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import CommonTable from '../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../utils/tableUtils.jsx';
import './activities.scss';

const { Text } = Typography;

const getActionColor = (action) => {
    const colors = {
        create: 'success',
        update: 'processing',
        delete: 'error',
        comment: 'purple',
        status_change: 'warning',
        stage_change: 'cyan',
        assign: 'geekblue',
        upload: 'magenta',
        other: 'default'
    };
    return colors[action] || 'default';
};

const ActivitiesTab = ({ project, customTitle }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: activityData, isLoading, refetch } = useGetActivityQuery(project.id, {
        skip: !project?.id
    });

    const activities = activityData?.data?.items || [];
    const totalCount = activityData?.data?.total || 0;

    useEffect(() => {
        if (project?.id) {
            refetch();
        }
    }, [project?.id, refetch, page, pageSize]);

    const handlePageChange = (newPage, newPageSize) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    // Define fields for the table
    const fields = [
        {
            name: 'description',
            title: 'Description',
            render: (text, record) => {
                if (record.action === 'status_change' || (text && text.includes('status changed to'))) {
                    return (
                        <div className="title-container">
                            <span className="title">Project status changed</span>
                        </div>
                    );
                }

                if (text && text.includes('Team members updated')) {
                    return (
                        <div className="title-container">
                            <span className="title">Team member removed</span>
                        </div>
                    );
                }

                return (
                    <div className="title-container">
                        <span className="title">{text}</span>
                    </div>
                );
            }
        },
        {
            name: 'action',
            title: 'Action',
            render: (action, record) => {
                if (record.description && record.description.includes('Team members updated')) {
                    return <Badge status="error" text="Delete" />;
                }

                if (!action) return '-';
                return (
                    <Badge
                        status={getActionColor(action)}
                        text={action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                    />
                );
            }
        },
        {
            name: 'type',
            title: 'Type',
            render: (type) => {
                if (!type) return '-';
                return (
                    <Text style={{ fontWeight: 500 }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                );
            }
        },
        {
            name: 'timestamp',
            title: 'Date',
            render: (date) => {
                if (!date) return '-';
                return new Date(date).toLocaleDateString();
            }
        }
    ];

    // Generate columns using the shared utility
    const columns = generateColumns(fields);

    // Module title
    const moduleTitle = customTitle || "Project Activities";

    return (
        <ModuleLayout
            module="activity"
            title={moduleTitle}
            icon={<FiActivity />}
            className="activities"
            contentClassName="activities-content"
            showHeader={false}
            showAddButton={false}
        >
            <div className="table-list">
                <CommonTable
                    data={activities.map((activity, index) => ({
                        ...activity,
                        key: activity.id || index,
                        timestamp: activity.createdAt
                    }))}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: totalCount,
                        onChange: handlePageChange
                    }}
                    extraProps={{
                        itemName: 'activities',
                        className: 'activity-table'
                    }}
                    searchableColumns={['description', 'type', 'action']}
                    module="activity"
                />
            </div>
        </ModuleLayout>
    );
};

export default ActivitiesTab; 