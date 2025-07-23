import React, { useState, useEffect } from 'react';
import { Button, Modal, message } from 'antd';
import { DeleteOutlined, PlusOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import MaintenanceForm from './components/MaintenanceForm';
import MaintenanceList from './components/MaintenanceList';
import MaintenanceView from './components/MaintenanceView';
import { useGetMaintenancesQuery, useCreateMaintenanceMutation, useUpdateMaintenanceMutation, useDeleteMaintenanceMutation } from '../../../../../../config/api/apiServices';
import { useSelector } from 'react-redux';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import './maintenance.scss';

const MaintenanceTab = ({ project }) => {
    const [maintenanceList, setMaintenanceList] = useState([]);
    const [formModal, setFormModal] = useState({ visible: false, type: 'add', initialValues: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, record: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [viewModal, setViewModal] = useState({ visible: false, data: null });
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [updatingMaintenanceId, setUpdatingMaintenanceId] = useState(null);

    const { data: maintenanceData, isLoading: isLoadingMaintenance, refetch } = useGetMaintenancesQuery();

    const [addMaintenance, { isLoading: isAddingMaintenance }] = useCreateMaintenanceMutation();
    const [updateMaintenance, { isLoading: isUpdatingMaintenance }] = useUpdateMaintenanceMutation();
    const [deleteMaintenance, { isLoading: isDeletingMaintenance }] = useDeleteMaintenanceMutation();

    const { currentUser } = useSelector(state => state.auth);

    useEffect(() => {
        if (maintenanceData && project?.id) {
            let maintenanceArray = [];

            if (maintenanceData.data && maintenanceData.data.items) {
                maintenanceArray = maintenanceData.data.items;
            } else if (Array.isArray(maintenanceData)) {
                maintenanceArray = maintenanceData;
            } else if (Array.isArray(maintenanceData.data)) {
                maintenanceArray = maintenanceData.data;
            } else if (maintenanceData.data) {
                maintenanceArray = [maintenanceData.data];
            }

            const projectMaintenance = maintenanceArray.filter(
                item => item.project_id === project.id
            );

            setMaintenanceList(projectMaintenance);
        } else {
            setMaintenanceList([]);
        }
    }, [maintenanceData, project]);

    const handleAddMaintenance = () => {
        setFormModal({
            visible: true,
            type: 'add',
            initialValues: {
                project_id: project?.id,
                status: 'Pending',
                type: 'Preventive',
            }
        });
    };

    const handleEditMaintenance = (record) => {
        setFormModal({
            visible: true,
            type: 'edit',
            initialValues: {
                ...record,
                schedule_date: record.schedule_date ? dayjs(record.schedule_date) : null,
                performed_on: record.performed_on ? dayjs(record.performed_on) : null,
            }
        });
    };

    const handleViewMaintenance = (record) => {
        setViewModal({
            visible: true,
            data: record
        });
    };

    const handleDeleteMaintenance = (record) => {
        setDeleteModal({
            visible: true,
            record
        });
    };

    const closeFormModal = () => {
        setFormModal({ visible: false, type: 'add', initialValues: null });
    };

    const closeViewModal = () => {
        setViewModal({ visible: false, data: null });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ visible: false, record: null });
    };

    const closeBulkDeleteModal = () => {
        setBulkDeleteModal({ visible: false, ids: [] });
    };

    const handleFormSubmit = async (values) => {
        try {
            setLoading(true);
            const payload = {
                ...values,
                schedule_date: values.schedule_date ? values.schedule_date.format() : null,
                performed_on: values.performed_on ? values.performed_on.format() : null,
            };

            if (formModal.type === 'add') {
                await addMaintenance(payload).unwrap();
                message.success('Maintenance added successfully');
            } else {
                setUpdatingMaintenanceId(formModal.initialValues.id);
                await updateMaintenance({
                    id: formModal.initialValues.id,
                    data: payload
                }).unwrap();
                message.success('Maintenance updated successfully');
                setUpdatingMaintenanceId(null);
            }

            closeFormModal();
            refetch();
        } catch (error) {
            message.error(error.data?.message || 'Error processing maintenance');
            setUpdatingMaintenanceId(null);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        try {
            setLoading(true);
            await deleteMaintenance(deleteModal.record.id).unwrap();
            message.success('Maintenance deleted successfully');
            closeDeleteModal();
            refetch();
        } catch (error) {
            message.error(error.data?.message || 'Error deleting maintenance');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = (selectedKeys) => {
        setSelectedIds(selectedKeys);
        if (selectedKeys && selectedKeys.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedKeys });
        }
    };

    const confirmBulkDelete = async () => {
        try {
            setLoading(true);
            const { ids } = bulkDeleteModal;
            if (!ids || ids.length === 0) {
                return;
            }

            const deletePromises = ids.map(id => deleteMaintenance(id).unwrap());
            await Promise.all(deletePromises);
            message.success(`${ids.length} maintenance records deleted successfully`);
            setSelectedIds([]);
            closeBulkDeleteModal();
            refetch();
        } catch (error) {
            message.error('Error deleting some maintenance records');
        } finally {
            setLoading(false);
        }
    };

    if (!project) {
        return <div>Loading project...</div>;
    }

    const isLoading = isLoadingMaintenance || loading;
    const showBulkDeleteButton = selectedIds.length > 0;

    return (
        <div className="maintenance-tab">
            <ModuleLayout
                title="Maintenance Records"
                icon={<ToolOutlined />}
                onAddClick={handleAddMaintenance}
                className="maintenance-module"
                contentClassName="maintenance-content"
                showHeader={true}
                addButtonText="Add Maintenance"
                extraActions={showBulkDeleteButton ? [
                    {
                        key: 'bulk-delete',
                        label: `Delete Selected (${selectedIds.length})`,
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: confirmBulkDelete
                    }
                ] : []}
            >
                {showBulkDeleteButton && (
                    <div className="bulk-actions">
                        <div className="selected-count">
                            {selectedIds.length} maintenance record(s) selected
                        </div>
                        <Button
                            type="primary"
                            danger
                            onClick={() => setBulkDeleteModal({ visible: true, ids: selectedIds })}
                            icon={<DeleteOutlined />}
                            className="bulk-delete-btn"
                        >
                            Delete Selected
                        </Button>
                    </div>
                )}

                <MaintenanceList
                    maintenanceList={maintenanceList}
                    loading={isLoading}
                    onEdit={handleEditMaintenance}
                    onDelete={handleDeleteMaintenance}
                    onBulkDelete={handleBulkDelete}
                    updatingMaintenanceId={updatingMaintenanceId}
                    onView={handleViewMaintenance}
                />

                <Modal
                    title={<ModalTitle icon={<ToolOutlined />} title={formModal.type === 'add' ? 'Add Maintenance' : 'Edit Maintenance'} />}
                    open={formModal.visible}
                    onCancel={closeFormModal}
                    footer={null}
                    destroyOnClose
                    width={600}
                    className="maintenance-form-modal"
                    maskClosable={true}
                >
                    <MaintenanceForm
                        initialValues={formModal.initialValues}
                        onSubmit={handleFormSubmit}
                        onCancel={closeFormModal}
                        isSubmitting={isAddingMaintenance || isUpdatingMaintenance || loading}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Maintenance" />}
                    open={deleteModal.visible}
                    onOk={confirmDelete}
                    onCancel={closeDeleteModal}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{
                        danger: true,
                        loading: isDeletingMaintenance || loading
                    }}
                    className="delete-modal"
                >
                    <p>Are you sure you want to delete this maintenance record?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Maintenance Records" />}
                    open={bulkDeleteModal.visible}
                    onOk={confirmBulkDelete}
                    onCancel={closeBulkDeleteModal}
                    okText="Delete All"
                    cancelText="Cancel"
                    okButtonProps={{
                        danger: true,
                        loading: isDeletingMaintenance || loading
                    }}
                    className="delete-modal"
                >
                    <p>Are you sure you want to delete {bulkDeleteModal.ids?.length} maintenance records?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <MaintenanceView
                    maintenance={viewModal.data}
                    isLoading={false}
                    visible={viewModal.visible}
                    onClose={closeViewModal}
                />
            </ModuleLayout>
        </div>
    );
};

export default MaintenanceTab; 