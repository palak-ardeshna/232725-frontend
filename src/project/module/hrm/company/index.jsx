import React, { useState, useEffect } from 'react';
import { Modal, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiBuildingLine } from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import CompanyList from './components/CompanyList';
import CompanyForm from './components/CompanyForm';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import { companyApi, inquiryApi } from '../../../../config/api/apiServices';
import './company.scss';

const Company = () => {
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());
    const [inquiryData, setInquiryData] = useState(null);

    const { data: response, isLoading, refetch } = companyApi.useGetAllQuery({
        page: currentPage,
        limit: pageSize,
    });

    const [deleteCompany, { isLoading: isDeleting }] = companyApi.useDeleteMutation();
    const [createCompany, { isLoading: isCreating }] = companyApi.useCreateMutation();
    const [updateCompany, { isLoading: isUpdating }] = companyApi.useUpdateMutation();
    const [deleteInquiry] = inquiryApi.useDeleteMutation();

    const companies = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const currentPageFromServer = response?.data?.currentPage || 1;

    // Check if we're coming from inquiry conversion
    useEffect(() => {
        const storedData = localStorage.getItem('convert_inquiry_to_company');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                setInquiryData(data);
                // Clear the stored data immediately to prevent reuse
                localStorage.removeItem('convert_inquiry_to_company');
                
                // Open the form modal with the inquiry data
                setFormModal({ visible: true, data: null, inquiryData: data });
            } catch (error) {
                console.error('Error parsing inquiry data:', error);
            }
        }
        
        // If we're coming from the inquiry page with state
        if (location.state?.openAddModal && location.state?.fromInquiry) {
            setFormModal({ visible: true, data: null });
        }
    }, [location]);

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (company) => {
        console.log('Editing company:', company);
        // Force a new form key to ensure the form is re-rendered with fresh data
        setFormKey(Date.now());
        setFormModal({ visible: true, data: company });
    };
    
    const handleDelete = (company) => setDeleteModal({ visible: true, data: company });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                console.log('Updating company with values:', values);
                
                // If values is FormData, make sure we're appending the ID
                if (values instanceof FormData) {
                    // No need to append ID as it's passed separately in the API call
                } else {
                    // If it's a plain object, make sure it has the ID
                    values.id = formModal.data.id;
                }
                
                await updateCompany({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Company updated successfully');
            } else {
                console.log('Creating new company with values:', values);
                const result = await createCompany(values).unwrap();
                message.success('Company created successfully');
                
                // If this was converted from an inquiry, delete the original inquiry
                const sourceInquiryId = formModal.inquiryData?.source_inquiry_id || 
                                        inquiryData?.source_inquiry_id;
                
                if (sourceInquiryId) {
                    try {
                        await deleteInquiry(sourceInquiryId).unwrap();
                        message.success('Original inquiry has been converted and removed');
                    } catch (error) {
                        message.warning('Company created but failed to remove original inquiry');
                    }
                }
            }
            setFormModal({ visible: false, data: null });
            setInquiryData(null);
            refetch();
        } catch (error) {
            console.error('Form submission error:', error);
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} company: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteCompany(deleteModal.data.id).unwrap();
            message.success('Company deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error('Failed to delete company');
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
                    await deleteCompany(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete company with ID ${id}:`, error);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            refetch();

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} ${successCount > 1 ? 'companies' : 'company'}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} ${errorCount > 1 ? 'companies' : 'company'}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    return (
        <ModuleLayout
            module="company"
            title="Companies"
            onAddClick={handleAdd}
            className="company"
        >
            <CompanyList
                companies={companies}
                isLoading={isLoading}
                currentPage={currentPageFromServer}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                refetchCompanies={refetch}
            />

            <Modal
                title={<ModalTitle icon={RiBuildingLine} title={formModal.data ? 'Edit Company' : (inquiryData ? 'Convert to Company' : 'Add Company')} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <CompanyForm
                    key={formKey}
                    initialValues={formModal.data || inquiryData}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    isConversion={!!inquiryData}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Company" />}
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
                <p>Are you sure you want to delete company "
                    {deleteModal.data?.name && (
                        <Tooltip title={deleteModal.data.name}>
                            <span>
                                {deleteModal.data.name.length > 30 
                                    ? `${deleteModal.data.name.substring(0, 30)}...` 
                                    : deleteModal.data.name}
                            </span>
                        </Tooltip>
                    )}"?
                </p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Companies" />}
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
                    loading: isDeleting
                }}
            >
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected companies?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Company; 