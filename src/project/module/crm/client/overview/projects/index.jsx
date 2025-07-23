import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, message, Select } from 'antd';
import { FilterOutlined, DeleteOutlined } from '@ant-design/icons';
import ProjectList from '../../../../crm/project/components/ProjectList';
import ProjectForm from '../../../../crm/project/components/ProjectForm';
import {
    useGetProjectsQuery,
    useDeleteProjectMutation,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useGetFiltersQuery,
    useGetStagesQuery,
    useGetPipelinesQuery
} from '../../../../../../config/api/apiServices';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import '../../../project/project.scss';

const { Option } = Select;

const ModuleFilter = ({ selectedCategory, handleCategoryChange, categories }) => {
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
            key: 'category',
            placeholder: 'All Categories',
            value: selectedCategory,
            onChange: (val) => {
                handleCategoryChange(val);
                if (isMobileView) {
                    closeFilter();
                }
            },
            allowClear: false,
            options: categories.map(category => ({
                key: category.id,
                value: category.id,
                label: category.name
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
                        styles={{ popup: { root: { minWidth: '180px' } } }}
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

const ClientProjects = ({ client }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
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

    const { data: filtersResponse } = useGetFiltersQuery({ limit: 'all' });
    const { data: stagesResponse } = useGetStagesQuery({ limit: 'all' });
    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });

    const filters = filtersResponse?.data?.items || [];
    const stages = stagesResponse?.data?.items || [];
    const pipelines = pipelinesResponse?.data?.items || [];
    const categories = filters.filter(filter => filter.type === 'category');
    const sources = filters.filter(filter => filter.type === 'source');

    useEffect(() => {
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0].id);
        }
    }, [categories, selectedCategory]);

    const allProjectsQueryParams = {
        limit: 'all',
        client: client?.id
    };

    const filteredProjectsQueryParams = {
        page: currentPage,
        limit: pageSize,
        client: client?.id,
        ...filterParams
    };

    const { data: allProjectsResponse, isLoading: isAllProjectsLoading } = useGetProjectsQuery(
        allProjectsQueryParams,
        { skip: !isClientSideFiltering || !client?.id }
    );

    const { data: response, isLoading: isFilteredProjectsLoading, error: projectsError } = useGetProjectsQuery(
        filteredProjectsQueryParams,
        { skip: isClientSideFiltering || !client?.id }
    );

    const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
    const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

    const projectsDataRef = useRef({
        allProjects: [],
        filteredProjects: []
    });

    useEffect(() => {
        if (allProjectsResponse?.data?.items) {
            const projectsFromApi = allProjectsResponse.data.items;

            const clientProjects = projectsFromApi.filter(project => project.client === client?.id);

            setAllProjects(clientProjects);
            projectsDataRef.current.allProjects = clientProjects;

            let initialFiltered = [...clientProjects];
            if (selectedCategory && initialFiltered.length > 0) {
                initialFiltered = initialFiltered.filter(project => project.category === selectedCategory);
            }

            setFilteredProjects(initialFiltered);
            projectsDataRef.current.filteredProjects = initialFiltered;
        }
    }, [allProjectsResponse, selectedCategory, client?.id]);

    useEffect(() => {
        const currentProjects = projectsDataRef.current.allProjects;

        if (isClientSideFiltering && currentProjects.length > 0) {
            let filtered = [...currentProjects];

            if (selectedCategory && filtered.length > 0) {
                filtered = filtered.filter(project => project.category === selectedCategory);
            }

            setFilteredProjects(filtered);
            projectsDataRef.current.filteredProjects = filtered;
        }
    }, [selectedCategory, isClientSideFiltering]);

    useEffect(() => {
        if (!isClientSideFiltering) {
            const newParams = {};

            if (selectedCategory) {
                newParams.category = selectedCategory;
            }

            setFilterParams(newParams);
        }
    }, [isClientSideFiltering, selectedCategory]);

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setCurrentPage(1);
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormKey(Date.now());

        setFormModal({
            visible: true,
            data: { client: client?.id }
        });
    };

    const handleEdit = (project) => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: project });
    };

    const handleDelete = (project) => setDeleteModal({ visible: true, data: project });

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };

    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            const projectData = {
                ...values,
                client: client?.id
            };

            if (formModal.data?.id) {
                const result = await updateProject({
                    id: formModal.data.id,
                    data: projectData
                }).unwrap();
                message.success('Project updated successfully');

                if (isClientSideFiltering) {
                    const updatedProjects = allProjects.map(project =>
                        project.id === formModal.data.id ? { ...project, ...projectData } : project
                    );
                    setAllProjects(updatedProjects);
                    projectsDataRef.current.allProjects = updatedProjects;

                    // Also update filteredProjects if it's an array
                    if (Array.isArray(filteredProjects)) {
                        const updatedFilteredProjects = filteredProjects.map(project =>
                            project.id === formModal.data.id ? { ...project, ...projectData } : project
                        );
                        setFilteredProjects(updatedFilteredProjects);
                        projectsDataRef.current.filteredProjects = updatedFilteredProjects;
                    }
                }
            } else {
                const result = await createProject(projectData).unwrap();
                message.success('Project created successfully');

                if (isClientSideFiltering && result?.data) {
                    const newProject = result.data;

                    // Add to allProjects
                    const updatedProjects = [...allProjects, newProject];
                    setAllProjects(updatedProjects);
                    projectsDataRef.current.allProjects = updatedProjects;

                    // Add to filteredProjects if it matches the current category filter or no filter is selected
                    const shouldAddToFiltered = !selectedCategory ||
                        newProject.category === selectedCategory;

                    if (shouldAddToFiltered) {
                        if (Array.isArray(filteredProjects)) {
                            setFilteredProjects([...filteredProjects, newProject]);
                            projectsDataRef.current.filteredProjects = [...filteredProjects, newProject];
                        } else {
                            // Initialize filteredProjects if it's not an array
                            setFilteredProjects([newProject]);
                            projectsDataRef.current.filteredProjects = [newProject];
                        }
                    }
                }
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to save project');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            // First update local state for immediate UI feedback
            const projectId = deleteModal.data.id;
            const updatedAllProjects = allProjects.filter(project => project.id !== projectId);
            const updatedFilteredProjects = Array.isArray(filteredProjects)
                ? filteredProjects.filter(project => project.id !== projectId)
                : [];

            // Update state before API call for immediate UI update
            setAllProjects(updatedAllProjects);
            setFilteredProjects(updatedFilteredProjects);
            projectsDataRef.current.allProjects = updatedAllProjects;
            projectsDataRef.current.filteredProjects = updatedFilteredProjects;

            // Close modal early for better UX
            setDeleteModal({ visible: false, data: null });

            // Then make API call
            await deleteProject(projectId).unwrap();
            message.success('Project deleted successfully');

        } catch (error) {
            // Refresh data if there was an error
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
            // First update local state for immediate UI feedback
            const idsToDelete = [...bulkDeleteModal.ids];
            const updatedAllProjects = allProjects.filter(project => !idsToDelete.includes(project.id));
            const updatedFilteredProjects = Array.isArray(filteredProjects)
                ? filteredProjects.filter(project => !idsToDelete.includes(project.id))
                : [];

            // Update state before API call for immediate UI update
            setAllProjects(updatedAllProjects);
            setFilteredProjects(updatedFilteredProjects);
            projectsDataRef.current.allProjects = updatedAllProjects;
            projectsDataRef.current.filteredProjects = updatedFilteredProjects;

            // Close modal early for better UX
            setBulkDeleteModal({ visible: false, ids: [] });

            // Then make API call
            const deletePromises = idsToDelete.map(id => deleteProject(id).unwrap());
            await Promise.all(deletePromises);
            message.success(`${idsToDelete.length} projects deleted successfully`);

        } catch (error) {
            // Refresh data if there was an error
            message.error('Failed to delete some projects');
        }
    };

    const isLoading = isClientSideFiltering ? isAllProjectsLoading : isFilteredProjectsLoading;

    const projects = useMemo(() => {
        if (isClientSideFiltering) {
            if (Array.isArray(filteredProjects) && filteredProjects.length > 0) {
                return filteredProjects;
            } else if (projectsDataRef.current.filteredProjects && projectsDataRef.current.filteredProjects.length > 0) {
                return projectsDataRef.current.filteredProjects;
            } else {
                // Fallback to all projects if needed
                return allProjects;
            }
        } else {
            const responseProjects = response?.data?.items || [];
            return responseProjects.filter(project => project.client === client?.id);
        }
    }, [isClientSideFiltering, filteredProjects, response, client?.id, allProjects]);

    const total = useMemo(() => {
        if (isClientSideFiltering) {
            return projects.length;
        } else {
            return response?.data?.total || 0;
        }
    }, [isClientSideFiltering, projects, response]);

    const moduleActions = [
        {
            key: 'add',
            label: 'Add Project',
            handler: handleAdd,
            primary: true
        }
    ];

    // Add a key that changes when projects are updated to force re-render
    const projectListKey = useMemo(() => `project-list-${projects.length}-${Date.now()}`, [projects]);

    return (
        <div className="project-module">
            <ModuleLayout
                title={`${client?.name}'s Projects`}
                actions={moduleActions}
                showAddButton={true}
                onAddClick={handleAdd}
                filterComponent={
                    <ModuleFilter
                        selectedCategory={selectedCategory}
                        handleCategoryChange={handleCategoryChange}
                        categories={categories}
                    />
                }
            >
                <ProjectList
                    key={projectListKey}
                    projects={projects}
                    isLoading={isLoading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={handlePageChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                    sources={sources}
                    categories={categories}
                    pipelines={pipelines}
                    stages={stages}
                />
            </ModuleLayout>

            <Modal
                title={<ModalTitle title={formModal.data?.id ? 'Edit Project' : 'Add Project'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                destroyOnHidden={true}
            >
                <ProjectForm
                    key={formKey}
                    initialValues={formModal.data}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    isSubmitting={isCreating || isUpdating}
                    stages={stages}
                    clientId={client?.id}
                    hideClientField={true}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Project" />}
                open={deleteModal.visible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                className="delete-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
            >
                <p>Are you sure you want to delete this project?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Projects" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
                okText="Delete All"
                cancelText="Cancel"
                className="delete-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    danger: true,
                }}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected projects?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export { ClientProjects };
export default ClientProjects;