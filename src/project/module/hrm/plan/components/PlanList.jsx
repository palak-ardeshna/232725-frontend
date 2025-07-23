import React from 'react';
import { EditOutlined, DeleteOutlined, StarOutlined } from '@ant-design/icons';
import { message, Tooltip, Tag } from 'antd';
import dayjs from 'dayjs';
import CommonTable from '../../../../../components/CommonTable';
import { generateColumns } from '../../../../../utils/tableUtils.jsx';
import { planApi } from '../../../../../config/api/apiServices';

const PlanList = ({
    plans,
    isLoading,
    currentPage,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onBulkDelete,
    refetchPlans
}) => {
    const [updatePlan] = planApi.useUpdateMutation();

    const handleToggleDefault = async (plan) => {
        try {
            if (plan.isDefault) {
                message.info('This plan is already set as default');
                return;
            }
            
            await updatePlan({
                id: plan.id,
                data: { isDefault: true }
            }).unwrap();
            message.success('Default plan updated successfully');
            refetchPlans();
        } catch (error) {
            message.error('Failed to update default plan');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const formatDuration = (duration, durationType) => {
        if (durationType === 'lifetime') return 'Lifetime';
        
        let unit = '';
        switch (durationType) {
            case 'day':
                unit = duration === 1 ? 'Day' : 'Days';
                break;
            case 'month':
                unit = duration === 1 ? 'Month' : 'Months';
                break;
            case 'year':
                unit = duration === 1 ? 'Year' : 'Years';
                break;
            default:
                unit = '';
        }
        
        return `${duration} ${unit}`;
    };

    const fields = [
        {
            name: 'planName',
            title: 'Plan Name',
            render: (text, record) => (
                <div className="name-container">
                    <Tooltip title={text}>
                        <span className="name">
                            {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                        </span>
                    </Tooltip>
                    {record.isDefault && <Tag color="blue" style={{ marginLeft: 8 }}>Default</Tag>}
                    {record.isTrial && <Tag color="purple" style={{ marginLeft: 8 }}>Trial</Tag>}
                </div>
            )
        },
        {
            name: 'price',
            title: 'Price',
            render: (price, record) => (
                <div className="price-container">
                    <span className="price" style={{ fontWeight: 'bold', color: '#1890ff' }}>
                        {formatPrice(price)}
                    </span>
                    
                </div>
            )
        },
        {
            name: 'duration',
            title: 'Duration',
            render: (duration, record) => (
                <div className="duration-container">
                    <span className="duration" style={{ 
                        fontWeight: record.isLifetime ? 'bold' : 'normal',
                        color: record.isLifetime ? '#52c41a' : 'inherit'
                    }}>
                        {record.isLifetime ? 'Lifetime' : formatDuration(duration, record.durationType)}
                    </span>
                </div>
            )
        },
        {
            name: 'trialDays',
            title: 'Trial Days',
            render: (days) => (
                <div className="trial-days-container">
                    {days > 0 ? (
                        <Tag color="purple">{days} Days</Tag>
                    ) : (
                        <span style={{ color: '#999' }}>No Trial</span>
                    )}
                </div>
            )
        },
        {
            name: 'createdAt',
            title: 'Created',
            render: (date) => dayjs(date).format('DD/MM/YYYY')
        }
    ];

    const actions = [
        {
            key: 'setDefault',
            label: 'Set as Default',
            icon: <StarOutlined />,
            handler: handleToggleDefault,
            module: 'plan',
            permission: 'update',
            hidden: (record) => record.isDefault
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'plan',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'plan',
            permission: 'delete',
            hidden: (record) => record.isDefault
        }
    ];

    const columns = generateColumns(fields, {
        dateFields: ['createdAt']
    });

    return (
        <div className="table-list">
            <CommonTable
                data={plans.map(plan => ({ ...plan, key: plan.id }))}
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
                    itemName: 'plans',
                    className: 'plan-table'
                }}
                searchableColumns={['planName']}
                dateColumns={['createdAt']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
                module="plan"
            />
        </div>
    );
};

export default PlanList; 