import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Form, message, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AdvancedForm from '../../../../../../../components/AdvancedForm';
import dayjs from 'dayjs';
import {
    useGetMilestoneTasksQuery,
    useGetTeamMembersQuery,
    useGetEmployeesQuery,
    useGetMilestonesQuery
} from '../../../../../../../config/api/apiServices';
import getRole from '../../../../client/components/getRole';
const TaskForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    initialValues = null,
    milestoneId,
    milestones = [],
    projectId
}) => {
    const [form] = Form.useForm();
    const isEditMode = !!initialValues;

    const safeMillestoneId = milestoneId ? milestoneId.toString() : '';

    const {
        data: tasksData,
        isLoading: isLoadingTasks
    } = useGetMilestoneTasksQuery(
        { milestone_id: form.getFieldValue('milestone_id') || safeMillestoneId },
        { skip: !form.getFieldValue('milestone_id') && !safeMillestoneId }
    );

    const { data: milestonesData } = useGetMilestonesQuery(
        { project_id: projectId },
        { skip: !projectId }
    );

    const allMilestones = milestonesData?.data?.items || [];

    const {
        data: teamMembersData,
        isLoading: isLoadingTeamMembers
    } = useGetTeamMembersQuery(
        { limit: 'all' },
        {}
    );

    const {
        data: employeesData,
        isLoading: isLoadingEmployees
    } = useGetEmployeesQuery(
        { limit: 'all' },
        {}
    );

    const allTeamMembers = teamMembersData?.data?.items || [];
    const allEmployees = employeesData?.data?.items || [];

    const [teamMembers, setTeamMembers] = useState([]);
    const [milestoneMembers, setMilestoneMembers] = useState([]);

    useEffect(() => {
        const processedMembers = [];

        if (allEmployees && allEmployees.length > 0) {
            allEmployees.forEach(employee => {
                processedMembers.push({
                    id: employee.id,
                    name: employee.first_name && employee.last_name
                        ? `${employee.first_name} ${employee.last_name}`
                        : employee.username || 'Unnamed Employee'
                });
            });
        }

        if (allTeamMembers && allTeamMembers.length > 0) {
            allTeamMembers.forEach(team => {
                if (team.members) {
                    let memberIds = [];

                    if (typeof team.members === 'string') {
                        try {
                            memberIds = JSON.parse(team.members);
                        } catch (e) {
                            memberIds = [];
                        }
                    } else if (Array.isArray(team.members)) {
                        memberIds = team.members;
                    } else if (typeof team.members === 'object') {
                        memberIds = Object.keys(team.members);
                    }

                    memberIds.forEach(id => {
                        const existingMember = processedMembers.find(m => m.id.toString() === id.toString());
                        if (!existingMember) {
                            const memberName = team.members[id]?.name || `Member ${id}`;
                            processedMembers.push({
                                id: id,
                                name: memberName
                            });
                        }
                    });
                }
            });
        }

        const uniqueMembers = [];
        const memberIds = new Set();

        processedMembers.forEach(member => {
            if (!memberIds.has(member.id.toString())) {
                memberIds.add(member.id.toString());
                uniqueMembers.push(member);
            }
        });

        setTeamMembers(uniqueMembers);
    }, [allTeamMembers, allEmployees]);

    const [formValues, setFormValues] = useState({
        title: '',
        description: '',
        weight: 1,
        milestone_id: '',
        status: 'Pending',
        priority: 'Medium',
        assigned_to: '',
        completion_date: null
    });

    const [selectedMilestoneId, setSelectedMilestoneId] = useState(isEditMode ? '' : '');

    // State to store the selected milestone's due date
    const [selectedMilestoneDueDate, setSelectedMilestoneDueDate] = useState(null);

    const createValidationSchema = () => {
        return Yup.object().shape({
            title: Yup.string().required('Title is required'),
            milestone_id: Yup.string().required('Milestone is required'),
            assigned_to: Yup.string().required('Team member assignment is required'),
            due_date: Yup.date()
                .required('Due date is required')
                .test(
                    'not-after-milestone-due-date',
                    'Due date cannot be later than the milestone due date',
                    function (value) {
                        if (!value || !selectedMilestoneDueDate) return true;
                        return dayjs(value).isSameOrBefore(dayjs(selectedMilestoneDueDate));
                    }
                )
        });
    };

    const validationSchema = createValidationSchema();

    useEffect(() => {
        if (initialValues) {
            const dueDateValue = initialValues.due_date ?
                (dayjs.isDayjs(initialValues.due_date) ? initialValues.due_date : dayjs(initialValues.due_date))
                : null;

            const completionDateValue = initialValues.completion_date ?
                (dayjs.isDayjs(initialValues.completion_date) ? initialValues.completion_date : dayjs(initialValues.completion_date))
                : null;

            const safeMilestoneId = (initialValues.milestone_id || milestoneId || '').toString();
            setSelectedMilestoneId(safeMilestoneId);

            // Set the milestone due date when initializing the form
            const selectedMilestone = allMilestones.find(m => m.id.toString() === safeMilestoneId);
            if (selectedMilestone && selectedMilestone.due_date) {
                setSelectedMilestoneDueDate(selectedMilestone.due_date);
            }

            const processedValues = {
                ...initialValues,
                due_date: dueDateValue,
                completion_date: completionDateValue,
                milestone_id: safeMilestoneId
            };

            if (processedValues.status === 'Completed' && !processedValues.completion_date) {
                processedValues.completion_date = dayjs();
            }

            setFormValues(processedValues);
            form.setFieldsValue(processedValues);
        } else if (milestoneId) {
            const defaultValues = {
                ...formValues,
                milestone_id: milestoneId.toString(),
                status: 'Pending'
            };
            setSelectedMilestoneId(milestoneId.toString());

            // Set the milestone due date when initializing with a milestone ID
            const selectedMilestone = allMilestones.find(m => m.id.toString() === milestoneId.toString());
            if (selectedMilestone && selectedMilestone.due_date) {
                setSelectedMilestoneDueDate(selectedMilestone.due_date);
            }

            setFormValues(defaultValues);
            form.setFieldsValue(defaultValues);
        }
    }, [initialValues, form, milestoneId, allMilestones]);

    const handleStatusChange = (value) => {
        if (value === 'Completed') {
            form.setFieldsValue({ completion_date: dayjs() });
        } else {
            form.setFieldsValue({ completion_date: null });
        }
    };

    const milestoneOptions = milestones
        .filter(milestone => milestone.payment_type !== 'unconditional' && milestone.status !== 'Completed')
        .map(milestone => ({
            label: milestone.title,
            value: milestone.id.toString()
        }));

    useEffect(() => {
        if (selectedMilestoneId) {
            const selectedMilestone = allMilestones.find(m => m.id.toString() === selectedMilestoneId.toString());

            if (selectedMilestone && selectedMilestone.assigned_to) {
                let assignedMembers = [];

                if (typeof selectedMilestone.assigned_to === 'string') {
                    if (selectedMilestone.assigned_to.includes(',')) {
                        assignedMembers = selectedMilestone.assigned_to.split(',').map(id => id.trim());
                    } else {
                        assignedMembers = [selectedMilestone.assigned_to];
                    }
                } else if (Array.isArray(selectedMilestone.assigned_to)) {
                    assignedMembers = selectedMilestone.assigned_to;
                }

                const filteredMembers = teamMembers.filter(member =>
                    assignedMembers.some(id => id.toString() === member.id.toString())
                );

                setMilestoneMembers(filteredMembers);
            } else {
                setMilestoneMembers([]);
            }
        } else {
            setMilestoneMembers([]);
        }
    }, [selectedMilestoneId, allMilestones, teamMembers]);

    const teamMemberOptions = milestoneMembers.length > 0 ?
        milestoneMembers.map(member => ({
            label: member.name,
            value: member.id.toString()
        })) :
        teamMembers.map(member => ({
            label: member.name,
            value: member.id.toString()
        }));

    const handleMilestoneChange = (value) => {
        setSelectedMilestoneId(value);

        // Find the selected milestone and get its due date
        const selectedMilestone = allMilestones.find(m => m.id.toString() === value.toString());
        if (selectedMilestone && selectedMilestone.due_date) {
            setSelectedMilestoneDueDate(selectedMilestone.due_date);
        } else {
            setSelectedMilestoneDueDate(null);
        }

        form.setFieldsValue({ assigned_to: undefined });

        // If task due date is after milestone due date, reset it
        const currentDueDate = form.getFieldValue('due_date');
        if (currentDueDate && selectedMilestone && selectedMilestone.due_date) {
            const milestoneDueDate = dayjs(selectedMilestone.due_date);
            if (dayjs(currentDueDate).isAfter(milestoneDueDate)) {
                form.setFieldsValue({ due_date: null });
            }
        }
    };

    const role = getRole();

    const handleAddTeamMember = () => {
        window.open(`/${role}/project/overview/${projectId}/members`, '_blank');
    };

    const assignedToField = {
        name: 'assigned_to',
        label: 'Assigned To',
        type: 'select',
        placeholder: 'Select team member',
        options: teamMemberOptions,
        span: 12,
        loading: isLoadingTeamMembers || isLoadingEmployees,
        allowClear: true,
        rules: [{ required: true, message: 'Please select a team member' }],
        addonAfter: (
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTeamMember}
                size="small"
                style={{ marginLeft: 8 }}
            >
                Add Team
            </Button>
        )
    };

    const statusField = {
        name: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'Select status',
        options: isEditMode ? [
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Completed', label: 'Completed' }
        ] : [
            { value: 'Pending', label: 'Pending' }
        ],
        span: 12,
        onChange: handleStatusChange,
        hidden: !isEditMode
    };

    const milestoneField = {
        name: 'milestone_id',
        label: 'Milestone',
        type: 'select',
        placeholder: milestoneOptions.length > 0 ? 'Select milestone' : 'No active milestones available',
        options: milestoneOptions,
        rules: [{ required: true, message: 'Please select a milestone' }],
        span: 12,
        onChange: handleMilestoneChange,
        disabled: milestoneOptions.length === 0
    };

    if (milestoneOptions.length === 0) {
        milestoneField.help = 'All milestones are completed. Please add a new milestone first.';
    }

    const baseTaskFields = [
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            placeholder: 'Enter task title',
            rules: [{ required: true, message: 'Please enter task title' }],
            span: 24
        },
        {
            name: 'due_date',
            label: 'Due Date',
            type: 'date',
            placeholder: 'Select due date',
            span: 12,
            rules: [{ required: true, message: 'Please select a due date' }],
            style: { width: '100%' },
            dropdownStyle: { width: '100%' },
            popupClassName: 'date-picker-dropdown-same-width',
            disabledDate: (current) => {
                // Can't select days before today
                return current && current < dayjs().startOf('day');
            }
        },
        milestoneField
    ];

    if (isEditMode) {
        baseTaskFields.push(statusField);
    } else {
        baseTaskFields.push({
            name: 'status',
            type: 'hidden',
            initialValue: 'Pending'
        });
    }

    const taskFields = [
        ...baseTaskFields,
        {
            name: 'weight',
            type: 'hidden',
            initialValue: 1
        },
        assignedToField,
        {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            placeholder: 'Select priority',
            options: [
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' }
            ],
            span: 12
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter task description (optional)',
            rows: 4,
            span: 24
        },
        {
            name: 'completion_date',
            type: 'hidden'
        }
    ];

    const handleSubmit = (values) => {
        // In edit mode, if milestone_id is not selected, use the original milestone_id from initialValues
        if (isEditMode && !values.milestone_id && initialValues?.milestone_id) {
            values.milestone_id = initialValues.milestone_id;
        } else if (!values.milestone_id) {
            message.error('Please select a milestone');
            return;
        }

        if (!values.assigned_to) {
            message.error('Please assign this task to a team member');
            return;
        }

        if (!values.due_date) {
            message.error('Please set a due date for this task');
            return;
        }

        if (!isEditMode) {
            values.status = 'Pending';
        }

        if (values.status === 'Completed' && !values.completion_date) {
            values.completion_date = dayjs();
        }

        const formattedValues = {
            ...values,
            milestone_id: values.milestone_id.toString(),
            assigned_to: values.assigned_to ? values.assigned_to.toString() : null,
            due_date: values.due_date ?
                (dayjs.isDayjs(values.due_date) ? values.due_date.format('YYYY-MM-DD') : values.due_date)
                : null,
            completion_date: values.completion_date ?
                (dayjs.isDayjs(values.completion_date) ? values.completion_date.format('YYYY-MM-DD') : values.completion_date)
                : null
        };

        onSubmit(formattedValues);
    };

    const submitButtonText = initialValues ? 'Update Task' : 'Add Task';

    return (
        <AdvancedForm
            initialValues={formValues}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={taskFields}
            validationSchema={validationSchema}
            submitButtonText={submitButtonText}
            cancelButtonText="Cancel"
            columns={1}
            className="task-form"
            form={form}
        />
    );
};

export default TaskForm; 