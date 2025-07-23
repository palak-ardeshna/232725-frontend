import React, { useState, useEffect, useCallback } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FiDollarSign, FiPlusCircle, FiMinusCircle, FiActivity } from 'react-icons/fi';
import CostList from './components/CostList';
import CostForm from './components/CostForm';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import { useUpdateProjectMutation } from '../../../../../../config/api/apiServices';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import './additionalCosts.scss';

const AdditionalCostsTab = ({ project, customTitle }) => {
    const [formModal, setFormModal] = useState({ visible: false, data: null, originalCost: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [additionalCosts, setAdditionalCosts] = useState([]);
    const [localUpdating, setLocalUpdating] = useState(false);

    const { currentUser } = useSelector(state => state.auth);
    const userId = currentUser?.id;

    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

    const [updatingCostId, setUpdatingCostId] = useState(null);

    const processCosts = useCallback((rawCosts) => {
        if (rawCosts === undefined || rawCosts === null) {
            return [];
        }

        if (typeof rawCosts === 'string') {
            try {
                rawCosts = JSON.parse(rawCosts);
            } catch (e) {
                return [];
            }
        }

        if (!Array.isArray(rawCosts)) {
            return [];
        }

        const processedCosts = rawCosts.map(cost => {
            let dateValue = cost.date;
            if (dayjs.isDayjs(dateValue)) {
                dateValue = dateValue.format();
            } else if (dateValue) {
                try {
                    dateValue = dayjs(dateValue).format();
                } catch (e) {
                    dateValue = dayjs().format();
                }
            } else {
                dateValue = dayjs().format();
            }

            return {
                ...cost,
                amount: typeof cost.amount === 'string' ? parseFloat(cost.amount) : cost.amount,
                includeInTotal: cost.includeInTotal === undefined ? true : Boolean(cost.includeInTotal),
                date: dateValue
            };
        });

        return processedCosts;
    }, []);

    useEffect(() => {
        if (project && !localUpdating) {
            const costs = processCosts(project.additionalCosts);
            setAdditionalCosts(costs);
        }
    }, [project, processCosts, localUpdating]);

    const handleAdd = () => setFormModal({ visible: true, data: null, originalCost: null });

    const handleEdit = (cost) => {
        try {
            const originalCost = { ...cost };

            const costCopy = JSON.parse(JSON.stringify(cost));

            if (costCopy.date) {
                const dateObj = dayjs(costCopy.date);
                if (dateObj.isValid()) {
                    costCopy.date = dateObj;
                } else {
                    costCopy.date = dayjs();
                }
            } else {
                costCopy.date = dayjs();
            }

            costCopy.amount = parseFloat(costCopy.amount) || 0;
            costCopy.includeInTotal = Boolean(costCopy.includeInTotal);

            setFormModal({ visible: true, data: costCopy, originalCost });
        } catch (error) {
            message.error('Could not edit this cost. Please try again.');
        }
    };

    const handleDelete = (cost) => setDeleteModal({ visible: true, data: cost });

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleFormCancel = () => setFormModal({ visible: false, data: null, originalCost: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const calculateProjectValue = (costs) => {
        const includedCosts = costs.filter(cost => cost.includeInTotal);
        const totalIncludedCosts = includedCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

        let baseValue = project?.projectValue || 0;

        if (project?.additionalCosts) {
            try {
                let existingCosts = project.additionalCosts;
                if (typeof existingCosts === 'string') {
                    existingCosts = JSON.parse(existingCosts);
                }

                if (Array.isArray(existingCosts)) {
                    const existingIncludedCosts = existingCosts.filter(cost => cost.includeInTotal);
                    const existingTotalIncluded = existingIncludedCosts.reduce(
                        (sum, cost) => sum + (parseFloat(cost.amount) || 0),
                        0
                    );

                    baseValue = project.projectValue - existingTotalIncluded;
                }
            } catch (e) {
            }
        }

        const newProjectValue = baseValue + totalIncludedCosts;

        return { baseValue, newProjectValue };
    };

    const handleFormSubmit = async (values) => {
        try {
            const formattedValues = {
                name: values.name,
                amount: parseFloat(values.amount) || 0,
                date: values.date instanceof dayjs ? values.date.format() : values.date,
                description: values.description || '',
                includeInTotal: typeof values.includeInTotal === 'boolean' ? values.includeInTotal : true
            };

            let updatedCosts = [...additionalCosts];
            let isEdit = false;

            if (formModal.data) {
                isEdit = true;
                if (formModal.originalCost) {
                    const index = additionalCosts.findIndex(c =>
                        c.name === formModal.originalCost.name &&
                        c.date === formModal.originalCost.date &&
                        c.amount === formModal.originalCost.amount
                    );

                    if (index !== -1) {
                        updatedCosts[index] = formattedValues;
                    } else {
                        const fallbackIndex = additionalCosts.findIndex(c =>
                            c.name === formModal.data.name &&
                            (c.date === formModal.data.date ||
                                (formModal.data.date instanceof dayjs && c.date === formModal.data.date.format())) &&
                            c.amount === formModal.data.amount
                        );

                        if (fallbackIndex !== -1) {
                            updatedCosts[fallbackIndex] = formattedValues;
                        } else {
                            updatedCosts.push(formattedValues);
                        }
                    }
                } else {
                    const index = additionalCosts.findIndex(c =>
                        c.name === formModal.data.name &&
                        (c.date === formModal.data.date ||
                            (formModal.data.date instanceof dayjs && c.date === formModal.data.date.format())) &&
                        c.amount === formModal.data.amount
                    );

                    if (index !== -1) {
                        updatedCosts[index] = formattedValues;
                    } else {
                        updatedCosts.push(formattedValues);
                    }
                }
            } else {
                updatedCosts.push(formattedValues);
            }

            const { newProjectValue } = calculateProjectValue(updatedCosts);

            setLocalUpdating(true);

            try {
                setAdditionalCosts(updatedCosts);

                await updateProject({
                    id: project.id,
                    data: {
                        additionalCosts: updatedCosts,
                        projectValue: newProjectValue
                    }
                }).unwrap();

                message.success(isEdit ? 'Cost updated successfully' : 'Cost added successfully');
                handleFormCancel();
            } catch (error) {
                message.error(error.data?.message || 'Failed to save cost');

                if (project && project.additionalCosts) {
                    const revertedCosts = processCosts(project.additionalCosts);
                    setAdditionalCosts(revertedCosts);
                }
            } finally {
                setLocalUpdating(false);
            }
        } catch (error) {
            message.error('Failed to process cost data');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            // First update local state for instant feedback
            const updatedCosts = additionalCosts.filter(c =>
                !(c.name === deleteModal.data.name &&
                    c.date === deleteModal.data.date &&
                    c.amount === deleteModal.data.amount)
            );

            const { newProjectValue } = calculateProjectValue(updatedCosts);

            setLocalUpdating(true);

            try {
                setAdditionalCosts(updatedCosts);

                await updateProject({
                    id: project.id,
                    data: {
                        additionalCosts: updatedCosts,
                        projectValue: newProjectValue
                    }
                }).unwrap();

                message.success('Cost deleted successfully');
                handleDeleteCancel();
            } catch (error) {
                message.error(error.data?.message || 'Failed to delete cost');

                if (project && project.additionalCosts) {
                    const revertedCosts = processCosts(project.additionalCosts);
                    setAdditionalCosts(revertedCosts);
                }
            } finally {
                setLocalUpdating(false);
            }
        } catch (error) {
            message.error('Failed to delete cost');
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            if (!ids || ids.length === 0) {
                return;
            }

            const updatedCosts = additionalCosts.filter(cost => !ids.includes(cost.id));

            const { newProjectValue } = calculateProjectValue(updatedCosts);

            setLocalUpdating(true);

            try {
                setAdditionalCosts(updatedCosts);

                await updateProject({
                    id: project.id,
                    data: {
                        additionalCosts: updatedCosts,
                        projectValue: newProjectValue
                    }
                }).unwrap();

                message.success(`${ids.length} costs deleted successfully`);
                handleBulkDeleteCancel();
            } catch (error) {
                message.error(error.data?.message || 'Failed to delete costs');

                if (project && project.additionalCosts) {
                    const revertedCosts = processCosts(project.additionalCosts);
                    setAdditionalCosts(revertedCosts);
                }
            } finally {
                setLocalUpdating(false);
            }
        } catch (error) {
            message.error('Failed to delete costs');
        }
    };

    const handleRemoveAll = async () => {
        try {
            const baseValue = project?.projectValue || 0;
            let newProjectValue = baseValue;

            if (project?.additionalCosts) {
                try {
                    let existingCosts = project.additionalCosts;
                    if (typeof existingCosts === 'string') {
                        existingCosts = JSON.parse(existingCosts);
                    }

                    if (Array.isArray(existingCosts)) {
                        const existingIncludedCosts = existingCosts.filter(cost => cost.includeInTotal);
                        const existingTotalIncluded = existingIncludedCosts.reduce(
                            (sum, cost) => sum + (parseFloat(cost.amount) || 0),
                            0
                        );

                        newProjectValue = baseValue - existingTotalIncluded;
                    }
                } catch (e) {
                }
            }

            setLocalUpdating(true);

            try {
                setAdditionalCosts([]);

                await updateProject({
                    id: project.id,
                    data: {
                        additionalCosts: [],
                        projectValue: newProjectValue
                    }
                }).unwrap();

                message.success('All costs removed successfully');
            } catch (error) {
                message.error(error.data?.message || 'Failed to remove all costs');

                if (project && project.additionalCosts) {
                    const revertedCosts = processCosts(project.additionalCosts);
                    setAdditionalCosts(revertedCosts);
                }
            } finally {
                setLocalUpdating(false);
            }
        } catch (error) {
            message.error('Failed to remove all costs');
        }
    };

    const handleCostUpdate = async (updatedCosts, changedCost) => {
        try {
            if (changedCost) {
                const costId = `${changedCost.name}-${changedCost.date}-${changedCost.amount}`;
                setUpdatingCostId(costId);
            }

            setAdditionalCosts(updatedCosts);

            const { newProjectValue } = calculateProjectValue(updatedCosts);

            const result = await updateProject({
                id: project.id,
                data: {
                    additionalCosts: updatedCosts,
                    projectValue: newProjectValue
                }
            }).unwrap();

            if (!result) {
                throw new Error('Update failed');
            }
        } catch (error) {
            message.error('Failed to update cost status');
            if (project && project.additionalCosts) {
                const revertedCosts = processCosts(project.additionalCosts);
                setAdditionalCosts(revertedCosts);
            }
        } finally {
            setUpdatingCostId(null);
        }
    };

    const includedCosts = additionalCosts.filter(cost => cost.includeInTotal);
    const notIncludedCosts = additionalCosts.filter(cost => !cost.includeInTotal);

    const totalIncludedCosts = includedCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const totalNotIncludedCosts = notIncludedCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

    const baseProjectValue = (project?.projectValue || 0) - totalIncludedCosts;
    const totalProjectValue = baseProjectValue + totalIncludedCosts;

    const isLoading = isUpdating && localUpdating;
    const showRemoveAllButton = additionalCosts.length > 1;
    const addButtonText = 'Add Cost';
    const modalTitle = formModal.data ? 'Update Additional Cost' : 'Add Additional Cost';

    const moduleTitle = customTitle || 'Additional Costs';

    if (!project) {
        return <div className="loading-state">Loading project data...</div>;
    }

    let displayCosts = [...additionalCosts];
    if (displayCosts.length === 0 && project?.additionalCosts) {
        try {
            const directParsed = typeof project.additionalCosts === 'string'
                ? JSON.parse(project.additionalCosts)
                : project.additionalCosts;

            if (Array.isArray(directParsed) && directParsed.length > 0) {
                displayCosts = directParsed.map(cost => ({
                    ...cost,
                    amount: typeof cost.amount === 'string' ? parseFloat(cost.amount) : cost.amount,
                    includeInTotal: cost.includeInTotal === undefined ? true : Boolean(cost.includeInTotal),
                    date: cost.date || dayjs().format()
                }));
            }
        } catch (e) { }
    }

    return (
        <div className="project-additional-costs-tab">
            <ModuleLayout
                module="additionalCosts"
                title={moduleTitle}
                icon={<FiDollarSign />}
                onAddClick={handleAdd}
                className="additional-costs"
                contentClassName="costs-content"
                showHeader={true}
                addButtonText={addButtonText}
                extraActions={showRemoveAllButton ? [
                    {
                        key: 'remove-all',
                        label: 'Delete All',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: handleRemoveAll
                    }
                ] : []}
            >
                <div className="cost-summary">
                    <div className="summary-item base-value">
                        <div className="label">
                            <FiDollarSign />
                            Base Project Value:
                        </div>
                        <div className="value">₹ {parseFloat(baseProjectValue).toLocaleString()}</div>
                    </div>
                    <div className="summary-item included">
                        <div className="label">
                            <FiPlusCircle />
                            Included Costs:
                        </div>
                        <div className="value">₹ {totalIncludedCosts.toLocaleString()}</div>
                    </div>
                    <div className="summary-item not-included">
                        <div className="label">
                            <FiMinusCircle />
                            Not Included Costs:
                        </div>
                        <div className="value">₹ {totalNotIncludedCosts.toLocaleString()}</div>
                    </div>
                    <div className="summary-item total">
                        <div className="label">
                            <FiActivity />
                            Total Project Value:
                        </div>
                        <div className="value">₹ {totalProjectValue.toLocaleString()}</div>
                    </div>
                </div>

                <CostList
                    costs={displayCosts}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                    projectId={project.id}
                    onCostUpdate={handleCostUpdate}
                    project={project}
                    updatingCostId={updatingCostId}
                />

                <Modal
                    title={<ModalTitle icon={<FiDollarSign />} title={modalTitle} />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={600}
                    className="cost-form-modal"
                    maskClosable={true}
                    destroyOnClose={true}
                >
                    <CostForm
                        isSubmitting={isLoading}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        initialValues={formModal.data}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Cost" />}
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
                        loading: isLoading
                    }}
                >
                    <p>Are you sure you want to delete this cost?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Costs" />}
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
                        loading: isLoading
                    }}
                >
                    <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected costs?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default AdditionalCostsTab;