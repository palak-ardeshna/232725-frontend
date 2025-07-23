import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { RiCalendarLine, RiCalendarEventLine, RiEditLine } from 'react-icons/ri';
import LeaveList from './components/LeaveList';
import LeaveForm from './components/LeaveForm';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import {
    useDeleteLeaveMutation,
    useGetLeavesQuery,
    useCreateLeaveMutation,
    useUpdateLeaveMutation,
    useGetEmployeesQuery
} from '../../../../config/api/apiServices';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../../../../auth/services/authSlice';
import './leave.scss';

const Leave = () => {
    const [viewMode, setViewMode] = useState('list');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const isAdmin = userRole === 'admin';

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

    const { data: leavesData, isLoading: isLoadingLeaves, isFetching, refetch } = useGetLeavesQuery({
        page: pagination.current,
        limit: pagination.pageSize
    }, {
        refetchOnMountOrArgChange: true
    });

    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({
        page: 1,
        limit: 1000
    }, {
        refetchOnMountOrArgChange: true
    });

    const [deleteLeave, { isLoading: isDeleting }] = useDeleteLeaveMutation();
    const [createLeave, { isLoading: isCreating }] = useCreateLeaveMutation();
    const [updateLeave, { isLoading: isUpdating }] = useUpdateLeaveMutation();

    const allLeaves = leavesData?.data?.items || [];
    const employees = employeesData?.data?.items || [];

    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [filteredTotal, setFilteredTotal] = useState(0);

    // Force refetch when component mounts
    useEffect(() => {
        refetch();
    }, [refetch]);

    // Find current employee ID when employees data is loaded or user changes
    useEffect(() => {
        if (!isAdmin && currentUser && employees.length > 0) {
            const foundEmployee = employees.find(emp =>
                emp.user_id === currentUser.id ||
                emp.email === currentUser.email ||
                emp.username === currentUser.username
            );

            if (foundEmployee) {
                setCurrentEmployeeId(foundEmployee.id);
            } else {
                setCurrentEmployeeId(null);
            }
        }
    }, [currentUser, employees, isAdmin]);

    // Filter leaves based on current employee ID
    useEffect(() => {
        if (allLeaves.length > 0) {
            let leaves = [...allLeaves];

            if (!isAdmin && currentEmployeeId) {
                leaves = leaves.filter(leave => leave.employee_id === currentEmployeeId);
            } else if (!isAdmin) {
                // If not admin and no employee ID found, show no leaves
                leaves = [];
            }

            // Sort leaves by start_date in ascending order (earliest date first)
            leaves.sort((a, b) => {
                // Convert dates to timestamp for comparison
                const dateA = new Date(a.start_date).getTime();
                const dateB = new Date(b.start_date).getTime();
                return dateA - dateB; // Ascending order
            });

            setFilteredLeaves(leaves);
            setFilteredTotal(leaves.length);
        } else {
            setFilteredLeaves([]);
            setFilteredTotal(0);
        }
    }, [allLeaves, isAdmin, currentEmployeeId]);

    const getEmployeeName = (employee) => {
        if (employee.first_name || employee.last_name) {
            return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        }

        if (employee.firstName || employee.lastName) {
            return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        }

        return employee.username || employee.email || employee.employee_id || 'Unknown Employee';
    };

    const [employeeMap, setEmployeeMap] = useState({});

    useEffect(() => {
        if (employees && employees.length > 0) {
            const map = {};
            employees.forEach(employee => {
                map[employee.id] = getEmployeeName(employee);
            });
            setEmployeeMap(map);
        }
    }, [employees]);

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (leave) => setFormModal({ visible: true, data: leave });
    const handleDelete = (leave) => setDeleteModal({ visible: true, data: leave });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handlePageChange = (page, pageSize) => {
        setPagination({
            current: page,
            pageSize: pageSize
        });
        refetch();
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateLeave({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Leave request updated successfully');
            } else {
                if (!isAdmin && !values.employee_id && currentEmployeeId) {
                    values.employee_id = currentEmployeeId;
                } else if (!isAdmin && !values.employee_id && currentUser) {
                    const currentEmployee = employees.find(emp =>
                        emp.user_id === currentUser.id ||
                        emp.email === currentUser.email ||
                        emp.username === currentUser.username
                    );

                    if (currentEmployee) {
                        values.employee_id = currentEmployee.id;
                    } else if (currentUser.id) {
                        values.employee_id = currentUser.id;
                        values.user_id = currentUser.id;
                    }
                }

                const leaveData = {
                    ...values,
                    // If admin is creating the leave, set status to approved automatically
                    status: userRole === 'admin' ? 'approved' : (values.status || 'pending'),
                    // If admin is creating the leave, set approved_by and approved_date
                    ...(userRole === 'admin' && {
                        approved_by: currentUser?.id || '',
                        approved_date: new Date().toISOString()
                    })
                };
                await createLeave(leaveData).unwrap();
                message.success('Leave request created successfully');
            }
            setFormModal({ visible: false, data: null });
            // Force refetch to ensure we have the latest data
            setTimeout(() => refetch(), 300);
        } catch (error) {
            if (error.data) {
                const errorMessage = error.data.message?.replace('⚠️ ', '');
                message.error(errorMessage || 'Failed to process leave request');
            } else {
                message.error('An unexpected error occurred');
            }
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteLeave(deleteModal.data.id).unwrap();
            message.success('Leave request deleted successfully');
            setDeleteModal({ visible: false, data: null });
            // Force refetch to ensure we have the latest data
            setTimeout(() => refetch(), 300);
        } catch (error) {
            message.error('Failed to delete leave request');
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
                    await deleteLeave(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete leave with ID ${id}:`, error);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            // Force refetch to ensure we have the latest data
            setTimeout(() => refetch(), 300);

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} leave request${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} leave request${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const getPageTitle = () => {
        if (isAdmin) {
            return "Leave Management";
        } else {
            return "Leave Management";
        }
    };

    return (
        <ModuleLayout
            title={getPageTitle()}
            showViewToggle={false}
            icon={<RiCalendarLine />}
            onAddClick={handleAdd}
            loading={isLoadingLeaves || isFetching}
            addButtonText="New Leave"
            module="leave"
        >
            <LeaveList
                leaves={filteredLeaves}
                loading={isLoadingLeaves || isFetching}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: filteredTotal,
                    onChange: handlePageChange
                }}
                employeeMap={employeeMap}
                viewMode="list"
                isAdmin={isAdmin}
            />

            <Modal
                title={<ModalTitle
                    icon={formModal.data ? <RiEditLine /> : <RiCalendarEventLine />}
                    title={formModal.data ? 'Edit Leave ' : 'New Leave '}
                />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                destroyOnClose
                width={700}
            >
                <LeaveForm
                    key={formKey}
                    initialValues={formModal.data}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    loading={isCreating || isUpdating || isLoadingEmployees}
                    employees={employees}
                    isAdmin={isAdmin}
                    currentUser={currentUser}
                    currentEmployeeId={currentEmployeeId}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Leave" />}
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
                <p>Are you sure you want to delete this leave request?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Leaves" />}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected leave requests?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Leave;