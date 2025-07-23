import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import AdvancedForm from './AdvancedForm';
import { Form, Select, Input, InputNumber, Row, Col, TimePicker, Button, Modal, message, Badge, Tooltip } from 'antd';
import { TeamOutlined, EditOutlined, ProjectOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateTeamMemberMutation, useUpdateTeamMemberMutation, useUpdateLeadMutation, useGetEmployeesQuery } from '../config/api/apiServices';
import { useSelector } from 'react-redux';
import TeamMemberForm from '../project/module/hrm/teamMember/components/TeamMemberForm';
import LeadMemberForm from '../project/module/crm/lead/overview/members/components/LeadMemberForm';
import { ModalTitle } from './AdvancedForm';

const validationSchema = Yup.object().shape({
    subject: Yup.string().required('Subject is required'),
    type: Yup.string().required('Type is required'),
    members: Yup.array().min(1, 'At least one member is required'),
    description: Yup.string(),
});

const { TextArea } = Input;

const CommonFollowUpForm = ({
    onSubmit,
    onCancel,
    initialValues = null,
    isSubmitting = false,
    entity = null,
    entityType = 'lead',
    employeesData = [],
    rolesData = [],
    projectsData = [],
    teamsData = [],
    refetchTeams = () => { },
    isLoadingTeams = false,
    isLoadingRoles = false,
    isLoadingProjects = false,
    isLoadingEmployees = false,
    updateProject = null
}) => {
    const isEditing = !!initialValues;
    const [memberOptions, setMemberOptions] = useState([]);
    const [selectedType, setSelectedType] = useState(initialValues?.type || 'task');
    const [selectedMeetingType, setSelectedMeetingType] = useState(initialValues?.meeting_type || 'online');
    const [durationUnit, setDurationUnit] = useState('min');
    const [durationValue, setDurationValue] = useState(30);
    const [formInstance, setFormInstance] = useState(null);

    const [teamId, setTeamId] = useState(null);
    const [teamDetails, setTeamDetails] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamModalVisible, setTeamModalVisible] = useState(false);
    const [addNewTeamModalVisible, setAddNewTeamModalVisible] = useState(false);
    const [editTeamModalVisible, setEditTeamModalVisible] = useState(false);
    const [teamLeaderId, setTeamLeaderId] = useState(null);

    const { currentUser } = useSelector(state => state.auth);

    const teams = teamsData?.data?.items || [];
    const employees = employeesData?.data?.items || [];
    const roles = rolesData?.data?.items || [];
    const projects = projectsData?.data?.items || [];

    const [createTeam, { isLoading: isCreatingTeam }] = useCreateTeamMemberMutation();
    const [updateTeam, { isLoading: isUpdatingTeam }] = useUpdateTeamMemberMutation();
    const [updateLead] = useUpdateLeadMutation();

    const getProjectInfo = (employeeId) => {
        let count = 0;
        let projectNames = [];

        if (projects && projects.length > 0) {
            const teamIds = projects
                .filter(project => project.teamId)
                .map(project => project.teamId);

            const uniqueTeamIds = [...new Set(teamIds)];

            uniqueTeamIds.forEach(teamId => {
                const team = teams.find(t => t.id === teamId);
                if (team && team.members) {
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

                    if (memberIds.includes(employeeId)) {
                        const projectsForTeam = projects.filter(p => p.teamId === teamId);
                        count += projectsForTeam.length;

                        projectsForTeam.forEach(project => {
                            if (project.projectTitle) {
                                projectNames.push(project.projectTitle);
                            }
                        });
                    }
                }
            });
        }
        return { count, projectNames };
    };

    useEffect(() => {
        if (entity) {
            const entityTeamId = entity.teamId;
            setTeamId(entityTeamId);
        } else {
            setTeamId(null);
        }
    }, [entity]);

    useEffect(() => {
        if (!teams.length || !teamId) {
            setTeamDetails(null);
            setTeamMembers([]);
            setMemberOptions([]);
            setTeamLeaderId(null);
            return;
        }

        const team = teams.find(t => t.id === teamId);
        if (team) {
            setTeamDetails(team);

            let memberIds = [];
            if (team.members) {
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
            }

            if (team.teamLead) {
                setTeamLeaderId(team.teamLead);
            }

            const membersList = memberIds.map(memberId => {
                const employee = employees.find(e => e.id === memberId);
                if (employee) {
                    return {
                        id: memberId,
                        key: memberId,
                        name: employee.username || 'Unknown Employee'
                    };
                }
                return {
                    id: memberId,
                    key: memberId,
                    name: 'Unknown Employee'
                };
            });

            setTeamMembers(membersList);

            const memberOptionsList = memberIds.map(memberId => {
                const employee = employees.find(e => e.id === memberId);
                if (!employee) return null;

                let roleName = '';
                if (employee.role_id) {
                    const employeeRole = roles.find(r => r.id === employee.role_id);
                    roleName = employeeRole ? employeeRole.role_name : '';
                }

                const employeeName = employee.username || 'Unknown Employee';

                const { count, projectNames } = getProjectInfo(employee.id);

                const label = (
                    <div className="name-container dropdown-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Tooltip title={employeeName}>
                                <span className="name">
                                    {employeeName.length > 20 ? `${employeeName.substring(0, 20)}...` : employeeName}
                                </span>
                            </Tooltip>
                            {roleName && (
                                <span className="role-badge" style={{ marginLeft: '8px' }}>
                                    <Badge status="processing" />
                                    <Tooltip title={roleName}>
                                        <span className="role-text" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {roleName.length > 15 ? `${roleName.substring(0, 15)}...` : roleName}
                                        </span>
                                    </Tooltip>
                                </span>
                            )}
                        </div>
                        <Tooltip title={
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                    {count} project{count !== 1 ? 's' : ''} assigned:
                                </div>
                                {projectNames.length > 0 ? (
                                    <ul style={{ margin: '0', paddingLeft: '15px' }}>
                                        {projectNames.map((name, index) => (
                                            <li key={index} style={{ marginBottom: '2px' }}>{name}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div>No projects assigned</div>
                                )}
                            </div>
                        }>
                            <div
                                className="project-count-badge"
                                style={{
                                    backgroundColor: count > 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                    border: `1px solid ${count > 0 ? 'var(--primary-color)' : 'var(--bg-primary)'}`,
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <ProjectOutlined style={{
                                    color: count > 0 ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                }} />
                                <span style={{
                                    color: count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontSize: '12px'
                                }}>
                                    {count}
                                </span>
                            </div>
                        </Tooltip>
                    </div>
                );

                return {
                    value: employee.id,
                    label: label
                };
            }).filter(Boolean);

            setMemberOptions(memberOptionsList);
        } else {
            setTeamDetails(null);
            setTeamMembers([]);
            setMemberOptions([]);
            setTeamLeaderId(null);
        }
    }, [teamId, teams, employees, roles, projects]);

    useEffect(() => {
        if (initialValues) {
            setSelectedType(initialValues.type || 'task');

            const meta = initialValues.meta || {};
            setSelectedMeetingType(meta.meeting_type || 'online');

            if (meta.call_duration) {
                const durationStr = meta.call_duration.toString();
                if (durationStr.includes('hr')) {
                    setDurationUnit('hr');
                    setDurationValue(parseInt(durationStr.replace(/\s*hr.*$/, '').trim()) || 1);
                } else {
                    setDurationUnit('min');
                    setDurationValue(parseInt(durationStr.replace(/\s*min.*$/, '').trim()) || 30);
                }
            }
        }
    }, [initialValues]);

    // Update form values when duration state changes
    useEffect(() => {
        if (formInstance && selectedType === 'call') {
            formInstance.setFieldsValue({
                call_duration: durationValue,
                call_duration_unit: durationUnit
            });
        }
    }, [durationValue, durationUnit, formInstance, selectedType]);

    useEffect(() => {
        if (formInstance) {
            const currentType = formInstance.getFieldValue('type');
            if (currentType !== selectedType) {
                formInstance.setFieldsValue({ type: selectedType });
            }
        }
    }, [selectedType, formInstance]);

    useEffect(() => {
        if (selectedType === 'call' && isEditing) {
            setTimeout(() => {
                const callNotesField = document.querySelector('.call-notes-field');
                if (callNotesField) {
                    callNotesField.style.display = isEditing ? 'block' : 'none';

                    const textarea = callNotesField.querySelector('textarea');
                    if (textarea) {
                        textarea.style.display = isEditing ? 'block' : 'none';
                        if (isEditing) {
                            textarea.style.borderColor = '#1890ff';
                        }
                    }
                }
            }, 100);
        } else if (selectedType === 'call' && !isEditing) {
            setTimeout(() => {
                const callNotesField = document.querySelector('.call-notes-field');
                if (callNotesField) {
                    callNotesField.style.display = 'none';
                }
            }, 100);
        }
    }, [selectedType, initialValues, isEditing]);

    useEffect(() => {
        if (formInstance) {
            setTimeout(() => {
                formInstance.setFieldsValue({ type: selectedType });
            }, 100);
        }
    }, [formInstance]);

    const safeToMoment = (dateStr) => {
        if (!dateStr) return null;
        try {
            return dayjs(dateStr);
        } catch (e) {
            return null;
        }
    };

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                subject: '',
                type: selectedType,
                members: [],
                description: '',
                status: 'pending',
                priority: 'medium',
                date: null,
                task_due_date: null,
                task_reporter: '',
                meeting_type: 'online',
                meeting_from_date: null,
                meeting_from_time: '',
                meeting_to_time: '',
                meeting_link: '',
                location: '',
                call_date: null,
                call_type: 'logged',
                call_duration: 30,
                call_duration_unit: 'min',
                call_purpose: '',
                call_notes: '',
                reminder: false,
            };
        }

        let processedMembers = [];
        if (initialValues.members) {
            if (Array.isArray(initialValues.members)) {
                processedMembers = initialValues.members;
            } else if (typeof initialValues.members === 'string') {
                try {
                    const parsed = JSON.parse(initialValues.members);
                    processedMembers = Array.isArray(parsed) ? parsed : [initialValues.members];
                } catch (e) {
                    processedMembers = [initialValues.members];
                }
            }
        }

        const dateValue = safeToMoment(initialValues.date);
        const meta = initialValues.meta || {};

        let durationVal = 30;
        let durationUnitVal = 'min';

        if (meta.call_duration) {
            const durationStr = meta.call_duration.toString();
            if (durationStr.includes('hr')) {
                durationUnitVal = 'hr';
                durationVal = parseInt(durationStr.replace(/\s*hr.*$/, '').trim()) || 1;
            } else {
                durationUnitVal = 'min';
                durationVal = parseInt(durationStr.replace(/\s*min.*$/, '').trim()) || 30;
            }
        }

        let fromTime = null;
        let toTime = null;

        if (meta.meeting_from_time) {
            try {
                fromTime = typeof meta.meeting_from_time === 'string'
                    ? dayjs(meta.meeting_from_time, 'HH:mm:ss')
                    : dayjs(meta.meeting_from_time);
            } catch (e) {
                fromTime = null;
            }
        }

        if (meta.meeting_to_time) {
            try {
                toTime = typeof meta.meeting_to_time === 'string'
                    ? dayjs(meta.meeting_to_time, 'HH:mm:ss')
                    : dayjs(meta.meeting_to_time);
            } catch (e) {
                toTime = null;
            }
        }

        const result = {
            ...initialValues,
            members: processedMembers,
            date: dateValue,
            task_due_date: initialValues.type === 'task' ? dateValue : null,
            meeting_from_date: initialValues.type === 'meeting' ? dateValue : null,
            call_date: initialValues.type === 'call' ? dateValue : null,

            task_reporter: meta.task_reporter || '',
            meeting_type: meta.meeting_type || 'online',
            meeting_from_time: fromTime,
            meeting_to_time: toTime,
            meeting_link: meta.meeting_link || '',
            location: meta.location || '',
            call_type: meta.call_type || 'logged',
            call_notes: initialValues.type === 'call' ? (meta.call_notes || '') : '',
            call_duration: durationVal,
            call_duration_unit: durationUnitVal,
            call_purpose: meta.call_purpose || '',

            reminder: initialValues.reminder ? true : false
        };

        return result;
    };

    const typeOptions = [
        { value: 'task', label: 'Task' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'call', label: 'Call' }
    ];

    const meetingTypeOptions = [
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' }
    ];

    const callTypeOptions = [
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'logged', label: 'Logged' }
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
    ];

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const durationUnitOptions = [
        { value: 'min', label: 'Minutes' },
        { value: 'hr', label: 'Hours' }
    ];

    const handleTypeChange = (value) => {
        if (value === selectedType) return;

        setSelectedType(value);

        if (formInstance) {
            const fieldsToReset = {
                type: value
            };

            if (value === 'task') {
                fieldsToReset.meeting_type = undefined;
                fieldsToReset.meeting_from_date = undefined;
                fieldsToReset.meeting_from_time = undefined;
                fieldsToReset.meeting_to_time = undefined;
                fieldsToReset.meeting_link = undefined;
                fieldsToReset.location = undefined;
                fieldsToReset.call_date = undefined;
                fieldsToReset.call_type = undefined;
                fieldsToReset.call_purpose = undefined;
                fieldsToReset.call_notes = undefined;
            } else if (value === 'meeting') {
                fieldsToReset.task_due_date = undefined;
                fieldsToReset.task_reporter = undefined;
                fieldsToReset.call_date = undefined;
                fieldsToReset.call_type = undefined;
                fieldsToReset.call_purpose = undefined;
                fieldsToReset.call_notes = undefined;
            } else if (value === 'call') {
                fieldsToReset.task_due_date = undefined;
                fieldsToReset.task_reporter = undefined;
                fieldsToReset.meeting_type = undefined;
                fieldsToReset.meeting_from_date = undefined;
                fieldsToReset.meeting_from_time = undefined;
                fieldsToReset.meeting_to_time = undefined;
                fieldsToReset.meeting_link = undefined;
                fieldsToReset.location = undefined;
            }

            setTimeout(() => {
                formInstance.setFieldsValue(fieldsToReset);
            }, 0);
        }
    };

    const handleMeetingTypeChange = (value) => {
        setSelectedMeetingType(value);
    };

    const handleDurationUnitChange = (value) => {
        setDurationUnit(value);
    };

    const handleCallTypeChange = (value) => {
        if (value === 'scheduled' && formInstance) {
            formInstance.setFieldsValue({
                call_duration: undefined,
                call_duration_unit: undefined
            });
        }
    };

    const commonFields = [
        {
            name: 'type',
            label: 'Follow-up Type',
            type: 'select',
            placeholder: 'Select follow-up type',
            rules: [{ required: true, message: 'Please select a type' }],
            options: typeOptions,
            disabled: isEditing,
            onChange: (value) => {
                handleTypeChange(value);
            },
            span: isEditing ? 8 : 24,
            shouldUpdate: true
        }
    ];

    if (isEditing) {
        commonFields.push(
            {
                name: 'status',
                label: 'Status',
                type: 'custom',
                placeholder: 'Select status',
                span: 8,
                render: (form) => (
                    <Form.Item name="status" noStyle>
                        <Select
                            placeholder="Select status"
                            style={{ width: '100%' }}
                            options={statusOptions.map(option => ({
                                value: option.value,
                                label: (
                                    <span style={{ color: option.color, fontWeight: 500 }}>
                                        {option.label}
                                    </span>
                                )
                            }))}
                        />
                    </Form.Item>
                )
            },
            {
                name: 'priority',
                label: 'Priority',
                type: 'custom',
                placeholder: 'Select priority',
                span: 8,
                render: (form) => (
                    <Form.Item name="priority" noStyle>
                        <Select
                            placeholder="Select priority"
                            style={{ width: '100%' }}
                            options={priorityOptions.map(option => ({
                                value: option.value,
                                label: (
                                    <span style={{ color: option.color, fontWeight: 500 }}>
                                        {option.label}
                                    </span>
                                )
                            }))}
                        />
                    </Form.Item>
                )
            }
        );
    }

    commonFields.push({
        name: 'subject',
        label: `${selectedType === 'task' ? 'Task' : selectedType === 'meeting' ? 'Meeting' : 'Call'} Subject`,
        type: 'text',
        placeholder: `Enter ${selectedType} subject`,
        rules: [{ required: true, message: 'Please enter a subject' }],
        span: 24
    });

    const taskFields = [
        {
            name: 'task_due_date',
            label: 'Due Date',
            type: 'date',
            placeholder: 'Select due date',
            rules: [{ required: true, message: 'Please select a due date' }],
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'task',
            span: 12,
            format: 'DD/MM/YYYY',
            style: { width: '100%' }
        }
    ];

    const meetingFields = [
        {
            name: 'meeting_type',
            label: 'Meeting Type',
            type: 'select',
            placeholder: 'Select meeting type',
            rules: [{ required: true, message: 'Please select a meeting type' }],
            options: meetingTypeOptions,
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'meeting',
            onChange: handleMeetingTypeChange,
            span: 12
        },
        {
            name: 'meeting_from_date',
            label: 'Meeting Date',
            type: 'date',
            placeholder: 'Select meeting date',
            rules: [{ required: true, message: 'Please select a meeting date' }],
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'meeting',
            span: 12,
            format: 'DD/MM/YYYY',
            style: { width: '100%' }
        },
        {
            name: 'meeting_from_time',
            label: 'Start Time',
            type: 'custom',
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'meeting',
            span: 12,
            rules: [{ required: true, message: 'Please select start time' }],
            render: (form) => (
                <Form.Item name="meeting_from_time" noStyle>
                    <TimePicker
                        format="hh:mm A"
                        use12Hours
                        placeholder="Select start time"
                        style={{ width: '100%' }}
                    />
                </Form.Item>
            )
        },
        {
            name: 'meeting_to_time',
            label: 'End Time',
            type: 'custom',
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'meeting',
            span: 12,
            rules: isEditing ? [{ required: true, message: 'Please select end time' }] : [],
            render: (form) => (
                <Form.Item name="meeting_to_time" noStyle>
                    <TimePicker
                        format="hh:mm A"
                        use12Hours
                        placeholder="Select end time"
                        style={{ width: '100%' }}
                    />
                </Form.Item>
            )
        },
        {
            name: 'meeting_link',
            label: 'Meeting Link',
            type: 'text',
            placeholder: 'Enter meeting link',
            dependencies: ['type', 'meeting_type'],
            showWhen: (getFieldValue) =>
                getFieldValue('type') === 'meeting' && getFieldValue('meeting_type') === 'online',
            rules: [{
                required: true,
                message: 'Please enter a meeting link',
                dependencies: ['meeting_type']
            }, {
                type: 'url',
                message: 'Please enter a valid URL'
            }],
            span: 24
        },
        {
            name: 'location',
            label: 'Location',
            type: 'text',
            placeholder: 'Enter meeting location',
            dependencies: ['type', 'meeting_type'],
            showWhen: (getFieldValue) =>
                getFieldValue('type') === 'meeting' && getFieldValue('meeting_type') === 'offline',
            rules: [{
                required: true,
                message: 'Please enter a location',
                dependencies: ['meeting_type']
            }],
            span: 24
        }
    ];

    const callFields = [
        {
            name: 'call_date',
            label: 'Call Date',
            type: 'date',
            placeholder: 'Select call date',
            rules: [{ required: true, message: 'Please select a call date' }],
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'call',
            span: 12,
            format: 'DD/MM/YYYY',
            style: { width: '100%' }
        },
        {
            name: 'call_type',
            label: 'Call Type',
            type: 'select',
            placeholder: 'Select call type',
            rules: [{ required: true, message: 'Please select a call type' }],
            options: callTypeOptions,
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'call',
            onChange: handleCallTypeChange,
            span: 12
        },
        {
            name: 'call_duration',
            label: 'Duration',
            type: 'custom',
            dependencies: ['type', 'call_type'],
            showWhen: (getFieldValue) =>
                getFieldValue('type') === 'call' &&
                getFieldValue('call_type') === 'logged',
            span: 12,
            render: (form) => {
                return (
                    <Form.Item
                        label="Duration"
                        required
                        style={{ marginBottom: 0 }}
                    >
                        <Row gutter={8}>
                            <Col span={14}>
                                <InputNumber
                                    min={1}
                                    placeholder="Duration"
                                    style={{ width: '100%' }}
                                    value={durationValue}
                                    onChange={(value) => {
                                        const numValue = parseInt(value) || 1;
                                        setDurationValue(numValue);
                                        form.setFieldsValue({ call_duration: numValue });
                                    }}
                                    controls={true}
                                />
                            </Col>
                            <Col span={10}>
                                <Select
                                    value={durationUnit}
                                    options={durationUnitOptions}
                                    onChange={(value) => {
                                        setDurationUnit(value);
                                        form.setFieldsValue({ call_duration_unit: value });
                                    }}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                        </Row>

                        {/* Hidden form fields to store the actual values */}
                        <Form.Item name="call_duration" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                        <Form.Item name="call_duration_unit" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                    </Form.Item>
                );
            }
        },
        {
            name: 'call_purpose',
            label: 'Call Purpose',
            type: 'text',
            placeholder: 'Enter call purpose',
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'call',
            span: 12
        },
        {
            name: 'call_notes',
            label: 'Call Notes',
            type: 'textarea',
            placeholder: 'Enter call notes',
            dependencies: ['type'],
            showWhen: (getFieldValue) => getFieldValue('type') === 'call' && isEditing,
            span: 24,
            rows: 6,
            style: { marginTop: '10px', display: isEditing ? 'block' : 'none' },
            className: 'call-notes-field',
            initialValue: '',
            shouldUpdate: (prevValues, currentValues) => {
                return (prevValues.type !== currentValues.type && isEditing) ||
                    (currentValues.type === 'call' && isEditing);
            }
        }
    ];

    const handleTeamAction = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setTeamModalVisible(true);
    };

    const handleAddNewTeam = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setAddNewTeamModalVisible(true);
    };

    const handleTeamSubmit = async (values) => {
        try {
            const { teamIds } = values;

            if (!teamIds || teamIds.length === 0) {
                message.error('No team selected');
                return;
            }

            const selectedTeamId = teamIds[0];
            const selectedTeam = teams.find(t => t.id === selectedTeamId);

            if (selectedTeam && selectedTeam.teamLead) {
                setTeamLeaderId(selectedTeam.teamLead);
            }

            // Update the entity (lead or project) with the selected team
            if (entityType === 'lead' && entity?.id) {
                await updateLead({
                    id: entity.id,
                    data: { teamId: selectedTeamId }
                }).unwrap();
                message.success('Team assigned to lead successfully');
            } else if (entityType === 'project' && entity?.id && updateProject) {
                await updateProject({
                    id: entity.id,
                    data: { teamId: selectedTeamId }
                }).unwrap();
                message.success('Team assigned to project successfully');
            }

            setTeamId(selectedTeamId);
            setTeamModalVisible(false);

            if (formInstance) {
                formInstance.setFieldsValue({ members: [] });
            }

            refetchTeams();
        } catch (error) {
            message.error(`Failed to add team: ${error.data?.message || error.message}`);
        }
    };

    const handleEditTeamMembers = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setEditTeamModalVisible(true);
    };

    const handleTeamCancel = () => {
        setTeamModalVisible(false);
    };

    const handleAddNewTeamCancel = () => {
        setAddNewTeamModalVisible(false);
    };

    const handleEditTeamMembersCancel = () => {
        setEditTeamModalVisible(false);
    };

    const handleEditTeamMembersSubmit = async (values) => {
        try {
            if (!teamDetails) {
                message.error('No team selected');
                return;
            }

            await updateTeam({
                id: teamId,
                data: {
                    teamName: teamDetails.teamName,
                    members: values.members || []
                }
            }).unwrap();

            message.success('Team members updated successfully');
            setEditTeamModalVisible(false);

            refetchTeams();
        } catch (error) {
            message.error(`Failed to update team members: ${error.data?.message || error.message}`);
        }
    };

    const getExistingMemberIds = () => {
        if (!teamDetails || !teamDetails.members) return [];

        if (Array.isArray(teamDetails.members)) {
            return teamDetails.members;
        } else if (typeof teamDetails.members === 'string') {
            try {
                const parsed = JSON.parse(teamDetails.members);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        } else if (typeof teamDetails.members === 'object') {
            return Object.keys(teamDetails.members);
        }

        return [];
    };

    const bottomFields = [
        {
            name: 'members',
            label: 'Members',
            type: 'custom',
            rules: [{ required: true, message: 'Please select at least one member' }],
            span: 24,
            render: (form) => {
                if (isEditing) {
                    return (
                        <Form.Item>
                            <Form.Item
                                name="members"
                                noStyle
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Select members from team"
                                    options={memberOptions}
                                    style={{ width: '100%' }}
                                    loading={isLoadingTeams || isLoadingEmployees}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <div style={{ padding: '8px' }}>
                                                <Button
                                                    type="primary"
                                                    icon={<EditOutlined />}
                                                    onClick={handleEditTeamMembers}
                                                    style={{ width: '100%' }}
                                                >
                                                    Update Team Members
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                />
                            </Form.Item>
                        </Form.Item>
                    );
                }

                // Check if entity already has a team assigned
                const hasPreassignedTeam = entity && entity.teamId;

                return (
                    <Form.Item>
                        <div className="custom-select">
                            <Select
                                style={{ width: '100%', marginBottom: '8px' }}
                                placeholder={hasPreassignedTeam ? "Team already assigned" : "Select a team"}
                                value={teamId}
                                options={teams.map(team => ({
                                    label: team.teamName,
                                    value: team.id
                                }))}
                                onChange={(value) => {
                                    if (value) {
                                        handleTeamSubmit({ teamIds: [value] });
                                    }
                                }}
                                loading={isLoadingTeams}
                                disabled={hasPreassignedTeam}
                                dropdownRender={(menu) => (
                                    <div>
                                        {menu}
                                        <div style={{ padding: '8px' }}>
                                            <Button
                                                type="primary"
                                                style={{ width: '100%', height: '38px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddNewTeam();
                                                }}
                                                disabled={hasPreassignedTeam}
                                            >
                                                Create New Team
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        <Form.Item
                            name="members"
                            noStyle
                        >
                            <Select
                                mode="multiple"
                                placeholder="Select members from team"
                                options={memberOptions}
                                style={{ width: '100%' }}
                                loading={isLoadingTeams || isLoadingEmployees}
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        {teamId && (
                                            <div style={{ padding: '8px' }}>
                                                <Button
                                                    type="primary"
                                                    icon={<EditOutlined />}
                                                    onClick={handleEditTeamMembers}
                                                    style={{ width: '100%' }}
                                                >
                                                    Update Team Members
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            />
                        </Form.Item>
                    </Form.Item>
                );
            }
        },
        {
            name: 'description',
            label: 'Description',
            type: 'custom',
            component: <TextArea rows={4} placeholder="Enter description" />,
            placeholder: 'Enter description',
            span: 24
        },
        {
            name: 'reminder',
            label: 'Set Reminder (1 day before)',
            type: 'checkbox',
            span: 24,
            style: { marginTop: '10px' }
        }
    ];

    const getFields = () => {
        const allFields = [...commonFields];

        if (selectedType === 'task') {
            allFields.push(...taskFields);
        } else if (selectedType === 'meeting') {
            allFields.push(...meetingFields);
        } else if (selectedType === 'call') {
            if (isEditing) {
                const callFieldsWithNotes = [...callFields];
                allFields.push(...callFieldsWithNotes);
            } else {
                const callFieldsWithoutNotes = callFields.filter(field => field.name !== 'call_notes');
                allFields.push(...callFieldsWithoutNotes);
            }
        }

        allFields.push(...bottomFields);

        return allFields;
    };

    const handleFormSubmit = async (values) => {
        const formatDate = (dateValue) => {
            if (!dateValue) return null;

            if (typeof dateValue === 'string') {
                return dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
            }

            if (dayjs.isDayjs(dateValue)) {
                return dateValue.format('YYYY-MM-DD');
            }

            return dayjs(dateValue).format('YYYY-MM-DD');
        };

        let dateValue = null;
        if (values.type === 'task' && values.task_due_date) {
            dateValue = values.task_due_date;
        } else if (values.type === 'meeting' && values.meeting_from_date) {
            dateValue = values.meeting_from_date;
        } else if (values.type === 'call' && values.call_date) {
            dateValue = values.call_date;
        }

        const processedValues = {
            type: values.type,
            subject: values.subject,
            members: values.members,
            description: values.description,
            status: values.status || 'pending',
            priority: values.priority || 'medium',
            date: formatDate(dateValue),
            reminder: values.reminder ? {
                enabled: true,
                date: dayjs().add(1, 'day').format('YYYY-MM-DD')
            } : null,
            meta: {}
        };

        if (values.type === 'task') {
            // Use team leader as reporter
            processedValues.meta.task_reporter = teamLeaderId;
        }
        else if (values.type === 'meeting') {
            processedValues.meta.meeting_type = values.meeting_type;

            // Format time values from TimePicker
            const fromTime = values.meeting_from_time;
            const toTime = values.meeting_to_time;

            processedValues.meta.meeting_from_time = values.meeting_from_time ?
                (dayjs.isDayjs(values.meeting_from_time) ? values.meeting_from_time.format('HH:mm:ss') : `${values.meeting_from_time}:00`) : '00:00:00';

            processedValues.meta.meeting_to_time = values.meeting_to_time ?
                (dayjs.isDayjs(values.meeting_to_time) ? values.meeting_to_time.format('HH:mm:ss') : `${values.meeting_to_time}:00`) : '00:00:00';

            if (values.meeting_type === 'online') {
                processedValues.meta.meeting_link = values.meeting_link;
            } else if (values.meeting_type === 'offline') {
                processedValues.meta.location = values.location;
            }
        }
        else if (values.type === 'call') {
            processedValues.meta.call_type = values.call_type;

            if (values.call_type === 'logged') {
                const durationUnit = values.call_duration_unit || 'min';
                const durationValue = values.call_duration || 0;
                processedValues.meta.call_duration = `${durationValue} ${durationUnit}`;
                delete processedValues.call_duration_unit;
            }

            processedValues.meta.call_purpose = values.call_purpose || '';

            if (isEditing) {
                processedValues.meta.call_notes = values.call_notes || '';
            }
        }

        // Add section and related_id from entity
        if (entity) {
            processedValues.section = entityType;
            processedValues.related_id = entity.id;
        }

        onSubmit(processedValues);
    };

    return (
        <>
            <AdvancedForm
                key={`followup-form-${selectedType}`}
                initialValues={prepareInitialValues()}
                isSubmitting={isSubmitting}
                onSubmit={handleFormSubmit}
                onCancel={onCancel}
                fields={getFields()}
                validationSchema={validationSchema}
                submitButtonText={initialValues ? 'Update Follow-up' : 'Add Follow-up'}
                cancelButtonText="Cancel"
                columns={1}
                className="followup-form"
                layout="vertical"
                resetOnSubmit={false}
                formRef={setFormInstance}
                formStyles={`
                    .call-notes-field .ant-form-item-control-input-content textarea {
                        border: 1px solid #d9d9d9;
                        border-radius: 6px;
                        padding: 10px;
                        transition: all 0.3s;
                    }
                    
                    .call-notes-field .ant-form-item-control-input-content textarea:focus {
                        border-color: #1890ff;
                        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                    }
                    
                    .call-notes-field .ant-form-item-label > label {
                        font-weight: 600;
                        font-size: 15px;
                        color: #4a4a4a;
                    }

                    .ant-select-item-option-content .name-container {
                        padding: 4px 0;
                    }
                    
                    .ant-select-item-option-content .name {
                        font-weight: 500;
                    }
                    
                    .ant-select-item-option-content .role-badge {
                        display: inline-flex;
                        align-items: center;
                        margin-left: 8px;
                        padding: 0 6px;
                    }
                    
                    .ant-select-item-option-content .role-text {
                        margin-left: 4px;
                        font-size: 12px;
                        color: var(--text-secondary);
                    }
                    
                    .ant-select-item-option-content .project-count-badge {
                        display: flex;
                        align-items: center;
                        padding: 2px 6px;
                        border-radius: 10px;
                        gap: 4px;
                    }
                    
                    .ant-select-selection-item .name-container {
                        max-width: 100%;
                        overflow: hidden;
                    }
                `}
            />

            {/* Team Selection Modal */}
            <Modal
                title={<ModalTitle icon={<TeamOutlined />} title="Select Team" />}
                open={teamModalVisible}
                onCancel={handleTeamCancel}
                footer={null}
                width={600}
                className="team-form-modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <LeadMemberForm
                    isSubmitting={isSubmitting}
                    onSubmit={handleTeamSubmit}
                    onCancel={handleTeamCancel}
                    teams={teams}
                    isUpdateMode={!!teamId}
                    initialTeamIds={teamId ? [teamId] : []}
                    refetchTeams={refetchTeams}
                />
            </Modal>

            {/* Add New Team Modal */}
            <Modal
                title={<ModalTitle icon={<TeamOutlined />} title="Add New Team" />}
                open={addNewTeamModalVisible}
                onCancel={handleAddNewTeamCancel}
                footer={null}
                width={600}
                className="add-team-modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <TeamMemberForm
                    initialValues={null}
                    isSubmitting={isCreatingTeam}
                    onSubmit={async (values) => {
                        try {
                            const response = await createTeam(values).unwrap();
                            message.success('Team created successfully');
                            setAddNewTeamModalVisible(false);

                            // Set the newly created team as the selected team
                            if (response && response.data && response.data.id) {
                                await handleTeamSubmit({ teamIds: [response.data.id] });
                            }

                            refetchTeams();
                        } catch (error) {
                            message.error(`Failed to create team: ${error.data?.message || error.message}`);
                        }
                    }}
                    onCancel={handleAddNewTeamCancel}
                />
            </Modal>

            {/* Edit Team Members Modal */}
            <Modal
                title={<ModalTitle icon={<EditOutlined />} title="Edit Team Members" />}
                open={editTeamModalVisible}
                onCancel={handleEditTeamMembersCancel}
                footer={null}
                width={800}
                className="team-edit-modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <TeamMemberForm
                    initialValues={teamDetails ? {
                        teamName: teamDetails.teamName,
                        members: getExistingMemberIds()
                    } : null}
                    isSubmitting={isUpdatingTeam}
                    onSubmit={handleEditTeamMembersSubmit}
                    onCancel={handleEditTeamMembersCancel}
                />
            </Modal>
        </>
    );
};

export default CommonFollowUpForm;