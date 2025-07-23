import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal, message, Select } from 'antd';
import { DeleteOutlined, FilterOutlined, EditOutlined, BellOutlined } from '@ant-design/icons';
import { FiList, FiEdit } from 'react-icons/fi';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import ProjectView from './components/ProjectView';
import CommonKanbanView from '../../../../components/CommonKanbanView';
import {
    useGetProjectsQuery,
    useDeleteProjectMutation,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useGetFiltersQuery,
    useGetStagesQuery,
    useGetPipelinesQuery,
    useGetClientsQuery,
    useUpdateStageMutation,
    useGetTeamMembersQuery,
    useCreateReminderMutation,
    useGetEmployeesQuery
} from '../../../../config/api/apiServices';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import './project.scss';
import getRole from '../client/components/getRole';
import dayjs from 'dayjs';
import ReminderModal from '../../../../components/ReminderModal';
import { useNavigate } from 'react-router-dom';
const { Option } = Select;

const ModuleFilter = ({ selectedPipeline, handlePipelineChange, pipelines }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 576);
    const filterRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 576);
            if (window.innerWidth > 576) {
                setIsFilterOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleFilter = (e) => {
        e.stopPropagation();
        setIsFilterOpen(!isFilterOpen);
    };

    const closeFilter = () => {
        setIsFilterOpen(false);
    };

    const filters = [
        {
            key: 'pipeline',
            placeholder: 'All Pipelines',
            value: selectedPipeline,
            onChange: (val) => {
                handlePipelineChange(val);
                if (isMobileView) {
                    closeFilter();
                }
            },
            allowClear: false,
            options: pipelines.map(pipeline => ({
                key: pipeline.id,
                value: pipeline.id,
                label: pipeline.name
            }))
        }
    ];

    return (
        <div className="filter-container">
            {filters.map(filter => (
                <div
                    key={filter.key}
                    className={`module-filter ${isFilterOpen ? 'open' : ''}`}
                    ref={filterRef}
                >
                    {isMobileView && (
                        <div className={`filter-icon ${isFilterOpen ? 'active' : ''}`} onClick={toggleFilter}>
                            <FilterOutlined />
                        </div>
                    )}
                    <Select
                        placeholder={filter.placeholder}
                        style={{ width: '100%' }}
                        value={filter.value}
                        onChange={filter.onChange}
                        allowClear={filter.allowClear !== false}
                        showSearch
                        optionFilterProp="children"
                        onBlur={isMobileView ? closeFilter : undefined}
                        onClick={(e) => isMobileView && e.stopPropagation()}
                        dropdownStyle={{ minWidth: '180px' }}
                    >
                        {filter.options.map(option => (
                            <Option key={option.key} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>
            ))}
        </div>
    );
};

const Project = () => {
    const navigate = useNavigate();
    const role = getRole();
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filterParams, setFilterParams] = useState({});
    const [allProjects, setAllProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [isClientSideFiltering, setIsClientSideFiltering] = useState(true);
    const [showInitialLoader, setShowInitialLoader] = useState(false);
    const [formKey, setFormKey] = useState(Date.now());
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [viewModal, setViewModal] = useState({ visible: false, data: null });
    const [reminderModal, setReminderModal] = useState({ visible: false, project: null });

    const projectsDataRef = useRef({ allProjects: [], filteredProjects: [] });

    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const pipelines = pipelinesResponse?.data?.items || [];

    const filters = filtersResponse?.data?.items || [];
    const sources = filters.filter(filter => filter.type === 'source');
    const categories = filters.filter(filter => filter.type === 'category');
    const statuses = filters.filter(filter => filter.type === 'status');

    const statusMap = useMemo(() => {
        const map = {};
        if (statuses && statuses.length > 0) {
            statuses.forEach(status => {
                map[status.id] = status.name;
            });
        }
        return map;
    }, [statuses]);

    const { data: stagesResponse } = useGetStagesQuery({
        limit: 'all',
        pipeline: selectedPipeline || ''
    }, {
        skip: false
    });

    const { data: stagesResponse2 } = useGetStagesQuery({
        limit: 'all',
    }, {
        skip: false
    });

    const stages = stagesResponse2?.data?.items || [];

    const projectStages = selectedPipeline
        ? stages.filter(stage => stage.type === 'project' && stage.pipeline === selectedPipeline)
        : stages.filter(stage => stage.type === 'project');

    const { data: allProjectsResponse, isLoading: isAllProjectsLoading } = useGetProjectsQuery({
        limit: 'all'
    }, {
        skip: !isClientSideFiltering
    });

    const { data: response, isLoading: isFilteredProjectsLoading, refetch } = useGetProjectsQuery({
        page: currentPage,
        limit: pageSize,
        ...filterParams
    }, {
        skip: isClientSideFiltering
    });

    const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
    const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
    const [createReminder, { isLoading: isCreatingReminder }] = useCreateReminderMutation();

    const { data: clientsResponse } = useGetClientsQuery({ limit: 'all' });
    const clients = clientsResponse?.data?.items || [];

    const { data: teamsData } = useGetTeamMembersQuery({ limit: 'all' });
    const { data: employeesData } = useGetEmployeesQuery({ limit: 'all' });

    useEffect(() => {
        if (isClientSideFiltering && allProjectsResponse?.data?.items) {
            setAllProjects(allProjectsResponse.data.items);

            if (!selectedPipeline && allProjectsResponse.data.items.length > 0 && pipelines.length > 0) {
                const firstProjectPipeline = allProjectsResponse.data.items[0].pipeline;
                if (firstProjectPipeline) {
                    setSelectedPipeline(firstProjectPipeline);
                } else {
                    setSelectedPipeline(pipelines[0].id);
                }
            } else if (!selectedPipeline && pipelines.length > 0) {
                setSelectedPipeline(pipelines[0].id);
            }
        }
    }, [allProjectsResponse, isClientSideFiltering, pipelines, selectedPipeline]);

    useEffect(() => {
        const convertDataStr = localStorage.getItem('convertToProjectData');
        if (convertDataStr) {
            try {
                const convertData = JSON.parse(convertDataStr);
                if (convertData.fromLead) {
                    setFormKey(Date.now());

                    delete convertData.id;

                    convertData.isNew = true;
                    convertData._isNewProject = true;

                    if (convertData.projectValue !== undefined && convertData.projectValue !== null) {
                        convertData.projectValue = Number(convertData.projectValue);
                    } else if (convertData.leadValue) {
                        convertData.projectValue = Number(convertData.leadValue);
                    }

                    setFormModal({ visible: true, data: convertData });

                    setTimeout(() => {
                        try {
                            const formElements = document.querySelectorAll('input[id$="projectValue"]');
                            if (formElements.length > 0) {
                                const input = formElements[0];
                                input.value = convertData.projectValue || '';

                                const event = new Event('input', { bubbles: true });
                                input.dispatchEvent(event);
                            }
                        } catch (e) {
                        }
                    }, 500);
                }
            } catch (error) {
                localStorage.removeItem('convertToProjectData');
            }
        }
    }, []);

    useEffect(() => {
        if (isClientSideFiltering && allProjects.length > 0) {
            let filtered = [...allProjects];

            if (selectedPipeline) {
                filtered = filtered.filter(project => project.pipeline === selectedPipeline);
            }

            if (selectedStage) {
                filtered = filtered.filter(project => project.stage === selectedStage);
            }

            const startIndex = (currentPage - 1) * pageSize;
            const paginatedProjects = filtered.slice(startIndex, startIndex + pageSize);

            setFilteredProjects({
                items: paginatedProjects,
                total: filtered.length,
                currentPage: currentPage
            });
        }
    }, [allProjects, selectedPipeline, selectedStage, currentPage, pageSize, isClientSideFiltering]);

    const projects = isClientSideFiltering ?
        (filteredProjects.items || []) :
        (response?.data?.items || []);

    const total = isClientSideFiltering ?
        (filteredProjects.total || 0) :
        (response?.data?.total || 0);

    const currentPageFromServer = isClientSideFiltering ?
        currentPage :
        (response?.data?.currentPage || 1);

    const resetFilters = () => {
        setSelectedPipeline(null);
        setSelectedStage(null);
        setCurrentPage(1);
        setFilterParams({});
    };

    const fetchAllProjects = async () => {
        try {
        } catch (error) {
        }
    };

    const fetchFilteredProjects = async () => {
    };

    useEffect(() => {
        if (!isClientSideFiltering) {
            fetchFilteredProjects();
        }
    }, [filterParams, currentPage, pageSize, isClientSideFiltering]);

    useEffect(() => {
        if (!isClientSideFiltering) {
            const params = {};
            if (selectedPipeline) {
                params.pipeline = selectedPipeline;
            }
            if (selectedStage) {
                params.stage = selectedStage;
            }
            setFilterParams(params);
            setCurrentPage(1);
        }
    }, [selectedPipeline, selectedStage, isClientSideFiltering]);

    const handlePipelineChange = (value) => {
        setSelectedPipeline(value);
        setSelectedStage(null);

        if (isClientSideFiltering && allProjects.length > 0) {
            let filtered = [...allProjects];
            if (value) {
                filtered = filtered.filter(project => project.pipeline === value);
            }

            const startIndex = 0;
            const paginatedProjects = filtered.slice(startIndex, startIndex + pageSize);

            setFilteredProjects({
                items: paginatedProjects,
                total: filtered.length,
                currentPage: 1
            });
            setCurrentPage(1);
        } else {
            const params = { ...filterParams };
            if (value) {
                params.pipeline = value;
            } else {
                delete params.pipeline;
            }
            delete params.stage;
            setFilterParams(params);
            setCurrentPage(1);
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleAdd = () => {
        setFormKey(Date.now());

        const convertDataString = localStorage.getItem('convertToProjectData');
        if (convertDataString) {
            try {
                const convertData = JSON.parse(convertDataString);
                setFormModal({ visible: true, data: convertData });
            } catch (error) {
                setFormModal({ visible: true, data: null });
            }
        } else {
            setFormModal({ visible: true, data: null });
        }
    };

    const handleEdit = (project) => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: project });
    };

    const handleDelete = (project) => setDeleteModal({ visible: true, data: project });

    const handleFormCancel = () => {
        localStorage.removeItem('convertToProjectData');
        setFormModal({ visible: false, data: null });
    };

    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data && formModal.data.id && !formModal.data._isNewProject) {
                await updateProject({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Project updated successfully');
            } else {
                await createProject(values).unwrap();
                message.success('Project created successfully');
            }

            localStorage.removeItem('convertToProjectData');

            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data && formModal.data.id && !formModal.data._isNewProject ? 'update' : 'create'} project: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteProject(deleteModal.data.id).unwrap();
            message.success('Project deleted successfully');

            if (isClientSideFiltering) {
                const updatedProjects = allProjects.filter(project => project.id !== deleteModal.data.id);
                setAllProjects(updatedProjects);
                projectsDataRef.current.allProjects = updatedProjects;
            } else {
                refetch();
            }

            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete project');
        }
    };

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteProject(id).unwrap();
                    successCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            if (isClientSideFiltering) {
                const updatedProjects = allProjects.filter(project => !ids.includes(project.id));
                setAllProjects(updatedProjects);
                if (projectsDataRef && projectsDataRef.current) {
                    projectsDataRef.current.allProjects = updatedProjects;
                }

                let filtered = [...updatedProjects];
                if (selectedCategory && filtered.length > 0) {
                    filtered = filtered.filter(project => project.category === selectedCategory);
                }
                setFilteredProjects(filtered);
                if (projectsDataRef && projectsDataRef.current) {
                    projectsDataRef.current.filteredProjects = filtered;
                }
            } else {
                refetch();
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} project${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} project${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const isLoading = isClientSideFiltering ? isAllProjectsLoading : isFilteredProjectsLoading;

    const pipelineFilterValue = useMemo(() => selectedPipeline, [selectedPipeline]);

    const moduleFilterKey = useMemo(() => `filter-${selectedPipeline || 'all'}`, [selectedPipeline]);

    const handleViewChange = (view) => {
        setViewMode(view);

        setCurrentPage(1);

        if (view === 'grid') {
            setIsClientSideFiltering(true);

            const fetchData = async () => {
                try {
                    const projectsResponse = await fetch('/api/projects?limit=all');
                    if (projectsResponse.ok) {
                        const data = await projectsResponse.json();
                        if (data?.data?.items) {
                            setAllProjects(data.data.items);
                        }
                    }

                    const stagesResponse = await fetch('/api/stages?limit=all');
                    if (stagesResponse.ok) {
                        const stagesData = await stagesResponse.json();
                    }

                    if (!selectedPipeline && pipelines.length > 0) {
                        setSelectedPipeline(pipelines[0].id);
                    }
                } catch (error) {
                }
            };
            fetchData();
        } else {
            setIsClientSideFiltering(false);

            const params = {};
            if (selectedPipeline) {
                params.pipeline = selectedPipeline;
            }
            if (selectedStage) {
                params.stage = selectedStage;
            }
            setFilterParams(params);
        }
    };

    useEffect(() => {
        if (isClientSideFiltering && allProjects.length > 0) {
            let filtered = [...allProjects];

            if (selectedPipeline) {
                filtered = filtered.filter(project => project.pipeline === selectedPipeline);
            }

            if (viewMode === 'grid') {
                setFilteredProjects({
                    items: filtered,
                    total: filtered.length,
                    currentPage: 1
                });
            } else {
                const paginatedProjects = filtered.slice(0, pageSize);
                setFilteredProjects({
                    items: paginatedProjects,
                    total: filtered.length,
                    currentPage: 1
                });
            }
            setCurrentPage(1);
        }
    }, [selectedPipeline, allProjects, isClientSideFiltering, pageSize, viewMode]);

    const getClientName = useCallback((clientId) => {
        if (!clientId) return null;
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : null;
    }, [clients]);

    const getSourceName = useCallback((sourceId) => {
        if (!sourceId) return null;
        const source = sources.find(s => s.id === sourceId);
        return source ? source.name : null;
    }, [sources]);

    const getStatusName = useCallback((statusId) => {
        if (!statusId) return null;
        return statusMap[statusId] || statusId;
    }, [statusMap]);

    const pipelineMap = useMemo(() => {
        const map = {};
        if (pipelines && pipelines.length > 0) {
            pipelines.forEach(pipeline => {
                map[pipeline.id] = pipeline.name;
            });
        }
        return map;
    }, [pipelines]);

    const stageMap = useMemo(() => {
        const map = {};
        if (stages && stages.length > 0) {
            stages.forEach(stage => {
                map[stage.id] = stage.name;
            });
        }
        return map;
    }, [stages]);

    const clientMap = useMemo(() => {
        const map = {};
        if (clients && clients.length > 0) {
            clients.forEach(client => {
                map[client.id] = client.name;
            });
        }
        return map;
    }, [clients]);

    const sourceMap = useMemo(() => {
        const map = {};
        if (sources && sources.length > 0) {
            sources.forEach(source => {
                map[source.id] = source.name;
            });
        }
        return map;
    }, [sources]);

    const categoryMap = useMemo(() => {
        const map = {};
        if (categories && categories.length > 0) {
            categories.forEach(category => {
                map[category.id] = category.name;
            });
        }
        return map;
    }, [categories]);

    const handleView = (project) => {
        navigate(`/${role}/project/overview/${project.id}`);
    };

    const handleViewCancel = () => {
        setViewModal({ visible: false, data: null });
    };

    const handleSetReminder = (project) => {
        setReminderModal({ visible: true, project });
    };

    const handleReminderSubmit = async (data) => {
        try {
            const project = reminderModal.project;
            const team = teamsData?.data?.items?.find(t => t.id === project.teamId);

            if (!team) {
                message.error('No team assigned to this project');
                return;
            }

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

            // Create reminder for each team member
            for (const memberId of memberIds) {
                try {
                    await createReminder({
                        ...data,
                        assigned_to: memberId
                    });
                } catch (error) {
                    // Failed to create reminder for team member
                }
            }

            message.success('Project reminders set for all team members');
            setReminderModal({ visible: false, project: null });
        } catch (error) {
            message.error('Failed to set reminder');
        }
    };

    const handleReminderCancel = () => {
        setReminderModal({ visible: false, project: null });
    };

    const actions = [
        {
            key: 'view',
            label: 'View',
            icon: <FiEdit size={16} />,
            handler: handleView,
            module: 'project',
            permission: 'read'
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            handler: handleEdit,
            module: 'project',
            permission: 'update'
        },
        {
            key: 'reminder',
            label: 'Set Reminder',
            icon: <BellOutlined />,
            handler: handleSetReminder,
            module: 'project',
            permission: 'update'
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            handler: handleDelete,
            module: 'project',
            permission: 'delete'
        }
    ];

    return (
        <div className="project-module">
            <ModuleLayout
                module="project"
                title="Projects"
                showViewToggle={true}
                viewMode={viewMode}
                onViewModeChange={handleViewChange}
                onAddClick={handleAdd}
                className="project"
                extraHeaderContent={
                    <ModuleFilter
                        key={moduleFilterKey}
                        selectedPipeline={pipelineFilterValue}
                        handlePipelineChange={handlePipelineChange}
                        pipelines={pipelines}
                    />
                }
            >
                {viewMode === 'grid' ? (
                    <CommonKanbanView
                        items={allProjects.length > 0 ? allProjects : (projects.length > 0 ? projects : [])}
                        isLoading={isLoading || isAllProjectsLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pipelines={pipelines}
                        stages={stages.length > 0 ? stages : [
                            {
                                id: 'default-stage',
                                name: 'Default Stage',
                                pipeline: selectedPipeline,
                                type: 'project',
                                order: 0
                            }
                        ]}
                        selectedPipeline={selectedPipeline}
                        moduleType="project"
                        updateItemMutation={useUpdateProjectMutation}
                        updateStageMutation={useUpdateStageMutation}
                        getContactOrClientName={getClientName}
                        getSourceName={getSourceName}
                        getStatusName={getStatusName}
                        navigateUrl={`/${role}/project/overview/`}
                        titleField="projectTitle"
                        valueField="projectValue"
                        contactOrClientField="client"
                        contactOrClientLabel="Client"
                        users={[]}
                        roles={[]}
                        employees={[]}
                    />
                ) : (
                    <div className="project-list">
                        <ProjectList
                            projects={projects}
                            isLoading={isLoading}
                            viewMode={viewMode}
                            currentPage={currentPageFromServer}
                            pageSize={pageSize}
                            total={total}
                            onPageChange={handlePageChange}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={handleView}
                            onBulkDelete={handleBulkDelete}
                            pipelines={pipelines}
                            stages={stages}
                            sources={sources}
                            selectedPipeline={selectedPipeline}
                            actionItems={actions}
                        />
                    </div>
                )}
            </ModuleLayout>

            <Modal
                title={<ModalTitle title={formModal.data && formModal.data.id && !formModal.data._isNewProject ? 'Edit Project' : 'Add Project'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                destroyOnHidden={true}
                destroyOnClose={true}
                className="modal"
                maskClosable={true}
            >
                <ProjectForm
                    key={formKey}
                    initialValues={formModal.data}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    isSubmitting={isCreating || isUpdating}
                    stages={stages}
                />
            </Modal>

            <Modal
                className="delete-modal"
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Project" />}
                open={deleteModal.visible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="Delete"
                okButtonProps={{ danger: true, loading: isDeleting }}
                cancelText="Cancel"
                centered
                maskClosable={false}
            >
                <p>Are you sure you want to delete this project?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                className="delete-modal"
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Projects" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
                okText="Delete All"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
                centered
                maskClosable={false}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected projects?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <ProjectView
                project={viewModal.data}
                pipelineMap={pipelineMap}
                stageMap={stageMap}
                clientMap={clientMap}
                sourceMap={sourceMap}
                categoryMap={categoryMap}
                statusMap={statusMap}
                isLoading={false}
                visible={viewModal.visible}
                onClose={handleViewCancel}
            />

            <ReminderModal
                visible={reminderModal.visible}
                onCancel={handleReminderCancel}
                onSubmit={handleReminderSubmit}
                isSubmitting={isCreatingReminder}
                relatedId={reminderModal.project?.id}
                reminderType="task"
                title="Set Project Reminder"
                taskDueDate={reminderModal.project?.endDate}
                assignedTo={reminderModal.project?.teamId}
                taskName={reminderModal.project?.title}
                taskDescription={`Project End Date: ${reminderModal.project?.endDate ? dayjs(reminderModal.project.endDate).format('DD MMM YYYY') : 'Not set'}`}
            />
        </div>
    );
};

export default Project;
