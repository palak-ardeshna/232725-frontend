import React, { useMemo } from 'react';
import { Card, Progress, Row, Col, Typography, Tag, Space } from 'antd';
import {
    AiFillClockCircle,
    AiFillCheckCircle,
    AiFillDollarCircle,
    AiFillCalendar
} from 'react-icons/ai';
import moment from 'moment';
import './ProjectProgressBar.scss';

const { Text, Title } = Typography;

const ProjectProgressBar = ({ project, milestones = [], financialData = {} }) => {
    const progressData = useMemo(() => {
        // Calculate overall completion percentage
        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
        const overallCompletion = totalMilestones > 0
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0;

        // Calculate financial progress
        const financialProgress = financialData.paidPercentage || 0;

        // For debugging - check what date fields are available
        console.log('Project date fields:', {
            project_id: project?.id,
            start_date: project?.start_date,
            startDate: project?.startDate,
            end_date: project?.end_date,
            endDate: project?.endDate,
            deadline: project?.deadline,
            dueDate: project?.dueDate,
            due_date: project?.due_date,
            allFields: Object.keys(project || {})
        });

        // Determine the actual start and end date fields
        const startDateField = project?.start_date || project?.startDate;
        const deadlineField = project?.end_date || project?.endDate || project?.deadline || project?.due_date || project?.dueDate;

        // Calculate timeline progress
        let timelineProgress = 0;
        if (startDateField) {
            const startDate = moment(startDateField);
            const today = moment();

            if (today.isBefore(startDate)) {
                timelineProgress = 0;
            } else if (deadlineField) {
                const endDate = moment(deadlineField);
                if (today.isAfter(endDate)) {
                    timelineProgress = 100;
                } else {
                    const totalDuration = endDate.diff(startDate, 'days');
                    const elapsedDuration = today.diff(startDate, 'days');
                    timelineProgress = Math.round((elapsedDuration / totalDuration) * 100);
                }
            } else {
                // If deadline is not set, calculate progress based on start date and current date
                const elapsedDays = today.diff(startDate, 'days');
                // Assuming a default project duration of 90 days if no deadline
                timelineProgress = Math.min(Math.round((elapsedDays / 90) * 100), 100);
            }
        }

        // Calculate days remaining
        let daysRemaining = 0;
        if (deadlineField) {
            const deadline = moment(deadlineField);
            const today = moment();
            daysRemaining = deadline.diff(today, 'days');
        }

        return {
            overallCompletion,
            financialProgress,
            timelineProgress,
            daysRemaining,
            startDate: startDateField ? moment(startDateField).format('MMM DD, YYYY') : 'Not set',
            deadline: deadlineField ? moment(deadlineField).format('MMM DD, YYYY') : 'Not set',
            hasDeadline: !!deadlineField
        };
    }, [project, milestones, financialData]);

    const getStatusColor = (value) => {
        if (value >= 75) return '#52c41a'; // Green
        if (value >= 50) return '#1890ff'; // Blue
        if (value >= 25) return '#faad14'; // Yellow
        return '#ff4d4f'; // Red
    };

    return (
        <Card className="project-progress-card">
            <Row gutter={[24, 16]}>
                <Col xs={24} md={24} lg={24}>
                    <Title level={4}>Project Progress Overview</Title>
                </Col>

                <Col xs={24} sm={8} lg={8}>
                    <div className="progress-item">
                        <div className="progress-header">
                            <Text strong>Overall Completion</Text>
                            <Text>{progressData.overallCompletion}%</Text>
                        </div>
                        <Progress
                            percent={progressData.overallCompletion}
                            strokeColor={getStatusColor(progressData.overallCompletion)}
                            showInfo={false}
                            strokeWidth={10}
                        />
                        <div className="progress-icon-text">
                            <AiFillCheckCircle style={{ color: getStatusColor(progressData.overallCompletion) }} />
                            <Text>{progressData.overallCompletion < 100 ? 'In Progress' : 'Completed'}</Text>
                        </div>
                    </div>
                </Col>

                <Col xs={24} sm={8} lg={8}>
                    <div className="progress-item">
                        <div className="progress-header">
                            <Text strong>Financial Progress</Text>
                            <Text>{progressData.financialProgress}%</Text>
                        </div>
                        <Progress
                            percent={progressData.financialProgress}
                            strokeColor={getStatusColor(progressData.financialProgress)}
                            showInfo={false}
                            strokeWidth={10}
                        />
                        <div className="progress-icon-text">
                            <AiFillDollarCircle style={{ color: getStatusColor(progressData.financialProgress) }} />
                            <Text>₹{financialData.formattedPaid} of ₹{financialData.formattedTotal}</Text>
                        </div>
                    </div>
                </Col>

                <Col xs={24} sm={8} lg={8}>
                    <div className="progress-item">
                        <div className="progress-header">
                            <Text strong>Timeline Progress</Text>
                            <Text>{progressData.timelineProgress}%</Text>
                        </div>
                        <Progress
                            percent={progressData.timelineProgress}
                            strokeColor={getStatusColor(100 - progressData.timelineProgress)}
                            showInfo={false}
                            strokeWidth={10}
                        />
                        <div className="progress-icon-text">
                            <AiFillClockCircle style={{ color: getStatusColor(100 - progressData.timelineProgress) }} />
                            <Text>
                                {!progressData.hasDeadline
                                    ? 'No deadline set'
                                    : progressData.daysRemaining > 0
                                        ? `${progressData.daysRemaining} days remaining`
                                        : 'Deadline passed'}
                            </Text>
                        </div>
                    </div>
                </Col>

                <Col xs={24}>
                    <Space className="timeline-dates">
                        <Tag icon={<AiFillCalendar />} color="blue">Start: {progressData.startDate}</Tag>
                        <Tag icon={<AiFillCalendar />} color="red">
                            Deadline: {progressData.deadline}
                        </Tag>
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default ProjectProgressBar; 