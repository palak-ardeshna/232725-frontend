import React, { useCallback, useMemo } from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Switch, message } from 'antd';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils.jsx';
import dayjs from 'dayjs';
import '../../../../../../../styles/_variables.scss';
import FancyLoader from '../../../../../../../components/FancyLoader';

const CostList = ({
    costs = [],
    isLoading = false,
    onEdit,
    onDelete,
    onBulkDelete,
    projectId,
    onCostUpdate,
    project,
    updatingCostId = null
}) => {
    const handleIncludeToggle = useCallback(async (record, checked) => {
        try {
            // Find the cost in the costs array and create a local update
            const updatedCosts = costs.map(cost => {
                // Match by the unique identifier combination
                if (cost.name === record.name &&
                    cost.date === record.date &&
                    parseFloat(cost.amount) === parseFloat(record.amount)) {
                    return { ...cost, includeInTotal: checked };
                }
                return cost;
            });

            // Update via parent component - pass the record being toggled
            if (onCostUpdate) {
                await onCostUpdate(updatedCosts, record);
            }

        } catch (error) {
            console.error('Failed to update cost inclusion status:', error);
            message.error('Failed to update cost status');
        }
    }, [costs, onCostUpdate]);

    // Use useMemo to prevent fields array recreation on each render
    const fields = useMemo(() => [
        {
            name: 'name',
            title: 'Name',
            render: (text) => (
                    <div className="title-container">
                        <span className="title">{text}</span>
                    </div>
            )
        },
        {
            name: 'amount',
            title: 'Amount',
            render: (amount) => (
                <div className="value-amount">
                    ₹{parseFloat(amount).toLocaleString('en-IN')}
                </div>
            )
        },
        {
            name: 'date',
            title: 'Date',
            render: (date) => {
                if (!date) return '-';
                return dayjs(date).format('DD MMM YYYY');
            }
        },
        {
            name: 'includeInTotal',
            title: 'Include in Total',
            render: (includeInTotal, record) => {
                // Check if this specific record is being updated
                const uniqueKey = `${record.name}-${record.date}-${record.amount}`;
                const isUpdatingThisRecord = updatingCostId === uniqueKey;

                return (
                <Switch
                    checked={Boolean(includeInTotal)}
                    onChange={(checked) => handleIncludeToggle(record, checked)}
                    checkedChildren="Included"
                    unCheckedChildren="Not included"
                        loading={isUpdatingThisRecord}
                />
                );
            }
        },
        {
            name: 'description',
            title: 'Description',
            render: (description) => description || '-'
        }
    ], [handleIncludeToggle, isLoading]);

    // Use useMemo to prevent actions array recreation on each render
    const actions = useMemo(() => [
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: onEdit,
            module: 'additionalCosts',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: onDelete,
            module: 'additionalCosts',
            permission: 'delete'
        }
    ], [onEdit, onDelete]);

    // Memoize columns and action items
    const columns = useMemo(() => generateColumns(fields), [fields]);

    // Convert costs to array safely
    const costsArray = useMemo(() => Array.isArray(costs) ? costs : [], [costs]);

    // Prepare data for the table with proper keys - use useMemo to prevent recalculation
    const tableData = useMemo(() => costsArray.map((cost, index) => {
        // Create a more stable key that doesn't include the includeInTotal value
        const uniqueKey = `${cost.name}-${cost.date}-${cost.amount}`;
        return {
            ...cost,
            key: uniqueKey || index,
            // Ensure includeInTotal is always a boolean
            includeInTotal: Boolean(cost.includeInTotal)
        };
    }), [costsArray]);

    // Early return must be after all hooks are called
    if (isLoading) {
        return <FancyLoader />;
    }

    return (
        <div className="table-list">
            <CommonTable
                module="additionalCosts"
                data={tableData}
                columns={columns}
                isLoading={isLoading}
                pagination={false}
                actionItems={actions}
                extraProps={{
                    itemName: 'costs',
                    className: 'cost-table'
                }}
                searchableColumns={['name', 'description']}
                rowSelection={true}
                onBulkDelete={onBulkDelete}
            />
        </div>
    );
};

// Wrap with React.memo to prevent unnecessary re-renders when props haven't changed
export default React.memo(CostList);