import React, { useState, useEffect, useRef } from 'react';
import { message, Select } from 'antd';
import { RiFilterLine, RiFilterLine as FilterOutlined } from 'react-icons/ri';
import FilterList from './components/FilterList';
import FilterForm from './components/FilterForm';
import {
    useGetFiltersQuery,
    useDeleteFilterMutation,
    useCreateFilterMutation,
    useUpdateFilterMutation
} from '../../../../../config/api/apiServices';
import { SystemModule } from '../../system';
import './filter.scss';

const { Option } = Select;

const filterTypes = [
    { value: 'tag', label: 'Tag' },
    { value: 'status', label: 'Status' },
    { value: 'label', label: 'Label' },
    { value: 'source', label: 'Source' },
    { value: 'category', label: 'Category' },
];

const TypeFilter = ({ selectedType, handleTypeChange }) => {
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

    return (
        <div className="filter-container">
            <div
                className={`module-filter ${isFilterOpen ? 'open' : ''}`}
                ref={filterRef}
            >
                {isMobileView && (
                    <div
                        className={`filter-icon ${isFilterOpen ? 'active' : ''}`}
                        onClick={toggleFilter}
                    >
                        <FilterOutlined />
                    </div>
                )}
                <Select
                    placeholder="All Types"
                    style={{ width: '100%' }}
                    value={selectedType}
                    onChange={(val) => {
                        handleTypeChange(val);
                        if (isMobileView) {
                            closeFilter();
                        }
                    }}
                    allowClear={false}
                    showSearch
                    optionFilterProp="children"
                    onBlur={isMobileView ? closeFilter : undefined}
                    onClick={(e) => isMobileView && e.stopPropagation()}
                    styles={{ popup: { root: { minWidth: '220px' } } }}
                    popupMatchSelectWidth={false}
                    className="filter-select"
                >
                    <Option value="all">All Types</Option>
                    {filterTypes.map(type => (
                        <Option key={type.value} value={type.value}>{type.label}</Option>
                    ))}
                </Select>
            </div>
        </div>
    );
};

const Filter = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [selectedType, setSelectedType] = useState('all');
    const [filterParams, setFilterParams] = useState({});

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    // Get current logged in user from localStorage
    const [loggedInUser, setLoggedInUser] = useState(null);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setLoggedInUser(user);
            }
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
        }
    }, []);

    const { data: response, isLoading } = useGetFiltersQuery({
        page: currentPage,
        limit: pageSize,
        ...(selectedType !== 'all' ? { type: selectedType } : {})
    });

    const [deleteFilter, { isLoading: isDeleting }] = useDeleteFilterMutation();
    const [createFilter, { isLoading: isCreating }] = useCreateFilterMutation();
    const [updateFilter, { isLoading: isUpdating }] = useUpdateFilterMutation();

    const filters = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const currentPageFromServer = response?.data?.currentPage || 1;

    // Process filters to show username for logged in user
    const filtersWithUsernames = filters.map(filter => {
        let displayName = filter.created_by || 'System';
        
        // If this filter was created by the current logged in user, show their username
        if (loggedInUser && filter.created_by === loggedInUser.id) {
            displayName = loggedInUser.username  || displayName;
        }
        
        return {
            ...filter,
            created_by_display: displayName
        };
    });

    useEffect(() => {
        const params = {};
        if (selectedType !== 'all') {
            params.type = selectedType;
        }
        setFilterParams(params);
        setCurrentPage(1);
    }, [selectedType]);

    const handleTypeChange = (value) => {
        setSelectedType(value);
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
        setFormModal({ visible: true, data: null });
    };
    const handleEdit = (filter) => setFormModal({ visible: true, data: filter });
    const handleDelete = (filter) => setDeleteModal({ visible: true, data: filter });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateFilter({ id: formModal.data.id, data: values }).unwrap();
                message.success('Filter updated successfully');
            } else {
                await createFilter(values).unwrap();
                message.success('Filter created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} filter: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteFilter(deleteModal.data.id).unwrap();
            message.success('Filter deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete filter');
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
                    await deleteFilter(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
                    
            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} filter${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} filter${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <SystemModule
            title="Filters"
            showViewToggle={true}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onAddClick={handleAdd}
            className="filter"
            extraHeaderContent={<TypeFilter selectedType={selectedType} handleTypeChange={handleTypeChange} />}
            formModal={formModal}
            deleteModal={deleteModal}
            bulkDeleteModal={bulkDeleteModal}
            onFormCancel={handleFormCancel}
            onDeleteCancel={handleDeleteCancel}
            onDeleteConfirm={handleDeleteConfirm}
            onBulkDeleteCancel={handleBulkDeleteCancel}
            onBulkDeleteConfirm={handleBulkDeleteConfirm}
            isDeleting={isDeleting}
            formTitle={formModal?.data ? 'Edit Filter' : 'Add Filter'}
            formIcon={<RiFilterLine />}
            deleteTitle="Delete Filter"
            deleteItemName="filter"
            bulkDeleteTitle="Bulk Delete Filters"
            formContent={
                <FilterForm
                    key={formKey}
                    initialValues={formModal?.data ? 
                        {...formModal.data, created_by_display: 
                            (loggedInUser && formModal.data.created_by === loggedInUser.id) ? 
                            (loggedInUser.username  || formModal.data.created_by) : 
                            formModal.data.created_by
                        } : null}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            }
        >
            <FilterList
                filters={filtersWithUsernames}
                isLoading={isLoading}
                viewMode={viewMode}
                currentPage={currentPageFromServer}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
            />
        </SystemModule>
    );
};

export default Filter;