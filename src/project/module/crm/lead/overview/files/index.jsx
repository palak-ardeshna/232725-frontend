import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { FiFile } from 'react-icons/fi';
import { useUpdateLeadMutation, useGetLeadQuery } from '../../../../../../config/api/apiServices';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import FilesList from './components/FilesList';
import FileUploadForm from './components/FileUploadForm';
import FileFilter from './components/FileFilter';
import './files.scss';

const FilesTab = ({ lead }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [files, setFiles] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [uploadModal, setUploadModal] = useState({ visible: false });
    const [viewMode, setViewMode] = useState('list');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
    const { data: leadData, isLoading: isLoadingLead, refetch } = useGetLeadQuery(lead?.id, {
        skip: !lead?.id,
        refetchOnMountOrArgChange: true
    });

    useEffect(() => {
        if (lead?.id) {
            refetch();
        }
    }, [lead?.id, refetch]);

    useEffect(() => {
        let leadFiles = [];
        const leadFilesData = leadData?.data?.files || lead?.files;

        if (leadFilesData) {
            if (typeof leadFilesData === 'string') {
                try {
                    leadFiles = JSON.parse(leadFilesData);
                } catch (e) {
                    console.error('Error parsing files:', e);
                    leadFiles = [];
                }
            }
            else if (Array.isArray(leadFilesData)) {
                leadFiles = leadFilesData;
            }
        }

        setFiles(Array.isArray(leadFiles) ? leadFiles : []);
    }, [leadData, lead]);

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleAdd = () => setUploadModal({ visible: true });
    const handleDelete = (file) => {
        setDeleteModal({ visible: true, data: file });
    };
    const handleUploadCancel = () => setUploadModal({ visible: false });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleViewModeChange = (mode) => setViewMode(mode);
    const handleCategoryChange = (category) => setSelectedCategory(category);

    const handleUpload = async (formData) => {
        try {
            await updateLead({
                id: lead.id,
                data: formData
            }).unwrap();

            message.success('File(s) uploaded successfully');
            setUploadModal({ visible: false });
            refetch();
        } catch (error) {
            message.error(`Failed to upload file: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!deleteModal.data || !deleteModal.data.file_url) {
                message.error('No file URL provided for deletion');
                return;
            }

            const formData = new FormData();
            formData.append('deleteFileUrl', deleteModal.data.file_url);

            await updateLead({
                id: lead.id,
                data: formData
            }).unwrap();

            message.success('File deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error(`Failed to delete file: ${error.data?.message || error.message}`);
        }
    };

    const handleRemoveAll = async () => {
        try {
            Modal.confirm({
                title: 'Delete All Files',
                content: 'Are you sure you want to delete all files from this lead? This action cannot be undone.',
                okText: 'Delete All',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                    try {
                        for (const file of files) {
                            const formData = new FormData();
                            formData.append('deleteFileUrl', file.file_url);

                            await updateLead({
                                id: lead.id,
                                data: formData
                            }).unwrap();
                        }

                        message.success('All files deleted successfully');
                        refetch();
                    } catch (error) {
                        message.error('Failed to delete all files');
                    }
                }
            });
        } catch (error) {
            message.error('Failed to delete files');
        }
    };

    const isLoading = lead?.id ? isLoadingLead : false;
    const showRemoveAllButton = files.length > 1;

    // Pagination logic
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const filteredFiles = selectedCategory
        ? files.filter(file => file.category === selectedCategory)
        : files;
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);
    const total = filteredFiles.length;

    return (
        <div className="lead-files-tab">
            <ModuleLayout
                title="Lead Files"
                icon={<FiFile />}
                onAddClick={handleAdd}
                className="files"
                contentClassName="files-content"
                showHeader={false}
                addButtonText="Upload Files"
                showViewToggle={true}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                extraHeaderContent={<FileFilter
                    selectedCategory={selectedCategory}
                    handleCategoryChange={handleCategoryChange}
                />}
                extraActions={showRemoveAllButton ? [
                    {
                        key: 'remove-all',
                        label: 'Delete All',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: handleRemoveAll
                    }
                ] : []}
                module="files"
            >
                <FilesList
                    files={viewMode === 'grid' ? filteredFiles : paginatedFiles}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    viewMode={viewMode}
                    filterType={selectedCategory}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={handlePageChange}
                />

                <Modal
                    title={<ModalTitle icon={<UploadOutlined />} title="Upload Files" />}
                    open={uploadModal.visible}
                    onCancel={handleUploadCancel}
                    footer={null}
                    width={600}
                    className="file-upload-modal"
                    maskClosable={true}
                    destroyOnHidden={true}
                >
                    <FileUploadForm
                        onSubmit={handleUpload}
                        onCancel={handleUploadCancel}
                        isSubmitting={isUpdating}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete File" />}
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
                        loading: isUpdating
                    }}
                >
                    <p>Are you sure you want to delete this file?</p>
                    <p className="file-name-to-delete">{deleteModal.data?.file_name}</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default FilesTab; 