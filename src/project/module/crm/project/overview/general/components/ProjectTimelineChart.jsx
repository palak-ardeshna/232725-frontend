import React, { useMemo, useEffect, useState } from 'react';
import { Col } from 'antd';
import BaseChart from '../../../../../../../components/BaseChart';
import { useGetProjectQuery } from '../../../../../../../config/api/apiServices';

const ProjectTimelineChart = ({ milestones = [], totalMilestones = 0, isLoading = false, project }) => {
    const [projectData, setProjectData] = useState(null);

    // Get project ID from milestones or passed project prop
    const projectId = project?.id || (milestones[0]?.project_id);

    // Fetch project data if needed and not provided
    const { data: fetchedProjectData } = useGetProjectQuery(projectId, {
        skip: !projectId || !!project
    });

    // Use either passed project data or fetched data
    useEffect(() => {
        if (project) {
            setProjectData(project);
        } else if (fetchedProjectData?.data) {
            setProjectData(fetchedProjectData.data);
        }
    }, [project, fetchedProjectData]);

    const chartData = useMemo(() => {
        if (!milestones || milestones.length === 0) {
            return {
                chartItems: [],
                totalValue: 0
            };
        }

        // Get project value - this is the total value of the project
        const projectValue = projectData?.projectValue ? parseFloat(projectData.projectValue) : 0;

        if (!projectValue) {
            console.warn('Project value not available, using milestone sum as fallback');
        }

        // Get all milestones with payment values
        const milestonesWithPayment = milestones.filter(m =>
            m.payment_trigger_value &&
            parseFloat(m.payment_trigger_value) > 0
        );

        // Paid milestones
        const paidMilestones = milestonesWithPayment.filter(m =>
            m.payment_status === 'Fully Paid' ||
            m.payment_status === 'Paid'
        );

        // Calculate paid amount based on milestone payment type
        const paidAmount = paidMilestones.reduce((sum, m) => {
            const value = parseFloat(m.payment_trigger_value || 0);
            if (m.payment_trigger_type === '%' && projectValue) {
                // If percentage based, calculate from project value
                return sum + (value * projectValue / 100);
            }
            return sum + value;
        }, 0);

        // Calculate total milestone amount based on payment type
        const totalMilestoneAmount = milestonesWithPayment.reduce((sum, m) => {
            const value = parseFloat(m.payment_trigger_value || 0);
            if (m.payment_trigger_type === '%' && projectValue) {
                // If percentage based, calculate from project value
                return sum + (value * projectValue / 100);
            }
            return sum + value;
        }, 0);

        // Use project value if available, otherwise use total milestone amount
        const totalValue = projectValue || totalMilestoneAmount;

        // Calculate remaining amount
        const remainingAmount = totalValue - paidAmount;

        // Calculate percentages
        const paidPercentage = totalValue > 0
            ? Math.round((paidAmount / totalValue) * 100)
            : 0;

        const remainingPercentage = 100 - paidPercentage;

        // Create chart items
        const chartItems = [];

        if (paidAmount > 0) {
            chartItems.push({
                name: 'Paid',
                value: paidAmount,
                color: 'var(--success-color)',
                displayValue: `₹${paidAmount.toLocaleString('en-IN')} (${paidPercentage}%)`
            });
        }

        if (remainingAmount > 0) {
            chartItems.push({
                name: 'Remaining',
                value: remainingAmount,
                color: 'var(--warning-color)',
                displayValue: `₹${remainingAmount.toLocaleString('en-IN')} (${remainingPercentage}%)`
            });
        }

        return {
            chartItems,
            totalValue
        };
    }, [milestones, projectData]);

    return (
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <div className="chart-card">
                <BaseChart
                    title="Financial Overview"
                    data={chartData.chartItems}
                    isLoading={isLoading}
                    totalLabel={`Total: ₹${chartData.totalValue.toLocaleString('en-IN')}`}
                    emptyText="No payment data available"
                    defaultChartType="progress"
                />
            </div>
        </Col>
    );
};

export default ProjectTimelineChart; 