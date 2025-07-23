import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useGetFiltersQuery, useCreateFilterMutation, useDeleteFilterMutation, useGetClientsQuery, useCreateClientMutation, useDeleteClientMutation, useCreatePipelineMutation, useGetPipelinesQuery, useDeletePipelineMutation, useGetTeamMembersQuery, useCreateTeamMemberMutation, useCreateStageMutation, useGetStagesQuery, useGetContactsQuery, useUpdateContactMutation } from '../../../../../config/api/apiServices';
import AdvancedForm, { ModalTitle } from '../../../../../components/AdvancedForm';
import { Button, Space, Modal, Form, Input, message, Select, Tooltip, DatePicker } from 'antd';
import FilterForm from '../../system/filter/components/FilterForm';
import ClientForm from '../../../crm/client/components/ClientForm';
import PipelineForm from '../../system/pipeline/components/PipelineForm';
import { FilterOutlined, UserOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import TeamMemberForm from '../../../hrm/teamMember/components/TeamMemberForm';
import StageForm from '../../system/stages/components/StageForm';
import dayjs from 'dayjs';

const { Option } = Select;

const validationSchema = Yup.object().shape({
    projectTitle: Yup.string()
        .required('Project title is required')
        .max(50, 'Project title cannot exceed 50 characters'),
    projectValue: Yup.number().required('Project value is required').min(0, 'Project value must be positive'),
    pipeline: Yup.string().required('Pipeline is required'),
    source: Yup.string(),
    category: Yup.string(),
    client: Yup.string().required('Client is required'),
    stage: Yup.string(),
    startDate: Yup.date().nullable(),
    endDate: Yup.date().nullable()
        .test('is-after-start-date', 'End date must be after start date', function (value) {
            const { startDate } = this.parent;
            if (!startDate || !value) return true;
            return new Date(value) >= new Date(startDate);
        }),
    priority: Yup.string().oneOf(['low', 'medium', 'high']).default('medium'),
    teamId: Yup.string().nullable()
});

const ProjectForm = ({ initialValues, isSubmitting, onSubmit, onCancel, pipelines = [], stages = [], hideClientField = false, clientId = null }) => {
    const [form] = Form.useForm();
    const [selectedPipeline, setSelectedPipeline] = useState(initialValues?.pipeline || null);
    const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isClientModalVisible, setIsClientModalVisible] = useState(false);
    const [isPipelineModalVisible, setIsPipelineModalVisible] = useState(false);
    const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
    const [isStageModalVisible, setIsStageModalVisible] = useState(false);
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [pipelineFormKey, setPipelineFormKey] = useState(Date.now());
    const [sourceFormKey, setSourceFormKey] = useState(Date.now());
    const [categoryFormKey, setCategoryFormKey] = useState(Date.now());
    const [teamFormKey, setTeamFormKey] = useState(Date.now());
    const [statusFormKey, setStatusFormKey] = useState(Date.now());
    const [selectedStatus, setSelectedStatus] = useState(initialValues?.status || null);
    const [selectedClient, setSelectedClient] = useState(initialValues?.client || null);
    const [isClientContact, setIsClientContact] = useState(false);

    const isEditing = !!initialValues && !!initialValues.id && !initialValues._isNewProject;

    const [deletePipelineModalVisible, setDeletePipelineModalVisible] = useState(false);
    const [pipelineToDeleteId, setPipelineToDeleteId] = useState(null);
    const [pipelineToDeleteName, setPipelineToDeleteName] = useState(null);

    const [deleteSourceModalVisible, setDeleteSourceModalVisible] = useState(false);
    const [sourceToDeleteId, setSourceToDeleteId] = useState(null);
    const [sourceToDeleteName, setSourceToDeleteName] = useState(null);

    const [deleteCategoryModalVisible, setDeleteCategoryModalVisible] = useState(false);
    const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);
    const [categoryToDeleteName, setCategoryToDeleteName] = useState(null);

    const [deleteClientModalVisible, setDeleteClientModalVisible] = useState(false);
    const [clientToDeleteId, setClientToDeleteId] = useState(null);
    const [clientToDeleteName, setClientToDeleteName] = useState(null);

    const [deleteStatusModalVisible, setDeleteStatusModalVisible] = useState(false);
    const [statusToDeleteId, setStatusToDeleteId] = useState(null);
    const [statusToDeleteName, setStatusToDeleteName] = useState(null);

    const { data: filtersResponse, refetch: refetchFilters } = useGetFiltersQuery({ limit: 'all' });
    const { data: clientsResponse, refetch: refetchClients } = useGetClientsQuery({ limit: 'all' });
    const { data: contactsResponse, refetch: refetchContacts } = useGetContactsQuery({ limit: 'all', isClient: false });
    const { data: pipelinesResponse, refetch: refetchPipelines } = useGetPipelinesQuery({ limit: 'all' });
    const { data: teamMembersResponse, isLoading: isLoadingTeamMembers, refetch: refetchTeamMembers } = useGetTeamMembersQuery({ limit: 'all' });
    const [createFilter] = useCreateFilterMutation();
    const [createClient] = useCreateClientMutation();
    const [deleteClient] = useDeleteClientMutation();
    const [createPipeline] = useCreatePipelineMutation();
    const [createStage] = useCreateStageMutation();
    const [createTeamMember, { isLoading: isCreatingTeam }] = useCreateTeamMemberMutation();
    const [deletePipeline] = useDeletePipelineMutation();
    const [deleteSource] = useDeleteFilterMutation();
    const [deleteCategory] = useDeleteFilterMutation();
    const [deleteStatus] = useDeleteFilterMutation();
    const [updateContact] = useUpdateContactMutation();
    const filters = filtersResponse?.data?.items || [];
    const clients = clientsResponse?.data?.items || [];
    const contacts = contactsResponse?.data?.items || [];
    const currentPipelines = pipelinesResponse?.data?.items || pipelines;
    const sources = filters.filter(filter => filter.type === 'source');
    const categories = filters.filter(filter => filter.type === 'category');
    const statuses = filters.filter(filter => filter.type === 'status');
    const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [pipelineDropdownOpen, setPipelineDropdownOpen] = useState(false);
    const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

    const projectStages = stages.filter(stage =>
        stage.type === 'project' && (!selectedPipeline || stage.pipeline === selectedPipeline)
    );

    useEffect(() => {
        if (initialValues?.pipeline) {
            setSelectedPipeline(initialValues.pipeline);
        }

        if (initialValues?.teamId) {
            form.setFieldValue('teamId', initialValues.teamId);
        }

        if (initialValues?.startDate) {
            form.setFieldValue('startDate', dayjs(initialValues.startDate));
        }

        if (initialValues?.endDate) {
            form.setFieldValue('endDate', dayjs(initialValues.endDate));
        }

        if (initialValues?.priority) {
            form.setFieldValue('priority', initialValues.priority);
        } else if (!isEditing) {
            // Set default priority for new projects
            form.setFieldValue('priority', 'medium');
        }

        // If a contact is selected from a lead, check and mark it for conversion
        if (initialValues?.client) {
            form.setFieldValue('client', initialValues.client);

            // Check if this client is actually a contact that needs to be converted
            const selectedContact = contacts.find(contact => contact.id === initialValues.client);
            if (selectedContact && !selectedContact.isClient) {
                setIsClientContact(true);
            }
        }

        if (initialValues?.stage && stages && stages.length > 0) {
            const stageId = initialValues.stage;
            const stage = stages.find(s => s.id === stageId);

            if (stage) {
                form.setFieldValue('stage', stageId);
            } else {
                // Stage not found
            }
        }
    }, [initialValues, form, stages, contacts]);

    const handleAddSource = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setSourceDropdownOpen(false);
        setIsSourceModalVisible(true);
        setSourceFormKey(Date.now());
    };

    const handleSourceSubmit = async (values) => {
        try {
            const result = await createFilter({
                name: values.name,
                type: 'source'
            }).unwrap();

            message.success('Source added successfully');

            await refetchFilters();

            if (result?.id) {
                form.setFieldValue('source', result.id);
            } else if (result?.data?.id) {
                form.setFieldValue('source', result.data.id);
            }

            setIsSourceModalVisible(false);
            setSourceFormKey(Date.now());
        } catch (error) {
            message.error('Failed to add source');
        }
    };

    const handleAddCategory = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setCategoryDropdownOpen(false);
        setIsCategoryModalVisible(true);
        setCategoryFormKey(Date.now());
    };

    const handleCategorySubmit = async (values) => {
        try {
            const result = await createFilter({
                name: values.name,
                type: 'category'
            }).unwrap();

            message.success('Category added successfully');

            await refetchFilters();

            if (result?.id) {
                form.setFieldValue('category', result.id);
            } else if (result?.data?.id) {
                form.setFieldValue('category', result.data.id);
            }

            setIsCategoryModalVisible(false);
            setCategoryFormKey(Date.now());
        } catch (error) {
            message.error('Failed to add category');
        }
    };

    const handleAddClient = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setClientDropdownOpen(false);
        setIsClientModalVisible(true);
    };

    const handleClientChange = async (value) => {
        form.setFieldsValue({ client: value });
        setSelectedClient(value);

        // Check if selected item is a contact (not a client)
        const selectedContact = contacts.find(contact => contact.id === value);
        if (selectedContact && !selectedContact.isClient) {
            setIsClientContact(true);
        } else {
            setIsClientContact(false);
        }
    };

    const handleClientSubmit = async (values) => {
        try {
            const result = await createClient(values).unwrap();

            message.success('Client added successfully');

            await refetchClients();

            if (result?.id) {
                form.setFieldValue('client', result.id);
            } else if (result?.data?.id) {
                form.setFieldValue('client', result.data.id);
            }

            setIsClientModalVisible(false);
        } catch (error) {
            message.error('Failed to add client');
        }
    };

    const handleAddPipeline = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setPipelineDropdownOpen(false);
        setPipelineFormKey(Date.now());
        setIsPipelineModalVisible(true);
    };

    const handlePipelineSubmit = async (values) => {
        try {
            const result = await createPipeline({
                name: values.name,
            }).unwrap();

            message.success('Pipeline added successfully');

            await refetchPipelines();

            setIsPipelineModalVisible(false);
            setPipelineFormKey(Date.now());
        } catch (error) {
            message.error('Failed to add pipeline');
        }
    };


    const handlePipelineChange = (value) => {
        setSelectedPipeline(value);

        const projectStages = stages
            .filter(stage => stage.pipeline === value && stage.type === 'project')
            .sort((a, b) => a.order - b.order);

        if (projectStages.length > 0) {
            const defaultStage = projectStages.find(stage => stage.is_default === true) || projectStages[0];
            form.setFieldValue('stage', defaultStage.id);
        } else {
            form.setFieldValue('stage', undefined);
            message.warning('This pipeline has no project stages.');
        }
    };

    const handleDeletePipeline = (pipelineId, pipelineName) => {
        setPipelineToDeleteId(pipelineId);
        setPipelineToDeleteName(pipelineName);
        setDeletePipelineModalVisible(true);
    };

    const handleConfirmDeletePipeline = async () => {
        if (pipelineToDeleteId) {
            try {
                await deletePipeline(pipelineToDeleteId).unwrap();
                message.success('Pipeline deleted successfully');

                const currentPipelineValue = form.getFieldValue('pipeline');
                if (currentPipelineValue === pipelineToDeleteId) {
                    const remainingPipelines = currentPipelines.filter(p => p.id !== pipelineToDeleteId);

                    if (remainingPipelines.length > 0) {
                        const currentIndex = currentPipelines.findIndex(p => p.id === pipelineToDeleteId);
                        const nextPipelineIndex = currentIndex < remainingPipelines.length ? currentIndex : 0;
                        const nextPipeline = remainingPipelines[nextPipelineIndex];

                        if (nextPipeline) {
                            form.setFieldValue('pipeline', nextPipeline.id);
                            handlePipelineChange(nextPipeline.id);
                        }
                    }
                }

                await refetchPipelines();
                setDeletePipelineModalVisible(false);
                setPipelineToDeleteId(null);
                setPipelineToDeleteName(null);
            } catch (error) {
                message.error('Failed to delete pipeline');
                setDeletePipelineModalVisible(false);
                setPipelineToDeleteId(null);
                setPipelineToDeleteName(null);
            }
        }
    };

    const handleCancelDeletePipeline = () => {
        setDeletePipelineModalVisible(false);
        setPipelineToDeleteId(null);
        setPipelineToDeleteName(null);
    };

    const handleDeleteSource = (source) => {
        if (document.activeElement) {
            document.activeElement.blur();
        }

        setSourceDropdownOpen(false);

        setSourceToDeleteId(source.id);
        setSourceToDeleteName(source.name);
        setDeleteSourceModalVisible(true);
    };

    const handleConfirmDeleteSource = async () => {
        try {
            await deleteSource(sourceToDeleteId).unwrap();
            message.success(`Source "${sourceToDeleteName}" deleted successfully`);

            const currentSource = form.getFieldValue('source');
            if (currentSource === sourceToDeleteId) {
                const remainingSources = sources.filter(s => s.id !== sourceToDeleteId);

                if (remainingSources.length > 0) {
                    const currentIndex = sources.findIndex(s => s.id === sourceToDeleteId);
                    const nextSourceIndex = currentIndex < remainingSources.length ? currentIndex : 0;
                    const nextSource = remainingSources[nextSourceIndex];

                    if (nextSource) {
                        form.setFieldValue('source', nextSource.id);
                    } else {
                        form.setFieldValue('source', undefined);
                    }
                } else {
                    form.setFieldValue('source', undefined);
                }
            }

            await refetchFilters();

            setTimeout(() => {
                const sourceField = document.querySelector('input[id="source"]');
                if (sourceField) {
                    sourceField.click();
                }
            }, 100);

            setDeleteSourceModalVisible(false);
            setSourceToDeleteId(null);
            setSourceToDeleteName(null);
        } catch (error) {
            message.error(`Failed to delete source: ${error.message || 'Unknown error'}`);
            setDeleteSourceModalVisible(false);
            setSourceToDeleteId(null);
            setSourceToDeleteName(null);
        }
    };

    const handleCancelDeleteSource = () => {
        setDeleteSourceModalVisible(false);
        setSourceToDeleteId(null);
        setSourceToDeleteName(null);
    };

    const handleDeleteCategory = (category) => {
        if (document.activeElement) {
            document.activeElement.blur();
        }

        setCategoryDropdownOpen(false);

        setCategoryToDeleteId(category.id);
        setCategoryToDeleteName(category.name);
        setDeleteCategoryModalVisible(true);
    };

    const handleConfirmDeleteCategory = async () => {
        try {
            await deleteCategory(categoryToDeleteId).unwrap();
            message.success(`Category "${categoryToDeleteName}" deleted successfully`);

            const currentCategory = form.getFieldValue('category');
            if (currentCategory === categoryToDeleteId) {
                const remainingCategories = categories.filter(c => c.id !== categoryToDeleteId);

                if (remainingCategories.length > 0) {
                    const currentIndex = categories.findIndex(c => c.id === categoryToDeleteId);
                    const nextCategoryIndex = currentIndex < remainingCategories.length ? currentIndex : 0;
                    const nextCategory = remainingCategories[nextCategoryIndex];

                    if (nextCategory) {
                        form.setFieldValue('category', nextCategory.id);
                    } else {
                        form.setFieldValue('category', undefined);
                    }
                } else {
                    form.setFieldValue('category', undefined);
                }
            }

            await refetchFilters();

            setTimeout(() => {
                const categoryField = document.querySelector('input[id="category"]');
                if (categoryField) {
                    categoryField.click();
                }
            }, 100);

            setDeleteCategoryModalVisible(false);
            setCategoryToDeleteId(null);
            setCategoryToDeleteName(null);
        } catch (error) {
            message.error(`Failed to delete category: ${error.message || 'Unknown error'}`);
            setDeleteCategoryModalVisible(false);
            setCategoryToDeleteId(null);
            setCategoryToDeleteName(null);
        }
    };

    const handleCancelDeleteCategory = () => {
        setDeleteCategoryModalVisible(false);
        setCategoryToDeleteId(null);
        setCategoryToDeleteName(null);
    };

    const handleDeleteClient = (client) => {
        if (document.activeElement) {
            document.activeElement.blur();
        }

        setClientDropdownOpen(false);

        setClientToDeleteId(client.id);
        setClientToDeleteName(client.name);
        setDeleteClientModalVisible(true);
    };

    const handleConfirmDeleteClient = async () => {
        if (clientToDeleteId) {
            try {
                await deleteClient(clientToDeleteId).unwrap();
                message.success(`Client "${clientToDeleteName}" deleted successfully`);

                const currentClientValue = form.getFieldValue('client');
                if (currentClientValue === clientToDeleteId) {
                    const remainingClients = clients.filter(c => c.id !== clientToDeleteId);

                    if (remainingClients.length > 0) {
                        const currentIndex = clients.findIndex(c => c.id === clientToDeleteId);
                        const nextClientIndex = currentIndex < remainingClients.length ? currentIndex : 0;
                        const nextClient = remainingClients[nextClientIndex];

                        if (nextClient) {
                            form.setFieldValue('client', nextClient.id);
                        } else {
                            form.setFieldValue('client', undefined);
                        }
                    } else {
                        form.setFieldValue('client', undefined);
                    }
                }

                await refetchClients();

                setTimeout(() => {
                    const clientField = document.querySelector('input[id="client"]');
                    if (clientField) {
                        clientField.click();
                    }
                }, 100);

                setDeleteClientModalVisible(false);
                setClientToDeleteId(null);
                setClientToDeleteName(null);
            } catch (error) {
                message.error(`Failed to delete client: ${error.message || 'Unknown error'}`);
                setDeleteClientModalVisible(false);
                setClientToDeleteId(null);
                setClientToDeleteName(null);
            }
        }
    };

    const handleCancelDeleteClient = () => {
        setDeleteClientModalVisible(false);
        setClientToDeleteId(null);
        setClientToDeleteName(null);
    };

    const getPipelineOptions = () => {
        const withDefault = [];
        const withoutDefault = [];
        currentPipelines.forEach(p => {
            const projectStagesForPipeline = stages.filter(
                stage => stage.pipeline === p.id && stage.type === 'project'
            );
            const hasDefaultProjectStage = projectStagesForPipeline.some(stage => stage.is_default);
            const option = {
                label: hasDefaultProjectStage ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{p.name}</span>
                        {p.name !== 'Sales' && p.name !== 'Marketing' && p.created_by !== 'SYSTEM' && (
                            <DeleteOutlined
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePipeline(p.id, p.name);
                                }}
                                style={{ color: 'var(--text-error)', pointerEvents: 'auto', cursor: 'pointer' }}
                            />
                        )}
                    </div>
                ) : (
                    <Tooltip title="This pipeline has no default project stage">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#bfbfbf' }}>
                            <span>{p.name}</span>
                            {p.name !== 'Sales' && p.name !== 'Marketing' && p.created_by !== 'SYSTEM' && (
                                <DeleteOutlined
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePipeline(p.id, p.name);
                                    }}
                                    style={{ color: 'var(--text-error)', pointerEvents: 'auto', cursor: 'pointer' }}
                                />
                            )}
                        </div>
                    </Tooltip>
                ),
                value: p.id,
                disabled: !hasDefaultProjectStage
            };
            if (hasDefaultProjectStage) {
                withDefault.push(option);
            } else {
                withoutDefault.push(option);
            }
        });
        return [...withDefault, ...withoutDefault];
    };

    const handleAddStage = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        if (!selectedPipeline) {
            message.warning('Please select a pipeline first');
            return;
        }
        setIsStageModalVisible(true);
    };

    const handleStageSubmit = async (values) => {
        try {
            const payload = {
                ...values,
            };

            if (!payload.pipeline) {
                payload.pipeline = selectedPipeline;
            }

            if (payload.pipeline_id) {
                delete payload.pipeline_id;
            }

            const result = await createStage(payload).unwrap();

            message.success('Stage added successfully');

            if (result?.id && result.type === 'project') {
                form.setFieldValue('stage', result.id);
            } else if (result?.data?.id && result.data.type === 'project') {
                form.setFieldValue('stage', result.data.id);
            }

            setIsStageModalVisible(false);
        } catch (error) {
            const errorMessage = error.data?.message || 'Failed to add stage';
            message.error(errorMessage);
        }
    };

    const handleTeamModalClose = () => {
        setIsTeamModalVisible(false);
        setTeamFormKey(Date.now());
    };

    const handleAddTeam = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setTeamFormKey(Date.now());
        setIsTeamModalVisible(true);
    };

    const handleTeamSubmit = async (values) => {
        try {
            const result = await createTeamMember(values).unwrap();
            message.success('Team added successfully');
            await refetchTeamMembers();

            const newTeamId = result?.id || result?.data?.id;
            if (newTeamId) {
                form.setFieldValue('teamId', newTeamId);
            }

            setIsTeamModalVisible(false);
            setTeamFormKey(Date.now());
        } catch (error) {
            message.error('Failed to add team');
        }
    };

    const handleAddStatus = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setStatusFormKey(Date.now());
        setStatusDropdownOpen(false);
        setIsStatusModalVisible(true);
    };

    const handleStatusSubmit = async (values) => {
        try {
            const result = await createFilter({
                name: values.name,
                type: 'status'
            }).unwrap();

            message.success('Status added successfully');
            await refetchFilters();

            const newStatusId = result?.id || result?.data?.id;
            if (newStatusId) {
                form.setFieldValue('status', newStatusId);
                setSelectedStatus(newStatusId);
            }

            setIsStatusModalVisible(false);
            setStatusFormKey(Date.now());
        } catch (error) {
            message.error('Failed to add status');
        }
    };

    const handleDeleteStatus = (status) => {
        if (document.activeElement) {
            document.activeElement.blur();
        }

        setStatusDropdownOpen(false);

        setStatusToDeleteId(status.id);
        setStatusToDeleteName(status.name);
        setDeleteStatusModalVisible(true);
    };

    const handleConfirmDeleteStatus = async () => {
        if (statusToDeleteId) {
            try {
                await deleteStatus(statusToDeleteId).unwrap();
                message.success('Status deleted successfully');

                const currentStatusValue = form.getFieldValue('status');
                if (currentStatusValue === statusToDeleteId) {
                    const remainingStatuses = statuses.filter(s => s.id !== statusToDeleteId);

                    if (remainingStatuses.length > 0) {
                        const currentIndex = statuses.findIndex(s => s.id === statusToDeleteId);
                        const nextStatusIndex = currentIndex < remainingStatuses.length ? currentIndex : 0;
                        const nextStatus = remainingStatuses[nextStatusIndex];

                        if (nextStatus) {
                            form.setFieldValue('status', nextStatus.id);
                            setSelectedStatus(nextStatus.id);
                        } else {
                            form.setFieldValue('status', undefined);
                            setSelectedStatus(null);
                        }
                    } else {
                        form.setFieldValue('status', undefined);
                        setSelectedStatus(null);
                    }
                }

                await refetchFilters();

                setTimeout(() => {
                    const statusField = document.querySelector('input[id="status"]');
                    if (statusField) {
                        statusField.click();
                    }
                }, 100);

                setDeleteStatusModalVisible(false);
                setStatusToDeleteId(null);
                setStatusToDeleteName(null);
            } catch (error) {
                message.error('Failed to delete status');
                setDeleteStatusModalVisible(false);
                setStatusToDeleteId(null);
                setStatusToDeleteName(null);
            }
        }
    };

    const handleCancelDeleteStatus = () => {
        setDeleteStatusModalVisible(false);
        setStatusToDeleteId(null);
        setStatusToDeleteName(null);
    };

    const getProjectFields = () => {
        const fields = [
            {
                name: 'projectTitle',
                label: 'Project Title',
                type: 'text',
                placeholder: 'Enter project title',
                rules: [{ required: true, message: 'Please enter project title' }],
                span: 12
            },
            {
                name: 'projectValue',
                label: 'Project Value',
                type: 'number',
                placeholder: 'Enter project value',
                rules: [{ required: true, message: 'Please enter project value' }],
                span: 12
            },
            {
                name: 'pipeline',
                label: 'Pipeline',
                type: 'select',
                placeholder: 'Select pipeline',
                rules: [{ required: true, message: 'Please select pipeline' }],
                options: getPipelineOptions(),
                showSearch: true,
                optionFilterProp: 'children',
                onChange: handlePipelineChange,
                open: pipelineDropdownOpen,
                onOpenChange: (open) => setPipelineDropdownOpen(open),
                span: 12,
                popupRender: (menu) => (
                    <div>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddPipeline}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Pipeline
                            </Button>
                        </div>
                    </div>
                )
            },
            {
                name: 'startDate',
                label: 'Start Date',
                type: 'custom',
                rules: [{ required: true, message: 'Please select start date' }],
                span: 12,
                render: () => (
                    <Form.Item
                        name="startDate"
                        label="Start Date"
                        noStyle
                        rules={[{ required: true, message: 'Please select start date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Select start date"
                            format="DD/MM/YYYY"
                            getPopupContainer={() => document.body}
                            onChange={(date) => {
                                const endDate = form.getFieldValue('endDate');
                                if (endDate && date && endDate < date) {
                                    form.setFieldsValue({ endDate: date });
                                }
                            }}
                        />
                    </Form.Item>
                )
            },
            {
                name: 'endDate',
                label: 'End Date',
                type: 'custom',
                rules: [{ required: true, message: 'Please select end date' }],
                span: 12,
                render: () => (
                    <Form.Item
                        name="endDate"
                        label="End Date"
                        noStyle
                        rules={[{ required: true, message: 'Please select end date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Select end date"
                            format="DD/MM/YYYY"
                            getPopupContainer={() => document.body}
                            disabledDate={(current) => {
                                const startDate = form.getFieldValue('startDate');
                                return startDate && current && current < startDate.startOf('day');
                            }}
                        />
                    </Form.Item>
                )
            }
        ];

        // Add priority field only in edit mode
        if (isEditing) {
            fields.push({
                name: 'priority',
                label: 'Priority',
                type: 'select',
                placeholder: 'Select priority',
                rules: [{ required: true, message: 'Please select priority' }],
                options: [
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' }
                ],
                span: 12
            });
        } else {
            // For new projects, add a hidden field with 'medium' priority
            fields.push({
                name: 'priority',
                type: 'hidden',
                initialValue: 'medium',
            });
        }

        if (isEditing) {
            fields.push({
                name: 'stage',
                label: 'Stage',
                type: 'select',
                placeholder: 'Select Stage',
                rules: [{ required: true, message: 'Please select stage' }],
                options: projectStages.map(s => ({ label: s.name, value: s.id })),
                disabled: !selectedPipeline,
                showSearch: true,
                optionFilterProp: 'children',
                span: 12,
                popupRender: (menu) => (
                    <div>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddStage}
                                style={{ width: '100%', height: '38px' }}
                                disabled={!selectedPipeline}
                            >
                                Add Stage
                            </Button>
                        </div>
                    </div>
                )
            });
        }

        if (!hideClientField) {
            fields.push({
                name: 'client',
                label: 'Client',
                type: 'select',
                required: true,
                placeholder: 'Select client or contact',
                rules: [{ required: true, message: 'Please select a client or contact' }],
                options: [
                    ...clients.map(client => ({
                        label: `${client.name} (Client)`,
                        value: client.id,
                        customContent: (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{client.name} (Client)</span>
                                {client.created_by !== 'SYSTEM' && client.id !== form.getFieldValue('client') && (
                                    <DeleteOutlined
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClient(client);
                                        }}
                                        style={{ color: '#ff4d4f' }}
                                    />
                                )}
                            </div>
                        )
                    })),
                    ...contacts.map(contact => ({
                        label: `${contact.name} (Contact)`,
                        value: contact.id,
                        customContent: (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{contact.name} (Contact)</span>
                            </div>
                        )
                    }))
                ],
                open: clientDropdownOpen,
                onOpenChange: (open) => setClientDropdownOpen(open),
                onChange: handleClientChange,
                popupRender: (menu) => (
                    <>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddClient}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Client
                            </Button>
                        </div>
                    </>
                ),
                span: 12
            });
        } else {
            fields.push({
                name: 'client',
                type: 'text',
                style: { display: 'none' },
                span: 0
            });
        }

        fields.push({
            name: 'source',
            label: 'Source',
            type: 'select',
            placeholder: 'Select source',
            rules: [{ required: true, message: 'Please select source' }],
            options: sources.map(s => ({
                label: s.name,
                value: s.id,
                customContent: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{s.name}</span>
                        {s.created_by !== 'SYSTEM' && s.id !== form.getFieldValue('source') && (
                            <DeleteOutlined
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSource(s);
                                }}
                                style={{ color: '#ff4d4f' }}
                            />
                        )}
                    </div>
                )
            })),
            showSearch: true,
            optionFilterProp: 'children',
            open: sourceDropdownOpen,
            onOpenChange: (open) => setSourceDropdownOpen(open),
            onChange: (value) => form.setFieldsValue({ source: value }),
            popupRender: (menu) => (
                <div>
                    {menu}
                    <div style={{
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <Button
                            type="primary"
                            size="small"
                            onClick={handleAddSource}
                            style={{ width: '100%', height: '38px' }}
                        >
                            Add Source
                        </Button>
                    </div>
                </div>
            ),
            span: 12
        });

        fields.push({
            name: 'category',
            label: 'Category',
            type: 'select',
            placeholder: 'Select category',
            rules: [{ required: true, message: 'Please select category' }],
            options: categories.map(c => ({
                label: c.name,
                value: c.id,
                customContent: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{c.name}</span>
                        {c.created_by !== 'SYSTEM' && c.id !== form.getFieldValue('category') && (
                            <DeleteOutlined
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(c);
                                }}
                                style={{ color: '#ff4d4f' }}
                            />
                        )}
                    </div>
                )
            })),
            showSearch: true,
            optionFilterProp: 'children',
            open: categoryDropdownOpen,
            onOpenChange: (open) => setCategoryDropdownOpen(open),
            onChange: (value) => form.setFieldsValue({ category: value }),
            popupRender: (menu) => (
                <div>
                    {menu}
                    <div style={{
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <Button
                            type="primary"
                            size="small"
                            onClick={handleAddCategory}
                            style={{ width: '100%', height: '38px' }}
                        >
                            Add Category
                        </Button>
                    </div>
                </div>
            ),
            span: 12
        });

        if (!isEditing) {
            fields.push({
                name: 'stage',
                label: 'Hidden Stage',
                type: 'text',
                style: { display: 'none' },
                span: 0
            });
        }

        if (isEditing) {
            fields.push({
                name: 'teamId',
                label: 'Team',
                type: 'select',
                placeholder: 'Select team',
                options: teamMembersResponse?.data?.items?.map(team => ({
                    label: team.teamName,
                    value: team.id
                })) || [],
                loading: isLoadingTeamMembers,
                span: 12,
                open: teamDropdownOpen,
                onOpenChange: (open) => setTeamDropdownOpen(open),
                popupRender: (menu) => (
                    <div>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddTeam}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Team
                            </Button>
                        </div>
                    </div>
                ),
                addonAfter: (
                    <Button
                        type="text"
                        icon={<TeamOutlined />}
                        title="Team Management"
                        onClick={() => {
                            document.activeElement.blur();
                            window.open('/admin/hrm/team-member', '_blank');
                        }}
                    />
                )
            });

            // Only add the status field when editing
            fields.push({
                name: 'status',
                label: 'Status',
                type: 'select',
                placeholder: 'Select status',
                options: statuses.map(s => ({
                    label: s.name,
                    value: s.id,
                    customContent: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{s.name}</span>
                            {s.created_by !== 'SYSTEM' && s.id !== selectedStatus && (
                                <DeleteOutlined
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStatus(s);
                                    }}
                                    style={{ color: '#ff4d4f' }}
                                />
                            )}
                        </div>
                    )
                })),
                showSearch: true,
                optionFilterProp: 'children',
                allowClear: isEditing,
                span: 12,
                onChange: (value) => setSelectedStatus(value),
                open: statusDropdownOpen,
                onOpenChange: (open) => setStatusDropdownOpen(open),
                popupRender: (menu) => (
                    <div>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddStatus}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Status
                            </Button>
                        </div>
                    </div>
                )
            });
        } else {
            // For new projects, add a hidden field with 'Pending' status
            const pendingStatus = statuses.find(s => s.name === 'Pending');
            fields.push({
                name: 'status',
                type: 'hidden',
                initialValue: pendingStatus ? pendingStatus.id : undefined,
            });
        }

        return fields;
    };

    const handleSubmit = async (values) => {
        try {
            // Convert contact to client if needed
            if (isClientContact) {
                const selectedContact = contacts.find(contact => contact.id === values.client);
                if (selectedContact) {
                    try {
                        await updateContact({
                            id: selectedContact.id,
                            data: {
                                ...selectedContact,
                                isClient: true
                            }
                        }).unwrap();

                        // Refresh the clients list
                        await refetchClients();
                        await refetchContacts();
                    } catch (error) {
                        message.error('Failed to convert contact to client');
                        return;
                    }
                }
            }

            // Then proceed with project creation
            const payload = { ...values };

            // Format startDate and endDate to ISO format if they exist
            if (payload.startDate && dayjs.isDayjs(payload.startDate)) {
                payload.startDate = payload.startDate.format('YYYY-MM-DD');
            }
            if (payload.endDate && dayjs.isDayjs(payload.endDate)) {
                payload.endDate = payload.endDate.format('YYYY-MM-DD');
            }

            // If stage is not set, try to find a default stage for the selected pipeline
            if (!payload.stage && payload.pipeline && stages && stages.length > 0) {
                const defaultStage = stages.find(
                    stage => stage.pipeline === payload.pipeline && stage.is_default === true && stage.type === 'project'
                );

                if (defaultStage) {
                    payload.stage = defaultStage.id;
                } else {
                    // If no default stage found, use the first stage
                    const firstStage = stages.find(stage => stage.pipeline === payload.pipeline && stage.type === 'project');
                    if (firstStage) {
                        payload.stage = firstStage.id;
                    }
                }
            }

            // Check if the startDate is today or in the past
            if (!isEditing && payload.startDate) {
                const startDate = dayjs(payload.startDate);
                const today = dayjs().startOf('day');

                if (startDate.isSame(today) || startDate.isBefore(today)) {
                    // Set status to Active
                    const activeStatus = statuses.find(s => s.name === 'Active');
                    if (activeStatus) {
                        payload.status = activeStatus.id;
                    }
                } else {
                    // For future projects, ensure status is set to 'Pending' if not already set
                    if (!payload.status || payload.status === '') {
                        const pendingStatus = statuses.find(s => s.name === 'Pending');
                        if (pendingStatus) {
                            payload.status = pendingStatus.id;
                        }
                    }
                }
            } else if (!isEditing && (!payload.status || payload.status === '')) {
                // If no startDate is provided, default to Pending
                const pendingStatus = statuses.find(s => s.name === 'Pending');
                if (pendingStatus) {
                    payload.status = pendingStatus.id;
                }
            }

            // Submit the form
            const result = await onSubmit(payload);

        } catch (error) {
            // Form submission failed
        }
    };

    return (
        <>
            <AdvancedForm
                form={form}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                submitButtonText={isEditing ? 'Update Project' : 'Create Project'}
                cancelButtonText="Cancel"
                isSubmitting={isSubmitting}
                fields={getProjectFields()}
                validationSchema={validationSchema}
                layout="vertical"
                className="project-form"
            />

            <Modal
                open={isSourceModalVisible}
                onCancel={() => {
                    setIsSourceModalVisible(false);
                }}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        <FilterOutlined />
                        Add New Source
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <FilterForm
                    onSubmit={handleSourceSubmit}
                    onCancel={() => setIsSourceModalVisible(false)}
                    filterType="source"
                    key={sourceFormKey}
                />
            </Modal>

            <Modal
                open={isCategoryModalVisible}
                onCancel={() => {
                    setIsCategoryModalVisible(false);
                }}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        <FilterOutlined />
                        Add New Category
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <FilterForm
                    onSubmit={handleCategorySubmit}
                    onCancel={() => setIsCategoryModalVisible(false)}
                    filterType="category"
                    key={categoryFormKey}
                />
            </Modal>

            <Modal
                open={isPipelineModalVisible}
                onCancel={() => {
                    setIsPipelineModalVisible(false);
                }}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        Add New Pipeline
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <PipelineForm
                    key={pipelineFormKey}
                    onSubmit={handlePipelineSubmit}
                    onCancel={() => {
                        setIsPipelineModalVisible(false);
                    }}
                    loading={false}
                />
            </Modal>

            <Modal
                open={isClientModalVisible}
                onCancel={() => {
                    setIsClientModalVisible(false);
                }}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        <UserOutlined />
                        Add New Client
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <ClientForm
                    onSubmit={handleClientSubmit}
                    onCancel={() => {
                        setIsClientModalVisible(false);
                    }}
                    loading={false}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Source" />}
                open={deleteSourceModalVisible}
                onOk={handleConfirmDeleteSource}
                onCancel={handleCancelDeleteSource}
                okText="Delete"
                okButtonProps={{ danger: true }}
                centered
                maskClosable={false}
                className="delete-modal"
            >
                <p>Are you sure you want to delete source "{sourceToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Category" />}
                open={deleteCategoryModalVisible}
                onOk={handleConfirmDeleteCategory}
                onCancel={handleCancelDeleteCategory}
                okText="Delete"
                okButtonProps={{ danger: true }}
                centered
                maskClosable={false}
                className="delete-modal"
            >
                <p>Are you sure you want to delete category "{categoryToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Client" />}
                open={deleteClientModalVisible}
                onOk={handleConfirmDeleteClient}
                onCancel={handleCancelDeleteClient}
                okText="Delete"
                okButtonProps={{ danger: true }}
                centered
                maskClosable={false}
                className="delete-modal"
            >
                <p>Are you sure you want to delete client "{clientToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Pipeline" />}
                open={deletePipelineModalVisible}
                onCancel={handleCancelDeletePipeline}
                onOk={handleConfirmDeletePipeline}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                className="delete-modal"
                centered
                maskClosable={false}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <p>Are you sure you want to delete pipeline "{pipelineToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                open={isStageModalVisible}
                onCancel={() => setIsStageModalVisible(false)}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        Add New Stage
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <StageForm
                    initialValues={{
                        pipeline_id: selectedPipeline,
                        type: 'project',
                        is_default: false
                    }}
                    onSubmit={handleStageSubmit}
                    onCancel={() => setIsStageModalVisible(false)}
                    loading={false}
                    hideTypeField={true}
                />
            </Modal>

            <Modal
                open={isTeamModalVisible}
                onCancel={handleTeamModalClose}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        <TeamOutlined />
                        Add New Team
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <TeamMemberForm
                    initialValues={null}
                    isSubmitting={isCreatingTeam}
                    onSubmit={handleTeamSubmit}
                    onCancel={handleTeamModalClose}
                    key={teamFormKey}
                />
            </Modal>

            <Modal
                open={isStatusModalVisible}
                onCancel={() => {
                    setIsStatusModalVisible(false);
                    setStatusFormKey(Date.now());
                }}
                footer={null}
                title={
                    <div className="modal-header" style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        padding: '0px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20
                    }}>
                        <FilterOutlined />
                        Add New Status
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <FilterForm
                    onSubmit={handleStatusSubmit}
                    onCancel={() => setIsStatusModalVisible(false)}
                    filterType="status"
                    hideTypeField={true}
                    key={statusFormKey}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Status" />}
                open={deleteStatusModalVisible}
                onCancel={handleCancelDeleteStatus}
                onOk={handleConfirmDeleteStatus}
                okText="Delete"
                okButtonProps={{ danger: true }}
                centered
                maskClosable={false}
                className="delete-modal"
            >
                <p>Are you sure you want to delete status "{statusToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </>
    );
};

export default ProjectForm; 