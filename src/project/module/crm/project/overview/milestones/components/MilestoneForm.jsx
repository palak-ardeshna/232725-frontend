import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Form, Button, Empty, Modal, message, Switch, InputNumber } from 'antd';
import { useGetTeamMembersQuery, useGetProjectQuery, useUpdateProjectMutation, useGetRolesQuery, useGetEmployeesQuery, useUpdateTeamMemberMutation, useGetMilestonesQuery } from '../../../../../../../config/api/apiServices';
import AdvancedForm from '../../../../../../../components/AdvancedForm';
import dayjs from 'dayjs';
import { TeamOutlined, EditOutlined } from '@ant-design/icons';
import ProjectMemberForm from '../../../overview/members/components/ProjectMemberForm';
import { ModalTitle } from '../../../../../../../components/AdvancedForm';
import TeamMemberForm from '../../../../../hrm/teamMember/components/TeamMemberForm';

const validationSchema = (projectEndDate) => Yup.object().shape({
    title: Yup.string().required('Title is required'),
    assigned_to: Yup.array().min(1, 'At least one team member must be selected'),
    due_date: Yup.date()
        .required('Due date is required')
        .test(
            'not-after-project-end',
            'Due date cannot be later than the project end date',
            function (value) {
                if (!value || !projectEndDate) return true;
                return dayjs(value).isSameOrBefore(dayjs(projectEndDate));
            }
        )
});

const MilestoneForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    initialValues = null,
    projectId
}) => {
    // Create a form instance to manually handle validation
    const [form] = Form.useForm();

    // State for team modals
    const [isSelectTeamModalVisible, setIsSelectTeamModalVisible] = useState(false);
    const [isEditTeamModalVisible, setIsEditTeamModalVisible] = useState(false);
    const [updateProject, { isLoading: isUpdatingProject }] = useUpdateProjectMutation();
    const [updateTeamMember, { isLoading: isUpdatingTeam }] = useUpdateTeamMemberMutation();

    // Fetch project data to get the assigned team
    const { data: projectData, refetch: refetchProject } = useGetProjectQuery(projectId, {
        skip: !projectId
    });

    // Extract project end date for validation
    const projectEndDate = projectData?.data?.endDate;

    // Extract project value and ensure it's a number
    const rawProjectValue = projectData?.data?.projectValue;
    const projectValue = rawProjectValue ? parseFloat(rawProjectValue) : 0;

    const formattedProjectCost = projectValue.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: Math.floor(projectValue) === projectValue ? 0 : 2
    });

    // Fetch all milestones for this project to validate total amount
    const { data: milestonesData } = useGetMilestonesQuery(
        { project_id: projectId },
        {
            skip: !projectId
        }
    );
    const milestones = Array.isArray(milestonesData?.data?.items) ? milestonesData.data.items : [];

    // Calculate total allocated amount and remaining amount
    const calculateRemainingAmount = () => {
        let totalAllocated = 0;

        // Sum up amounts from existing milestones (excluding current milestone if editing)
        milestones.forEach(milestone => {
            // Skip the current milestone being edited
            if (initialValues && milestone.id === initialValues.id) {
                return;
            }

            // Add amount based on payment type and trigger type
            if (milestone.payment_type === 'unconditional' ||
                milestone.payment_trigger_type === 'fixed_amount') {
                const milestoneAmount = parseFloat(milestone.payment_trigger_value) || 0;
                totalAllocated += milestoneAmount;
            } else if (milestone.payment_trigger_type === '%') {
                // For percentage, calculate amount based on project value
                const percentage = parseFloat(milestone.payment_trigger_value) || 0;
                const calculatedAmount = (percentage / 100) * projectValue;
                totalAllocated += calculatedAmount;
            }
        });

        // Round to 2 decimal places to avoid floating point precision issues
        totalAllocated = Math.round(totalAllocated * 100) / 100;
        const remainingAmount = Math.max(0, Math.round((projectValue - totalAllocated) * 100) / 100);

        return {
            totalAllocated,
            remainingAmount
        };
    };

    const { totalAllocated, remainingAmount } = calculateRemainingAmount();

    const formattedRemainingAmount = remainingAmount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: Math.floor(remainingAmount) === remainingAmount ? 0 : 2
    });

    // Get the team ID from the project
    const teamId = projectData?.data?.teamId;

    // Fetch teams data
    const { data: teamsData, isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamMembersQuery();
    const teams = teamsData?.data?.items || [];

    // Find the project's assigned team
    const projectTeam = teams.find(team => team.id === teamId);

    // Fetch employees for team members
    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({ limit: 'all' });
    const employees = employeesData?.data?.items || [];

    // Fetch roles data
    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery();
    const roles = rolesData?.data?.items || [];

    // Extract team members from the project's team
    const [teamMembers, setTeamMembers] = useState([]);

    useEffect(() => {
        if (projectTeam && employees.length > 0) {
            let memberIds = [];

            // Parse team members based on format
            if (projectTeam.members) {
                if (typeof projectTeam.members === 'string') {
                    try {
                        memberIds = JSON.parse(projectTeam.members);
                    } catch (e) {
                        memberIds = [];
                    }
                } else if (Array.isArray(projectTeam.members)) {
                    memberIds = projectTeam.members;
                } else if (typeof projectTeam.members === 'object') {
                    memberIds = Object.keys(projectTeam.members);
                }
            }

            // Map member IDs to employee objects
            const members = memberIds.map(memberId => {
                const employee = employees.find(e => e.id === memberId);
                if (employee) {
                    return {
                        id: memberId,
                        name: employee.username || 'Unnamed Employee',
                        role_id: employee.role_id
                    };
                }
                return null;
            }).filter(Boolean);

            setTeamMembers(members);
        } else {
            setTeamMembers([]);
        }
    }, [projectTeam, employees]);

    const [formValues, setFormValues] = useState({
        title: '',
        assigned_to: [],
        project_id: projectId,
        description: '',
        due_date: null,
        payment_type: 'conditional',
        payment_request_stage: 'during_progress',
        payment_trigger_type: '%',
        payment_trigger_value: null,
        reset_due_on_fail: true,
        status: initialValues?.status || 'Pending'
    });

    // State to track payment type for conditional rendering
    const [paymentType, setPaymentType] = useState(initialValues?.payment_type || 'conditional');

    // State to track payment trigger type for conditional rendering
    const [paymentTriggerType, setPaymentTriggerType] = useState(initialValues?.payment_trigger_type || '%');

    // State to track payment request stage
    const [paymentRequestStage, setPaymentRequestStage] = useState(initialValues?.payment_request_stage || 'during_progress');

    // State to track milestone status
    const [milestoneStatus, setMilestoneStatus] = useState(initialValues?.status || 'Pending');

    // State to track calculated amount for percentage
    const [calculatedAmount, setCalculatedAmount] = useState('0.00');

    // Watch payment type changes
    const handlePaymentTypeChange = (value) => {
        setPaymentType(value);

        // If payment type is changed to unconditional, set status to Completed and payment status to Fully Paid
        if (value === 'unconditional') {
            setMilestoneStatus('Completed');
            form.setFieldValue('status', true);
            form.setFieldValue('payment_status', 'Fully Paid');
        }

        // For unconditional payments, we don't force fixed_amount anymore
        // This allows users to select percentage for unconditional payments too
        if (value === 'unconditional') {
            // Keep the current payment_trigger_type if it exists
            const currentTriggerType = form.getFieldValue('payment_trigger_type') || '%';
            setPaymentTriggerType(currentTriggerType);
            form.setFieldValue('payment_trigger_type', currentTriggerType);

            // If it's percentage type, recalculate the amount
            if (currentTriggerType === '%') {
                const percentage = parseFloat(form.getFieldValue('payment_trigger_value')) || 0;
                const amount = (percentage * projectValue / 100);
                const formattedAmount = (amount === Math.floor(amount)) ? amount.toString() : amount.toFixed(2);
                setCalculatedAmount(formattedAmount);
            }
        }
    };

    // Watch payment trigger type changes
    const handlePaymentTriggerTypeChange = (value) => {
        setPaymentTriggerType(value);
    };

    // Watch payment request stage changes
    const handlePaymentRequestStageChange = (value) => {
        setPaymentRequestStage(value);
    };

    // Watch payment trigger value changes
    const handlePaymentTriggerValueChange = (value) => {
        if (paymentTriggerType === '%') {
            const percentage = parseFloat(value) || 0;

            // Validate that the percentage doesn't result in an amount exceeding the remaining amount
            const amount = (percentage * projectValue / 100);

            // Check if the calculated amount exceeds remaining amount
            // Add a small tolerance (0.01) for floating point comparison
            if (amount > (remainingAmount + 0.01) && (!initialValues ||
                (initialValues && initialValues.payment_trigger_type !== '%' ||
                    parseFloat(initialValues.payment_trigger_value) !== percentage))) {
                // Show warning but don't block input
                message.warning(`The calculated amount exceeds the remaining amount (${formattedRemainingAmount})`);
            }

            // Format the amount appropriately
            let formattedAmount;
            if (amount === Math.floor(amount)) {
                // It's a whole number, format without decimals
                formattedAmount = amount.toString();
            } else {
                // It has decimals, format with 2 decimal places
                formattedAmount = amount.toFixed(2);
            }

            setCalculatedAmount(formattedAmount);
        }
    };

    // Watch milestone status changes
    const handleStatusChange = (checked) => {
        setMilestoneStatus(checked ? 'Completed' : 'Pending');

        // Also set payment_status field when status is changed
        if (checked) {
            // If milestone is marked as completed, set payment_status to 'Fully Paid'
            form.setFieldValue('payment_status', 'Fully Paid');
        } else {
            // If milestone is unmarked (not completed), reset payment_status to 'Not Started'
            // but only if the current payment_status is 'Fully Paid'
            const currentPaymentStatus = form.getFieldValue('payment_status');
            if (currentPaymentStatus === 'Fully Paid') {
                form.setFieldValue('payment_status', 'Not Started');
            }
        }
    };

    // Set initial values when component mounts or initialValues change
    useEffect(() => {
        // Set current date as default if creating a new milestone
        if (!initialValues && !form.getFieldValue('due_date')) {
            form.setFieldValue('due_date', dayjs());
        }

        if (initialValues) {
            // Convert assigned_to to array if it's not already
            let assignedTo = initialValues.assigned_to || [];

            if (!Array.isArray(assignedTo)) {
                // If it's a string with comma-separated values
                if (typeof assignedTo === 'string' && assignedTo.includes(',')) {
                    assignedTo = assignedTo.split(',').map(id => id.trim());
                } else if (assignedTo) {
                    // If it's a single value
                    assignedTo = [assignedTo];
                } else {
                    assignedTo = [];
                }
            }

            // Get payment_trigger_type based on conditions, but prioritize the existing value
            let paymentTriggerType = initialValues.payment_trigger_type || '%';

            // Only override if payment type is unconditional and no trigger type is set
            if (initialValues.payment_type === 'unconditional' && !initialValues.payment_trigger_type) {
                paymentTriggerType = 'fixed_amount';
            }

            const processedValues = {
                ...initialValues,
                assigned_to: assignedTo,
                due_date: initialValues.due_date ? dayjs(initialValues.due_date) : null,
                reset_due_on_fail: initialValues.reset_due_on_fail !== undefined ? initialValues.reset_due_on_fail : true,
                payment_trigger_type: paymentTriggerType,
                status: initialValues.status === 'Completed' // Only set to true if explicitly 'Completed'
            };

            setFormValues(processedValues);
            setPaymentType(initialValues.payment_type || 'conditional');
            setPaymentTriggerType(paymentTriggerType);
            setPaymentRequestStage(initialValues.payment_request_stage || 'during_progress');
            setMilestoneStatus(initialValues.status || 'Pending');

            // Calculate amount if payment trigger type is % and we have a trigger value
            // Do this regardless of payment type (conditional or unconditional)
            if (paymentTriggerType === '%' && initialValues.payment_trigger_value) {
                const percentage = parseFloat(initialValues.payment_trigger_value) || 0;
                const amount = (percentage * projectValue / 100);
                const formattedAmount = (amount === Math.floor(amount)) ? amount.toString() : amount.toFixed(2);
                setCalculatedAmount(formattedAmount);
            }

            // Set form values manually
            form.setFieldsValue(processedValues);
        } else if (projectId) {
            // For new milestone, set the project ID and default values
            const defaultValues = {
                ...formValues,
                project_id: projectId,
                // Set default values but don't override payment_trigger_type if already set
                payment_trigger_type: formValues.payment_type === 'unconditional' ?
                    'fixed_amount' : formValues.payment_trigger_type || '%'
            };
            setFormValues(defaultValues);
            form.setFieldsValue(defaultValues);
        }
    }, [initialValues, form, projectId, projectValue]);

    const handleSelectTeam = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setIsSelectTeamModalVisible(true);
    };

    const handleEditTeam = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setIsEditTeamModalVisible(true);
    };

    const handleSelectTeamModalClose = () => {
        setIsSelectTeamModalVisible(false);
    };

    const handleEditTeamModalClose = () => {
        setIsEditTeamModalVisible(false);
    };

    const handleSelectTeamSubmit = async (values) => {
        try {
            const { teamIds } = values;

            if (!teamIds || teamIds.length === 0) {
                message.error('No team selected');
                return;
            }

            const selectedTeamId = teamIds[0];

            await updateProject({
                id: projectId,
                data: { teamId: selectedTeamId }
            }).unwrap();

            message.success('Team assigned successfully');
            setIsSelectTeamModalVisible(false);

            // Refetch project and teams data
            refetchProject();
            refetchTeams();
        } catch (error) {
            message.error(`Failed to assign team: ${error.data?.message || error.message}`);
        }
    };

    const getExistingMemberIds = () => {
        if (!projectTeam || !projectTeam.members) return [];

        if (Array.isArray(projectTeam.members)) {
            return projectTeam.members;
        } else if (typeof projectTeam.members === 'string') {
            try {
                const parsed = JSON.parse(projectTeam.members);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        } else if (typeof projectTeam.members === 'object') {
            return Object.keys(projectTeam.members);
        }

        return [];
    };

    const handleEditTeamSubmit = async (values) => {
        try {
            if (!teamId) {
                message.error('No team assigned to update');
                return;
            }

            await updateTeamMember({
                id: teamId,
                data: {
                    teamName: values.teamName || projectTeam?.teamName,
                    members: values.members || []
                }
            }).unwrap();

            message.success('Team members updated successfully');
            setIsEditTeamModalVisible(false);

            // Refetch project and teams data
            refetchProject();
            refetchTeams();
        } catch (error) {
            message.error(`Failed to update team members: ${error.data?.message || error.message}`);
        }
    };

    const milestoneFields = [
        // Project Value and Remaining Amount Info - show for all payment types
        {
            name: 'project_value_info',
            label: '',
            type: 'custom',
            render: () => (
                <div style={{
                    padding: '12px 16px',
                    background: 'var(--background-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: 'var(--text-primary)'
                }}>
                    <div style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>Project Value</span>
                        <span style={{ color: 'var(--text-primary)' }}>{formattedProjectCost}</span>
                    </div>
                    <div style={{
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '8px'
                    }}>
                        <span>Remaining Amount</span>
                        <span style={{
                            color: remainingAmount > 0 ? 'var(--success-color)' : 'var(--error-color)',
                            fontWeight: 'bold'
                        }}>{formattedRemainingAmount}</span>
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: '#adb5bd',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#ff4d4f',
                            marginRight: '8px'
                        }}></span>
                        Payment amount cannot exceed remaining amount
                    </div>
                </div>
            ),
            span: 24
        },
        {
            name: 'project_id',
            type: 'hidden',
            label: '',
            hidden: true
        },
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            placeholder: 'Enter milestone title',
            rules: [{ required: true, message: 'Please enter milestone title' }],
            span: 24
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter milestone description',
            span: 24
        },
        {
            name: 'due_date',
            label: 'Due Date',
            type: 'date',
            placeholder: 'Select due date',
            rules: [{ required: !initialValues, message: 'Please select due date' }],
            span: 12,
            // Only allow today or future dates
            disabledDate: (current) => {
                // Can't select days before today
                return current && current < dayjs().startOf('day');
            },
            hidden: !!initialValues // Hide in edit mode
        },
        {
            name: 'assigned_to',
            label: 'Assigned To',
            type: 'select',
            mode: 'multiple',
            placeholder: 'Select team members',
            options: teamMembers.map(member => ({
                label: member.name,
                value: member.id,
                role: roles.find(r => r.id === member.role_id)?.name || 'No Role'
            })),
            rules: [{ required: true, message: 'Please select at least one team member' }],
            span: 24,
            loading: isLoadingEmployees || isLoadingRoles
        },
        // Payment Type field
        {
            name: 'payment_type',
            label: 'Payment Type',
            type: 'select',
            placeholder: 'Select payment type',
            options: [
                { label: 'Conditional', value: 'conditional' },
                { label: 'Advance', value: 'unconditional' }
            ],
            rules: [{ required: true, message: 'Please select payment type' }],
            span: 12,
            onChange: handlePaymentTypeChange,
            hidden: !!initialValues // Hide if initialValues exist (edit mode)
        },
        // Payment Request Stage field - only show if payment_type is 'conditional'
        {
            name: 'payment_request_stage',
            label: 'Payment Request Stage',
            type: 'select',
            placeholder: 'Select payment request stage',
            options: [
                { label: 'During Progress', value: 'during_progress' },
                { label: 'On Completion', value: 'on_completion' }
            ],
            rules: [{ required: paymentType === 'conditional', message: 'Please select payment request stage' }],
            span: 12,
            hidden: paymentType !== 'conditional',
            disabled: paymentType === 'unconditional', // Disable if payment type is unconditional
            onChange: handlePaymentRequestStageChange
        },
        // Payment Trigger Type field - show for all payment types
        {
            name: 'payment_trigger_type',
            label: 'Payment Trigger Type',
            type: 'select',
            placeholder: 'Select payment trigger type',
            options: [
                { label: 'Percentage', value: '%' },
                { label: 'Fixed Amount', value: 'fixed_amount' }
            ],
            rules: [{
                required: true,
                message: 'Please select payment trigger type'
            }],
            span: 12,
            hidden: false, // Always show payment trigger type field
            disabled: false, // Enable for all payment types
            onChange: handlePaymentTriggerTypeChange
        },
        // Payment Trigger Value field - show for all cases
        {
            name: 'payment_trigger_value_container',
            type: 'custom',
            render: () => (
                <div>
                    <Form.Item
                        name="payment_trigger_value"
                        label={paymentTriggerType === '%' ? 'Payment Trigger Percentage' : 'Payment Amount (₹)'}
                        rules={[
                            {
                                required: true,
                                message: paymentTriggerType === '%' ? 'Please enter percentage value' : 'Please enter amount value'
                            },
                            {
                                validator: (_, value) => {
                                    const numValue = parseFloat(value) || 0;

                                    // For percentage trigger type, value should not exceed 100%
                                    if (paymentTriggerType === '%' && numValue > 100) {
                                        return Promise.reject('Percentage cannot exceed 100%');
                                    }

                                    // For fixed amount trigger type, value should not exceed remaining amount
                                    if (paymentTriggerType === 'fixed_amount') {
                                        // Skip validation if we're editing the same milestone with the same amount
                                        const skipValidation = initialValues &&
                                            initialValues.payment_trigger_type === 'fixed_amount' &&
                                            parseFloat(initialValues.payment_trigger_value) === numValue;

                                        // Round both values to 2 decimal places to avoid floating point issues
                                        const roundedValue = Math.round(numValue * 100) / 100;
                                        const roundedRemaining = Math.round(remainingAmount * 100) / 100;

                                        // Allow exact matches or values less than remaining amount
                                        if (!skipValidation && roundedValue > roundedRemaining) {
                                            return Promise.reject(`Amount cannot exceed remaining amount (${formattedRemainingAmount})`);
                                        }
                                    }

                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <InputNumber
                            placeholder={paymentTriggerType === '%' ? 'Enter percentage value' : 'Enter amount in Rupees'}
                            style={{ width: '100%' }}
                            onChange={handlePaymentTriggerValueChange}
                            addonAfter={paymentTriggerType === '%' ? <span className="percentage-symbol">%</span> : undefined}
                            addonBefore={paymentTriggerType === 'fixed_amount' ? <span className="rupee-symbol">₹</span> : undefined}
                        />
                    </Form.Item>
                    {paymentTriggerType === 'fixed_amount' ? (
                        <div style={{ color: '#ff7875', marginTop: '4px' }}>
                            Maximum allowed: <strong>{formattedRemainingAmount}</strong>
                        </div>
                    ) : paymentTriggerType === '%' && (
                        <div>
                            {calculatedAmount ? (
                                <div style={{
                                    background: 'var(--background-secondary)',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    marginTop: '8px',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: 'var(--text-primary)',
                                        fontWeight: 'bold'
                                    }}>
                                        <span>{paymentType === 'unconditional' ? 'Advance Amount:' : 'Calculated Amount:'}</span>
                                        <span style={{ color: 'var(--success-color)' }}>₹{calculatedAmount}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)',
                                        marginTop: '4px'
                                    }}>
                                        {parseFloat(form.getFieldValue('payment_trigger_value') || 0)}% of project value
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Enter percentage to see calculated amount
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ),
            span: 12
        },
        // Milestone Status and Reschedule Options in a row
        {
            name: 'options_row',
            type: 'custom',
            render: () => (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px',
                    marginBottom: '20px'
                }}>
                    <div style={{ flex: 1 }}>
                        <Form.Item
                            name="reset_due_on_fail"
                            label="Reschedule Option"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                        </Form.Item>
                    </div>
                    {initialValues && initialValues.payment_type !== 'unconditional' && (  // Only show in edit mode AND payment type is not unconditional
                        <div style={{ flex: 1 }}>
                            <Form.Item
                                name="status"
                                label="Mark as Completed"
                                valuePropName="checked"
                                initialValue={shouldStatusBeChecked} // Checked if already Completed
                            >
                                <Switch
                                    checkedChildren="Completed"
                                    unCheckedChildren="Pending"
                                    onChange={handleStatusChange}
                                    disabled={false}
                                />
                            </Form.Item>
                        </div>
                    )}
                </div>
            ),
            span: 24
        }
    ];

    const handleSubmit = (values) => {
        // Convert assigned_to array to a comma-separated string for API compatibility
        const formattedValues = {
            ...values,
            assigned_to: Array.isArray(values.assigned_to) ? values.assigned_to.join(',') : values.assigned_to,
            // For unconditional payments, always set status to 'Completed'
            // For conditional payments, use the status switch value from the form
            status: (initialValues && initialValues.payment_type === 'unconditional') ||
                values.payment_type === 'unconditional' ? 'Completed' :
                (values.status ? 'Completed' : 'Pending')
        };

        // Set payment_status to 'Fully Paid' if status is 'Completed'
        if (formattedValues.status === 'Completed') {
            formattedValues.payment_status = 'Fully Paid';
        } else if (values.payment_status === 'Fully Paid') {
            // If milestone is not completed but payment_status is 'Fully Paid', reset it to 'Not Started'
            formattedValues.payment_status = 'Not Started';
        }

        // Handle percentage calculations for both conditional and unconditional payments
        if (formattedValues.payment_trigger_type === '%') {
            const percentage = parseFloat(formattedValues.payment_trigger_value) || 0;
            const calculatedAmount = (percentage * projectValue / 100);

            // Store percentage for display purposes
            formattedValues.payment_percentage = percentage.toString();

            // If this is a new milestone or we're editing but changed the percentage
            // Skip this validation if we're editing the same milestone with the same percentage
            const skipValidation = initialValues &&
                initialValues.payment_trigger_type === '%' &&
                parseFloat(initialValues.payment_trigger_value) === percentage;

            if (!skipValidation) {
                // Check if calculated amount exceeds remaining amount
                // Add a small tolerance (0.01) for floating point comparison
                if (calculatedAmount > (remainingAmount + 0.01)) {
                    // Format the calculated amount appropriately
                    let formattedCalcAmount;
                    if (calculatedAmount === Math.floor(calculatedAmount)) {
                        // It's a whole number, format without decimals
                        formattedCalcAmount = calculatedAmount.toLocaleString('en-IN');
                    } else {
                        // It has decimals, format with 2 decimal places
                        formattedCalcAmount = calculatedAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }

                    message.error(`The calculated amount (₹${formattedCalcAmount}) exceeds the remaining amount (${formattedRemainingAmount})`);
                    return;
                }
            }
        } else if (formattedValues.payment_trigger_type === 'fixed_amount') {
            // Validate that payment amount doesn't exceed remaining amount for fixed amount
            const paymentAmount = parseFloat(formattedValues.payment_trigger_value) || 0;

            // Skip validation if we're editing the same milestone with the same amount
            const skipValidation = initialValues &&
                initialValues.payment_trigger_type === 'fixed_amount' &&
                parseFloat(initialValues.payment_trigger_value) === paymentAmount;

            if (!skipValidation) {
                // Add a small tolerance (0.01) for floating point comparison
                if (paymentAmount > (remainingAmount + 0.01)) {
                    // Format the payment amount appropriately
                    let formattedPaymentAmount;
                    if (paymentAmount === Math.floor(paymentAmount)) {
                        // It's a whole number, format without decimals
                        formattedPaymentAmount = paymentAmount.toLocaleString('en-IN');
                    } else {
                        // It has decimals, format with 2 decimal places
                        formattedPaymentAmount = paymentAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }

                    message.error(`Payment amount (₹${formattedPaymentAmount}) cannot exceed the remaining amount (${formattedRemainingAmount})`);
                    return;
                }
            }
        }

        onSubmit(formattedValues);
    };

    const submitButtonText = initialValues ? 'Update Milestone' : 'Add Milestone';

    // Determine if status switch should be checked based on current status only
    const shouldStatusBeChecked = initialValues && initialValues.status === 'Completed';

    return (
        <>
            <AdvancedForm
                initialValues={formValues}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                fields={milestoneFields}
                validationSchema={validationSchema(projectEndDate)}
                submitButtonText={submitButtonText}
                cancelButtonText="Cancel"
                columns={2}
                className="milestone-form"
                form={form}
            />

            {/* Select Team Modal */}
            <Modal
                title={<ModalTitle icon={<TeamOutlined />} title="Add Team" />}
                open={isSelectTeamModalVisible}
                onCancel={handleSelectTeamModalClose}
                footer={null}
                width={600}
                className="team-form-modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <ProjectMemberForm
                    isSubmitting={isUpdatingProject}
                    onSubmit={handleSelectTeamSubmit}
                    onCancel={handleSelectTeamModalClose}
                    users={employees}
                    employees={employees}
                    roles={roles}
                    refetchTeams={refetchTeams}
                />
            </Modal>

            {/* Edit Team Members Modal */}
            <Modal
                title={<ModalTitle icon={<EditOutlined />} title="Edit Team Members" />}
                open={isEditTeamModalVisible}
                onCancel={handleEditTeamModalClose}
                footer={null}
                width={800}
                className="team-edit-modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <TeamMemberForm
                    initialValues={projectTeam ? {
                        teamName: projectTeam.teamName,
                        members: getExistingMemberIds()
                    } : null}
                    isSubmitting={isUpdatingTeam}
                    onSubmit={handleEditTeamSubmit}
                    onCancel={handleEditTeamModalClose}
                />
            </Modal>
        </>
    );
};

export default MilestoneForm;