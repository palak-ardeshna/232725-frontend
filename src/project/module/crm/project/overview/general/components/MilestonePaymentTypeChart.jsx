import React, { useMemo } from 'react';
import { Col } from 'antd';
import BaseChart from '../../../../../../../components/BaseChart';

const MilestonePaymentTypeChart = ({ milestones = [], totalMilestones = 0, isLoading = false }) => {
    const chartData = useMemo(() => {
        if (!milestones || milestones.length === 0) {
            return [];
        }

        // Group milestones by payment type
        const paymentTypeCounts = {
            'conditional': 0,
            'unconditional': 0
        };

        // Count milestones by payment type
        milestones.forEach(milestone => {
            const paymentType = milestone.payment_type || 'conditional';
            if (paymentTypeCounts.hasOwnProperty(paymentType)) {
                paymentTypeCounts[paymentType]++;
            } else {
                paymentTypeCounts['conditional']++;
            }
        });

        // Create chart items with better display names
        const chartItems = [
            {
                name: 'Conditional Payment',
                value: paymentTypeCounts['conditional'],
                color: 'var(--primary-color)',
            },
            {
                name: 'Advance Payment',
                value: paymentTypeCounts['unconditional'],
                color: 'var(--success-color)',
            }
        ].filter(item => item.value > 0);

        return chartItems;
    }, [milestones]);

    return (
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <div className="chart-card">
                <BaseChart
                    title="Payment Structure"
                    data={chartData}
                    isLoading={isLoading}
                    totalLabel={`Total: ${totalMilestones} Milestones`}
                    emptyText="No milestone payment data available"
                    defaultChartType="progress"
                />
            </div>
        </Col>
    );
};

export default MilestonePaymentTypeChart; 