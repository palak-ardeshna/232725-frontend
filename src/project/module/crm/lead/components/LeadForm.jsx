import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useGetFiltersQuery, useGetContactsQuery, useCreateFilterMutation, useCreatePipelineMutation, useGetPipelinesQuery, useCreateContactMutation, useDeletePipelineMutation, useDeleteFilterMutation, useDeleteContactMutation, useGetTeamMembersQuery, useCreateTeamMemberMutation, useCreateStageMutation, useGetStagesQuery, useGetClientsQuery } from '../../../../../config/api/apiServices';
import AdvancedForm, { ModalTitle } from '../../../../../components/AdvancedForm';
import { Button, Space, Modal, Form, Input, message, Select, Tooltip } from 'antd';
import FilterForm from '../../system/filter/components/FilterForm';
import PipelineForm from '../../system/pipeline/components/PipelineForm';
import ContactForm from '../../contact/components/ContactForm';
import { FilterOutlined, UserOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import TeamMemberForm from '../../../hrm/teamMember/components/TeamMemberForm';
import StageForm from '../../system/stages/components/StageForm';

const validationSchema = Yup.object().shape({
    leadTitle: Yup.string()
        .required('Lead title is required')
        .max(50, 'Lead title cannot exceed 50 characters'),
    leadValue: Yup.number().nullable(),
    pipeline: Yup.string().required('Pipeline is required'),
    stage: Yup.string(),
    source: Yup.string().required('Source is required'),
    category: Yup.string().required('Category is required'),
    priority: Yup.string().when('$isEditing', {
        is: true,
        then: () => Yup.string().required('Priority is required'),
        otherwise: () => Yup.string()
    }),
    status: Yup.string(),
    teamId: Yup.string().nullable()
});

const LeadForm = ({ initialValues, isSubmitting, onSubmit, onCancel, pipelines = [], stages = [], hideContactField = false }) => {
    const [selectedPipeline, setSelectedPipeline] = useState(initialValues?.pipeline || null);
    const [selectedContact, setSelectedContact] = useState(initialValues?.contact || null);
    const [selectedSource, setSelectedSource] = useState(initialValues?.source || null);
    const [selectedCategory, setSelectedCategory] = useState(initialValues?.category || null);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isPipelineModalVisible, setIsPipelineModalVisible] = useState(false);
    const [isContactModalVisible, setIsContactModalVisible] = useState(false);
    const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
    const [isStageModalVisible, setIsStageModalVisible] = useState(false);
    const [teamFormKey, setTeamFormKey] = useState(Date.now());
    const [sourceFormKey, setSourceFormKey] = useState(Date.now());
    const [categoryFormKey, setCategoryFormKey] = useState(Date.now());

    const [form] = Form.useForm();
    const isEditing = !!initialValues;

    const [deletePipelineModalVisible, setDeletePipelineModalVisible] = useState(false);
    const [pipelineToDeleteId, setPipelineToDeleteId] = useState(null);
    const [pipelineToDeleteName, setPipelineToDeleteName] = useState(null);

    const [deleteSourceModalVisible, setDeleteSourceModalVisible] = useState(false);
    const [sourceToDeleteId, setSourceToDeleteId] = useState(null);
    const [sourceToDeleteName, setSourceToDeleteName] = useState(null);

    const [deleteCategoryModalVisible, setDeleteCategoryModalVisible] = useState(false);
    const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);
    const [categoryToDeleteName, setCategoryToDeleteName] = useState(null);

    const [deleteContactModalVisible, setDeleteContactModalVisible] = useState(false);
    const [contactToDeleteId, setContactToDeleteId] = useState(null);
    const [contactToDeleteName, setContactToDeleteName] = useState(null);

    const { data: filtersResponse, refetch: refetchFilters } = useGetFiltersQuery({ limit: 'all' });
    const { data: pipelinesResponse, refetch: refetchPipelines } = useGetPipelinesQuery({ limit: 'all' });
    const { data: contactsResponse, refetch: refetchContacts } = useGetContactsQuery({
        limit: 'all',
        isClient: false // Only get contacts
    });
    const { data: clientsResponse, refetch: refetchClients } = useGetClientsQuery({
        limit: 'all',
        isClient: true // Only get clients
    });
    const { data: teamMembersResponse, isLoading: isLoadingTeamMembers, refetch: refetchTeamMembers } = useGetTeamMembersQuery({
        page: 1,
        limit: 100
    });
    const [createFilter] = useCreateFilterMutation();
    const [createPipeline] = useCreatePipelineMutation();
    const [createContact] = useCreateContactMutation();
    const [createStage] = useCreateStageMutation();
    const [deletePipeline] = useDeletePipelineMutation();
    const [deleteSource] = useDeleteFilterMutation();
    const [deleteCategory] = useDeleteFilterMutation();
    const [deleteContact] = useDeleteContactMutation();
    const [createTeamMember, { isLoading: isCreatingTeam }] = useCreateTeamMemberMutation();
    const filters = filtersResponse?.data?.items || [];
    const currentPipelines = pipelinesResponse?.data?.items || pipelines;
    const currentContacts = contactsResponse?.data?.items || [];
    const clients = clientsResponse?.data?.items || [];
    const teams = teamMembersResponse?.data?.items || [];
    const sources = filters.filter(filter => filter.type === 'source');
    const categories = filters.filter(filter => filter.type === 'category');
    const statuses = filters.filter(filter => filter.type === 'status');

    const priorityOptions = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' }
    ];

    const leadStages = stages.filter(
        stage => stage.type === 'lead' && (!selectedPipeline || stage.pipeline === selectedPipeline)
    );

    useEffect(() => {
        if (initialValues?.pipeline) {
            setSelectedPipeline(initialValues.pipeline);
        }
        if (initialValues?.contact) {
            setSelectedContact(initialValues.contact);
        }
        if (initialValues?.source) {
            setSelectedSource(initialValues.source);
        }
        if (initialValues?.category) {
            setSelectedCategory(initialValues.category);
        }
        if (initialValues?.teamId) {
            form.setFieldValue('teamId', initialValues.teamId);
        }
    }, [initialValues, form]);

    const handlePipelineChange = (value) => {
        const leadStages = stages.filter(stage => stage.pipeline === value && stage.type === 'lead');
        const hasDefaultLeadStage = leadStages.some(stage => stage.is_default);
        if (!hasDefaultLeadStage) {
            message.warning('This pipeline has no default lead stage');
            return;
        }
        setSelectedPipeline(value);

        const leadStagesFiltered = stages
            .filter(stage => stage.pipeline === value && stage.type === 'lead')
            .sort((a, b) => a.order - b.order);

        if (leadStagesFiltered.length > 0) {
            form.setFieldValue('stage', leadStagesFiltered[0].id);
        } else {
            form.setFieldValue('stage', undefined);
            message.warning('This pipeline has no lead stages.');
        }
    };

    const handleAddSource = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setSourceFormKey(Date.now());
        setIsFilterModalVisible(true);
    };

    const handleFilterSubmit = async (values) => {
        try {
            // Save the current form values before making the API call
            const currentFormValues = form.getFieldsValue();

            const result = await createFilter({
                name: values.name,
                type: 'source'
            }).unwrap();

            message.success('Source added successfully');
            await refetchFilters();
            setIsFilterModalVisible(false);

            // Restore the saved form values
            form.setFieldsValue(currentFormValues);

            // Set the new source as selected
            const newSourceId = result?.id || result?.data?.id;
            if (newSourceId) {
                form.setFieldValue('source', newSourceId);
                setSelectedSource(newSourceId);
            }
        } catch (error) {
            message.error('Failed to add source');
        }
    };

    const handleAddCategory = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setCategoryFormKey(Date.now());
        setIsCategoryModalVisible(true);
    };

    const handleCategorySubmit = async (values) => {
        try {
            // Save the current form values before making the API call
            const currentFormValues = form.getFieldsValue();

            const result = await createFilter({
                name: values.name,
                type: 'category'
            }).unwrap();

            message.success('Category added successfully');
            await refetchFilters();

            // Restore the saved form values
            form.setFieldsValue(currentFormValues);

            // Set the new category as selected
            if (result?.id || result?.data?.id) {
                const newCategoryId = result?.id || result?.data?.id;
                form.setFieldValue('category', newCategoryId);
                setSelectedCategory(newCategoryId);
            }

            setIsCategoryModalVisible(false);
        } catch (error) {
            message.error('Failed to add category');
        }
    };

    const handleAddPipeline = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setIsPipelineModalVisible(true);
    };

    const handlePipelineSubmit = async (values) => {
        try {
            // Save the current form values
            const currentFormValues = form.getFieldsValue();

            const result = await createPipeline({
                name: values.name,
            }).unwrap();

            message.success('Pipeline added successfully');
            await refetchPipelines();

            // Restore the saved form values
            form.setFieldsValue(currentFormValues);

            // If there's a new pipeline ID, select it
            const newPipelineId = result?.id || result?.data?.id;
            if (newPipelineId) {
                form.setFieldValue('pipeline', newPipelineId);
                handlePipelineChange(newPipelineId);
            }

            setIsPipelineModalVisible(false);
        } catch (error) {
            message.error('Failed to add pipeline');
        }
    };

    const handleAddContact = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setIsContactModalVisible(true);
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

            if (result?.id && result.type === 'lead') {
                form.setFieldValue('stage', result.id);
            } else if (result?.data?.id && result.data.type === 'lead') {
                form.setFieldValue('stage', result.data.id);
            }

            setIsStageModalVisible(false);
        } catch (error) {
            const errorMessage = error.data?.message || 'Failed to add stage';
            message.error(errorMessage);
        }
    };

    const handleContactSubmit = async (values) => {
        try {
            // Save the current form values
            const currentFormValues = form.getFieldsValue();

            const result = await createContact(values).unwrap();
            message.success('Contact added successfully');
            await refetchContacts();

            // Restore the saved form values
            form.setFieldsValue(currentFormValues);

            // Set the newly created contact in the form
            if (result?.id || result?.data?.id) {
                const newContactId = result?.id || result?.data?.id;
                form.setFieldValue('contact', newContactId);
                setSelectedContact(newContactId);
            }

            setIsContactModalVisible(false);
        } catch (error) {
            message.error('Failed to add contact');
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

                // Check if deleted pipeline was selected
                const currentPipelineValue = form.getFieldValue('pipeline');
                if (currentPipelineValue === pipelineToDeleteId) {
                    // ડિલીટ કરેલ પાઇપલાઇન સિલેક્ટ થયેલી હતી, તો બીજી પાઇપલાઇન સિલેક્ટ કરો
                    const remainingPipelines = currentPipelines.filter(p => p.id !== pipelineToDeleteId);

                    if (remainingPipelines.length > 0) {
                        // અહીં ક્રમ મુજબ આગળની પાઇપલાઇનને સિલેક્ટ કરો
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
        // First blur any active element to close the dropdown
        if (document.activeElement) {
            document.activeElement.blur();
        }

        setSourceToDeleteId(source.id);
        setSourceToDeleteName(source.name);
        setDeleteSourceModalVisible(true);
    };

    const handleConfirmDeleteSource = async () => {
        try {
            await deleteSource(sourceToDeleteId).unwrap();
            message.success(`Source "${sourceToDeleteName}" deleted successfully`);

            // Clear the source field in the form if the deleted source was selected
            const currentSourceValue = form.getFieldValue('source');
            if (currentSourceValue === sourceToDeleteId) {
                // ડિલીટ કરેલ સોર્સ સિલેક્ટ થયેલો હતો, તો બીજો સોર્સ સિલેક્ટ કરો
                const remainingSources = sources.filter(s => s.id !== sourceToDeleteId);

                if (remainingSources.length > 0) {
                    // અહીં ક્રમ મુજબ આગળના સોર્સને સિલેક્ટ કરો
                    const currentIndex = sources.findIndex(s => s.id === sourceToDeleteId);
                    const nextSourceIndex = currentIndex < remainingSources.length ? currentIndex : 0;
                    const nextSource = remainingSources[nextSourceIndex];

                    if (nextSource) {
                        form.setFieldValue('source', nextSource.id);
                        setSelectedSource(nextSource.id);
                    } else {
                        form.setFieldValue('source', undefined);
                        setSelectedSource(null);
                    }
                } else {
                    form.setFieldValue('source', undefined);
                    setSelectedSource(null);
                }
            }

            await refetchFilters();

            // Update the dropdown to show the remaining sources
            setTimeout(() => {
                // This timeout ensures the sources list is refreshed before showing the dropdown again
                const sourceField = document.querySelector('input[id="source"]');
                if (sourceField) {
                    sourceField.click();
                }
            }, 100);

            setDeleteSourceModalVisible(false);
            setSourceToDeleteId(null);
            setSourceToDeleteName(null);
        } catch (error) {
            message.error('Failed to delete source');
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
        // First blur any active element to close the dropdown
        if (document.activeElement) {
            document.activeElement.blur();
        }

        setCategoryToDeleteId(category.id);
        setCategoryToDeleteName(category.name);
        setDeleteCategoryModalVisible(true);
    };

    const handleConfirmDeleteCategory = async () => {
        if (categoryToDeleteId) {
            try {
                await deleteCategory(categoryToDeleteId).unwrap();
                message.success(`Category "${categoryToDeleteName}" deleted successfully`);

                // Clear the category field in the form if the deleted category was selected
                const currentCategoryValue = form.getFieldValue('category');
                if (currentCategoryValue === categoryToDeleteId) {
                    // ડિલીટ કરેલ કેટેગરી સિલેક્ટ થયેલી હતી, તો બીજી કેટેગરી સિલેક્ટ કરો
                    const remainingCategories = categories.filter(c => c.id !== categoryToDeleteId);

                    if (remainingCategories.length > 0) {
                        // અહીં ક્રમ મુજબ આગળની કેટેગરીને સિલેક્ટ કરો
                        const currentIndex = categories.findIndex(c => c.id === categoryToDeleteId);
                        const nextCategoryIndex = currentIndex < remainingCategories.length ? currentIndex : 0;
                        const nextCategory = remainingCategories[nextCategoryIndex];

                        if (nextCategory) {
                            form.setFieldValue('category', nextCategory.id);
                            setSelectedCategory(nextCategory.id);
                        } else {
                            form.setFieldValue('category', undefined);
                            setSelectedCategory(null);
                        }
                    } else {
                        form.setFieldValue('category', undefined);
                        setSelectedCategory(null);
                    }
                }

                await refetchFilters();

                // Update the dropdown to show the remaining categories
                setTimeout(() => {
                    // This timeout ensures the categories list is refreshed before showing the dropdown again
                    const categoryField = document.querySelector('input[id="category"]');
                    if (categoryField) {
                        categoryField.click();
                    }
                }, 100);

                setDeleteCategoryModalVisible(false);
                setCategoryToDeleteId(null);
                setCategoryToDeleteName(null);
            } catch (error) {
                message.error('Failed to delete category');
                setDeleteCategoryModalVisible(false);
                setCategoryToDeleteId(null);
                setCategoryToDeleteName(null);
            }
        }
    };

    const handleCancelDeleteCategory = () => {
        setDeleteCategoryModalVisible(false);
        setCategoryToDeleteId(null);
        setCategoryToDeleteName(null);
    };

    const handleDeleteContact = (item) => {
        // First blur any active element to close the dropdown
        if (document.activeElement) {
            document.activeElement.blur();
        }

        setContactToDeleteId(item.id);
        setContactToDeleteName(item.name);
        setDeleteContactModalVisible(true);
    };

    const handleConfirmDeleteContact = async () => {
        if (contactToDeleteId) {
            try {
                await deleteContact(contactToDeleteId).unwrap();
                message.success('Contact/Client deleted successfully');
                await refetchContacts();
                await refetchClients();

                // Clear the contact field in the form if the deleted contact was selected
                const currentContactValue = form.getFieldValue('contact');
                if (currentContactValue === contactToDeleteId) {
                    form.setFieldValue('contact', undefined);
                }

                setDeleteContactModalVisible(false);
                setContactToDeleteId(null);
                setContactToDeleteName(null);
            } catch (error) {
                message.error('Failed to delete contact/client');
            }
        }
    };

    const handleCancelDeleteContact = () => {
        setDeleteContactModalVisible(false);
        setContactToDeleteId(null);
        setContactToDeleteName(null);
    };

    const getPipelineOptions = () => {
        const withDefault = [];
        const withoutDefault = [];
        currentPipelines.forEach(p => {
            const leadStages = stages.filter(
                stage => stage.pipeline === p.id && stage.type === 'lead'
            );
            const hasDefaultLeadStage = leadStages.some(stage => stage.is_default);
            const option = {
                label: p.name,
                value: p.id,
                customContent: hasDefaultLeadStage ? (
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
                    <Tooltip title="This pipeline has no default lead stage">
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
                disabled: !hasDefaultLeadStage
            };
            if (hasDefaultLeadStage) {
                withDefault.push(option);
            } else {
                withoutDefault.push(option);
            }
        });
        return [...withDefault, ...withoutDefault];
    };

    const getLeadFields = () => {
        const fields = [
            {
                name: 'leadTitle',
                label: 'Lead Title',
                type: 'text',
                placeholder: 'Enter lead title',
                rules: [
                    { required: true, message: 'Please enter lead title' },
                    { max: 50, message: 'Lead title cannot exceed 50 characters' }
                ],
                span: 12
            },
            {
                name: 'leadValue',
                label: 'Lead Value',
                type: 'number',
                placeholder: 'Enter lead value',
                min: 0,
                addonBefore: '₹',
                formatter: value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                parser: value => value.replace(/\₹\s?|(,*)/g, ''),
                span: 12
            },
            {
                name: 'pipeline',
                label: 'Pipeline',
                type: 'select',
                placeholder: 'Select Pipeline',
                rules: [{ required: true, message: 'Please select pipeline' }],
                options: getPipelineOptions(),
                onChange: handlePipelineChange,
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
                                onClick={handleAddPipeline}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Pipeline
                            </Button>
                        </div>
                    </div>
                )
            }
        ];

        if (!hideContactField) {
            fields.push({
                name: 'contact',
                label: 'Contact',
                type: 'select',
                span: 12,
                placeholder: 'Select Contact or Client',
                options: [
                    ...clients.map(client => ({
                        label: `${client.name} (Client)`,
                        value: client.id,
                        customContent: (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{client.name} (Client)</span>
                                {client.created_by !== 'SYSTEM' && client.id !== selectedContact && (
                                    <DeleteOutlined
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteContact(client);
                                        }}
                                        style={{ color: '#ff4d4f' }}
                                    />
                                )}
                            </div>
                        )
                    })),
                    ...currentContacts.map(contact => ({
                        label: `${contact.name} (Contact)`,
                        value: contact.id,
                        customContent: (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{contact.name} (Contact)</span>
                                {contact.created_by !== 'SYSTEM' && contact.id !== selectedContact && (
                                    <DeleteOutlined
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteContact(contact);
                                        }}
                                        style={{ color: '#ff4d4f' }}
                                    />
                                )}
                            </div>
                        )
                    }))
                ],
                addButton: {
                    text: 'Add Contact',
                    onClick: handleAddContact
                }
            });
        }

        // Add source and category fields
        fields.push(
            {
                name: 'source',
                label: 'Source',
                type: 'select',
                placeholder: 'Select Source',
                rules: [{ required: true, message: 'Please select source' }],
                options: sources.map(s => ({
                    label: s.name,
                    value: s.id,
                    customContent: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{s.name}</span>
                            {s.created_by !== 'SYSTEM' && s.id !== selectedSource && (
                                <DeleteOutlined
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        // Force close all dropdowns
                                        const dropdowns = document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
                                        dropdowns.forEach(dropdown => {
                                            dropdown.classList.add('ant-select-dropdown-hidden');
                                        });
                                        // Also blur active element
                                        if (document.activeElement) {
                                            document.activeElement.blur();
                                        }
                                        handleDeleteSource(s);
                                    }}
                                    style={{ color: '#ff4d4f' }}
                                />
                            )}
                        </div>
                    ),
                    value: s.id
                })),
                showSearch: true,
                optionFilterProp: 'children',
                allowClear: false,
                onChange: (value) => setSelectedSource(value),
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
                                onClick={handleAddSource}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Source
                            </Button>
                        </div>
                    </div>
                )
            },
            {
                name: 'category',
                label: 'Category',
                type: 'select',
                placeholder: 'Select Category',
                rules: [{ required: true, message: 'Please select category' }],
                options: categories.map(c => ({
                    label: c.name,
                    value: c.id,
                    customContent: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{c.name}</span>
                            {c.created_by !== 'SYSTEM' && c.id !== selectedCategory && (
                                <DeleteOutlined
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        // Force close all dropdowns
                                        const dropdowns = document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
                                        dropdowns.forEach(dropdown => {
                                            dropdown.classList.add('ant-select-dropdown-hidden');
                                        });
                                        // Also blur active element
                                        if (document.activeElement) {
                                            document.activeElement.blur();
                                        }
                                        handleDeleteCategory(c);
                                    }}
                                    style={{ color: '#ff4d4f' }}
                                />
                            )}
                        </div>
                    ),
                    value: c.id
                })),
                showSearch: true,
                optionFilterProp: 'children',
                allowClear: false,
                onChange: (value) => setSelectedCategory(value),
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
                                onClick={handleAddCategory}
                                style={{ width: '100%', height: '38px' }}
                            >
                                Add Category
                            </Button>
                        </div>
                    </div>
                )
            }
        );

        if (isEditing) {
            // Add stage and priority fields for edit mode
            fields.push({
                name: 'stage',
                label: 'Stage',
                type: 'select',
                placeholder: 'Select Stage',
                rules: [{ required: true, message: 'Please select stage' }],
                options: leadStages.map(s => ({ label: s.name, value: s.id })),
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

            fields.push({
                name: 'priority',
                label: 'Priority',
                type: 'select',
                placeholder: 'Select Priority',
                options: priorityOptions,
                showSearch: true,
                optionFilterProp: 'children',
                rules: [{ required: true, message: 'Please select priority' }],
                span: 12
            });

            // Update the teamId field in the fields array
            fields.push({
                name: 'teamId',
                label: 'Team',
                type: 'select',
                placeholder: 'Select team',
                options: teams.map(team => ({
                    label: team.teamName,
                    value: team.id
                })) || [],
                loading: isLoadingTeamMembers,
                span: 12,
                showSearch: true,
                optionFilterProp: 'children',
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
        } else {
            // Hidden fields for create mode
            fields.push({
                name: 'stage',
                type: 'text',
                style: { display: 'none' },
                span: 0
            });

            // Priority field removed from add form
            // Hidden priority field to set default value
            fields.push({
                name: 'priority',
                type: 'text',
                style: { display: 'none' },
                span: 0
            });
        }

        return fields;
    };

    const handleSubmit = async (values) => {
        try {
            const payload = { ...values };

            if (!payload.stage && payload.pipeline) {
                const defaultStage = stages.find(
                    stage => stage.pipeline === payload.pipeline &&
                        stage.type === 'lead' &&
                        stage.is_default === true
                );

                if (defaultStage) {
                    payload.stage = defaultStage.id;
                } else {
                    const anyLeadStage = stages.find(
                        stage => stage.pipeline === payload.pipeline &&
                            stage.type === 'lead'
                    );

                    if (anyLeadStage) {
                        payload.stage = anyLeadStage.id;
                    } else {
                        const anyStage = stages.find(
                            stage => stage.pipeline === payload.pipeline
                        );

                        if (anyStage) {
                            payload.stage = anyStage.id;
                        } else {
                            const firstStage = stages.find(stage => stage.type === 'lead');
                            if (firstStage) {
                                payload.stage = firstStage.id;
                            } else if (stages.length > 0) {
                                payload.stage = stages[0].id;
                            }
                        }
                    }
                }
            }

            if (!payload.stage) {
                throw new Error("No valid stage found for the selected pipeline");
            }

            // Set default priority if not provided
            if (!payload.priority) {
                payload.priority = 'medium';
            }

            onSubmit(payload);
        } catch (error) {
            message.error('Error in lead form submission');
        }
    };

    const handleTeamModalClose = () => {
        setIsTeamModalVisible(false);
        setTeamFormKey(Date.now());
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
        } catch (error) {
            console.error("Error creating team:", error);
            message.error('Failed to add team');
        }
    };

    const handleAddTeam = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setTeamFormKey(Date.now());
        setIsTeamModalVisible(true);
    };

    return (
        <>
            <AdvancedForm
                initialValues={initialValues}
                form={form}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                fields={getLeadFields()}
                validationSchema={validationSchema}
                validationContext={{ isEditing }}
                submitButtonText={isEditing ? 'Update Lead' : 'Create Lead'}
                className="lead-form"
            />
            <Modal
                open={isFilterModalVisible}
                onCancel={() => {
                    setIsFilterModalVisible(false);
                    setSourceFormKey(Date.now());
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
                    key={sourceFormKey}
                    onSubmit={handleFilterSubmit}
                    onCancel={() => {
                        setIsFilterModalVisible(false);
                        setSourceFormKey(Date.now());
                    }}
                    filterType="source"
                />
            </Modal>

            <Modal
                open={isCategoryModalVisible}
                onCancel={() => {
                    setIsCategoryModalVisible(false);
                    setCategoryFormKey(Date.now());
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
                    key={categoryFormKey}
                    onSubmit={handleCategorySubmit}
                    onCancel={() => {
                        setIsCategoryModalVisible(false);
                        setCategoryFormKey(Date.now());
                    }}
                    filterType="category"
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
                    onSubmit={handlePipelineSubmit}
                    onCancel={() => {
                        setIsPipelineModalVisible(false);
                    }}
                    loading={false}
                />
            </Modal>

            <Modal
                open={isContactModalVisible}
                onCancel={() => {
                    setIsContactModalVisible(false);
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
                        Add New Contact
                    </div>
                }
                closable={true}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <ContactForm
                    onSubmit={handleContactSubmit}
                    onCancel={() => {
                        setIsContactModalVisible(false);
                    }}
                    loading={false}
                />
            </Modal>

            {/* Custom Delete Pipeline Modal */}
            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Pipeline" />}
                open={deletePipelineModalVisible}
                onCancel={handleCancelDeletePipeline}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onOk={handleConfirmDeletePipeline}
                className="delete-modal"
                centered
                maskClosable={false}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <p>Are you sure you want to delete pipeline "{pipelineToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            {/* Custom Delete Source Modal */}
            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Source" />}
                open={deleteSourceModalVisible}
                onCancel={handleCancelDeleteSource}
                onOk={handleConfirmDeleteSource}

                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                className="delete-modal"
                centered
                maskClosable={false}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <p>Are you sure you want to delete source "{sourceToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            {/* Custom Delete Category Modal */}
            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Category" />}
                open={deleteCategoryModalVisible}
                onCancel={handleCancelDeleteCategory}
                onOk={handleConfirmDeleteCategory}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                className="delete-modal"
                centered
                maskClosable={false}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <p>Are you sure you want to delete category "{categoryToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            {/* Custom Delete Contact Modal */}
            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Contact" />}
                open={deleteContactModalVisible}
                onCancel={handleCancelDeleteContact}
                onOk={handleConfirmDeleteContact}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onClose={handleCancelDeleteContact}
                className="delete-modal"
                centered
                maskClosable={false}
                styles={{ body: { overflow: 'auto' } }}
                style={{ top: 20 }}
            >
                <p>Are you sure you want to delete contact "{contactToDeleteName}"?</p>
                <p>This action cannot be undone.</p>
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
                        type: 'lead', // Pre-select lead type
                        is_default: false // Explicitly set to false to avoid conflicts
                    }}
                    onSubmit={handleStageSubmit}
                    onCancel={() => setIsStageModalVisible(false)}
                    loading={false}
                    hideTypeField={true}
                />
            </Modal>
        </>
    );
};

export default LeadForm; 