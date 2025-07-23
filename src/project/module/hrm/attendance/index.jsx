import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal, message, Select, Button, DatePicker, Switch, Tooltip } from 'antd';
import { DeleteOutlined, AppstoreOutlined, TableOutlined, PlusOutlined, FilterOutlined, CalendarOutlined } from '@ant-design/icons';
import { RiCalendarEventLine, RiEditLine } from 'react-icons/ri';
import AttendanceList from './components/AttendanceList';
import AttendanceForm from './components/AttendanceForm';
import AttendanceGridView from './components/AttendanceGridView';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import {
    useDeleteAttendanceMutation,
    useGetAttendancesQuery,
    useCreateAttendanceMutation,
    useUpdateAttendanceMutation,
    useGetEmployeesQuery
} from '../../../../config/api/apiServices';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../../../../auth/services/authSlice';
import dayjs from 'dayjs';
import './attendance.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ModuleFilter = ({ selectedMonth, handleMonthChange, selectedDateRange, handleDateRangeChange, isDateRangeMode, toggleDateRangeMode }) => {
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

    const handleCalendarIconClick = (e) => {
        e.stopPropagation();
        toggleDateRangeMode();
        if (!isFilterOpen) {
            setIsFilterOpen(true);
        }
    };

    const months = useMemo(() => {
        return Array.from({ length: 12 }).map((_, index) => {
            const month = dayjs().month(index);
            return {
                key: month.format('YYYY-MM'),
                value: month.format('YYYY-MM'),
                label: month.format('MMMM YYYY')
            };
        });
    }, []);

    return (
        <div className="filter-container">
            <div
                className={`module-filter ${isFilterOpen ? 'open' : ''} ${isDateRangeMode ? 'date-range-mode' : ''}`}
                ref={filterRef}
            >
                {isMobileView && (
                    <div className={`filter-icon ${isFilterOpen ? 'active' : ''}`} onClick={toggleFilter}>
                        <FilterOutlined />
                    </div>
                )}

                <div className="calendar-icon-wrapper" onClick={handleCalendarIconClick}>
                    <CalendarOutlined />
                </div>

                {isDateRangeMode ? (
                    <RangePicker
                        style={{ width: '100%' }}
                        value={selectedDateRange}
                        onChange={handleDateRangeChange}
                        format="DD-MM-YYYY"
                        allowClear={false}
                        onBlur={isMobileView ? closeFilter : undefined}
                        onClick={(e) => isMobileView && e.stopPropagation()}
                    />
                ) : (
                    <Select
                        placeholder="Select Month"
                        style={{ width: '100%' }}
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        allowClear={false}
                        showSearch
                        optionFilterProp="children"
                        onBlur={isMobileView ? closeFilter : undefined}
                        onClick={(e) => isMobileView && e.stopPropagation()}
                        dropdownStyle={{ minWidth: '180px' }}
                    >
                        {months.map(option => (
                            <Option key={option.key} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                )}
            </div>
        </div>
    );
};

const Attendance = () => {
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
    const [selectedDateRange, setSelectedDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
    const [isDateRangeMode, setIsDateRangeMode] = useState(false);

    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const isAdmin = userRole === 'admin';

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

    const queryParams = useMemo(() => {
        const baseParams = {
            page: currentPage,
            limit: pageSize,
        };

        if (!isAdmin && currentEmployeeId) {
            baseParams.employee_id = currentEmployeeId;
        }

        if (isDateRangeMode && selectedDateRange && selectedDateRange.length === 2) {
            return {
                ...baseParams,
                startDate: selectedDateRange[0].format('YYYY-MM-DD'),
                endDate: selectedDateRange[1].format('YYYY-MM-DD')
            };
        } else {
            return {
                ...baseParams,
                month: selectedMonth
            };
        }
    }, [currentPage, pageSize, selectedMonth, isDateRangeMode, selectedDateRange, isAdmin, currentEmployeeId]);

    const { data: attendancesData, isLoading: isLoadingAttendances, isFetching, refetch } = useGetAttendancesQuery(
        queryParams,
        { refetchOnMountOrArgChange: true }
    );

    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({
        page: 1,
        limit: 1000
    }, {
        refetchOnMountOrArgChange: true
    });

    const [deleteAttendance, { isLoading: isDeleting }] = useDeleteAttendanceMutation();
    const [createAttendance, { isLoading: isCreating }] = useCreateAttendanceMutation();
    const [updateAttendance, { isLoading: isUpdating }] = useUpdateAttendanceMutation();

    const attendances = useMemo(() => attendancesData?.data?.items || [], [attendancesData]);
    const total = useMemo(() => attendancesData?.data?.total || 0, [attendancesData]);
    const employees = useMemo(() => employeesData?.data?.items || [], [employeesData]);

    const getEmployeeName = useCallback((employee) => {
        if (employee.first_name || employee.last_name) {
            return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        }

        if (employee.firstName || employee.lastName) {
            return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        }

        return employee.name || employee.email || employee.username || 'Unknown';
    }, []);

    const employeeMap = useMemo(() => {
        const map = {};
        employees.forEach(employee => {
            const name = getEmployeeName(employee);
            if (employee.id) {
                map[employee.id] = employee.username;
            }
        });
        return map;
    }, [employees, getEmployeeName]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    useEffect(() => {
        if (employees.length > 0 && currentUser) {
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
    }, [currentUser, employees]);

    const handleMonthChange = useCallback((value) => {
        setSelectedMonth(value);
        setCurrentPage(1);
    }, []);

    const handleDateRangeChange = useCallback((range) => {
        setSelectedDateRange(range);
        setCurrentPage(1);
    }, []);

    const handleAdd = useCallback(() => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    }, []);

    const handleEdit = useCallback((record) => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: record });
    }, []);

    const handleDelete = useCallback((record) => {
        setDeleteModal({ visible: true, data: record });
    }, []);

    const handleFormCancel = useCallback(() => {
        setFormModal({ visible: false, data: null });
    }, []);

    const handleDeleteCancel = useCallback(() => {
        setDeleteModal({ visible: false, data: null });
    }, []);

    const handleBulkDeleteCancel = useCallback(() => {
        setBulkDeleteModal({ visible: false, ids: [] });
    }, []);

    const handlePageChange = useCallback((page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    }, []);

    const handleViewModeChange = useCallback((mode) => {
        setViewMode(mode);
    }, []);

    const handleFormSubmit = useCallback(async (values, isBulk = false) => {
        try {
            if (formModal.data) {
                await updateAttendance({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Attendance record updated successfully');
            } else {
                if (isBulk && Array.isArray(values)) {
                    let successCount = 0;
                    let errorCount = 0;

                    const loadingMessage = message.loading('Creating attendance records...', 0);

                    for (const record of values) {
                        try {
                            if (!isAdmin && !record.employee_id && currentEmployeeId) {
                                record.employee_id = currentEmployeeId;
                            }

                            if (!record.employee_id) {
                                console.error('Missing employee_id in record:', record);
                                errorCount++;
                                continue;
                            }

                            const dataToSubmit = {
                                ...record,
                                employee_id: String(record.employee_id)
                            };

                            await createAttendance(dataToSubmit).unwrap();
                            successCount++;
                        } catch (error) {
                            errorCount++;
                            const employeeName = record.employee_id ? employeeMap[record.employee_id] || 'Unknown employee' : 'Unknown employee';
                            const errorDate = record.date || 'the selected date';

                            if (error.data && error.data.message && error.data.message.includes("already exists")) {
                                message.error(`Attendance record for ${employeeName} on ${errorDate} already exists.`);
                            } else {
                                console.error('Failed to create attendance record:', error);
                            }
                        }
                    }

                    loadingMessage();

                    if (successCount > 0) {
                        message.success(`Successfully created ${successCount} attendance record(s)`);
                    }

                    if (errorCount > 0) {
                        message.error(`Failed to create ${errorCount} attendance record(s)`);
                    }
                } else {
                    if (!isAdmin && !values.employee_id && currentEmployeeId) {
                        values.employee_id = currentEmployeeId;
                    }

                    if (!values.employee_id) {
                        throw new Error('Employee ID is required');
                    }

                    const dataToSubmit = {
                        ...values,
                        employee_id: String(values.employee_id)
                    };

                    await createAttendance(dataToSubmit).unwrap();
                    message.success('Attendance record created successfully');
                }
            }
            setFormModal({ visible: false, data: null });

            setTimeout(() => refetch(), 300);
        } catch (error) {
            if (error.data && error.data.message) {
                const errorMsg = error.data.message;

                if (errorMsg.includes("already exists")) {
                    const employeeName = values.employee_id ?
                        employeeMap[values.employee_id] || 'selected employee' :
                        'selected employee';
                    const formattedDate = values.date || 'the selected date';

                    message.error(`Attendance record for ${employeeName} on ${formattedDate} already exists.`);
                } else {
                    message.error(errorMsg);
                }
            } else {
                message.error(error.message || 'Failed to save attendance record');
            }
            console.error('Error submitting form:', error);
        }
    }, [formModal, updateAttendance, isAdmin, currentEmployeeId, createAttendance, refetch]);

    const handleDeleteConfirm = useCallback(async () => {
        try {
            await deleteAttendance(deleteModal.data.id).unwrap();
            message.success('Attendance record deleted successfully');
            setDeleteModal({ visible: false, data: null });

            setTimeout(() => refetch(), 300);
        } catch (error) {
            message.error('Failed to delete attendance record');
        }
    }, [deleteAttendance, deleteModal, refetch]);

    const handleBulkDelete = useCallback((selectedIds) => {
        if (selectedIds && selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        if (bulkDeleteModal.ids && bulkDeleteModal.ids.length > 0) {
            const ids = bulkDeleteModal.ids;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteAttendance(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Failed to delete attendance record with ID ${id}`);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });
            setTimeout(() => refetch(), 300);

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} attendance record(s)`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} attendance record(s)`);
            }
        } else {
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    }, [bulkDeleteModal, deleteAttendance, refetch]);

    const getPageTitle = useCallback(() => {
        if (isAdmin) {
            return 'Attendance';
        }
        return 'My Attendance';
    }, [isAdmin]);

    const pagination = useMemo(() => ({
        current: currentPage,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        onChange: handlePageChange
    }), [currentPage, pageSize, total, handlePageChange]);

    const filteredAttendances = useMemo(() => {
        if (isAdmin) {
            return attendances;
        }

        return attendances.filter(attendance =>
            attendance.employee_id &&
            currentEmployeeId &&
            attendance.employee_id.toString() === currentEmployeeId.toString()
        );
    }, [attendances, isAdmin, currentEmployeeId]);

    const renderContent = useCallback(() => {
        if (viewMode === 'grid') {
            return (
                <AttendanceGridView
                    attendanceRecords={filteredAttendances}
                    loading={isLoadingAttendances || isFetching}
                    employeeMap={employeeMap}
                    isAdmin={isAdmin}
                    selectedMonth={selectedMonth}
                    onEdit={isAdmin ? handleEdit : null}
                    onDelete={isAdmin ? handleDelete : null}
                    pagination={pagination}
                />
            );
        }

        return (
            <AttendanceList
                attendanceRecords={filteredAttendances}
                loading={isLoadingAttendances || isFetching}
                onEdit={isAdmin ? handleEdit : null}
                onDelete={isAdmin ? handleDelete : null}
                onBulkDelete={isAdmin ? handleBulkDelete : null}
                pagination={pagination}
                employeeMap={employeeMap}
                viewMode={viewMode}
                isAdmin={isAdmin}
            />
        );
    }, [viewMode, filteredAttendances, isLoadingAttendances, isFetching, employeeMap, isAdmin, pagination, handleEdit, handleDelete, handleBulkDelete, selectedMonth]);

    const toggleDateRangeMode = useCallback(() => {
        setIsDateRangeMode(!isDateRangeMode);
    }, [isDateRangeMode]);

    return (
        <div className="attendance-module">
            <ModuleLayout
                module="attendance"
                title={getPageTitle()}
                showViewToggle={true}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onAddClick={handleAdd}
                addButtonText="Add Attendance"
                showAddButton={isAdmin}
                className="attendance"
                extraHeaderContent={
                    <ModuleFilter
                        selectedMonth={selectedMonth}
                        handleMonthChange={handleMonthChange}
                        selectedDateRange={selectedDateRange}
                        handleDateRangeChange={handleDateRangeChange}
                        isDateRangeMode={isDateRangeMode}
                        toggleDateRangeMode={toggleDateRangeMode}
                    />
                }
            >
                {renderContent()}

                <Modal
                    title={<ModalTitle icon={formModal.data ? <RiEditLine /> : <RiCalendarEventLine />} title={formModal.data ? 'Edit Attendance' : 'Add Attendance'} />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={800}
                    className="modal"
                    maskClosable={true}
                    destroyOnHidden={true}
                >
                    <AttendanceForm
                        key={formKey}
                        initialValues={formModal.data}
                        isAdmin={isAdmin}
                        employees={employees}
                        currentEmployeeId={currentEmployeeId}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        isSubmitting={isCreating || isUpdating}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Attendance" />}
                    open={deleteModal.visible}
                    onCancel={handleDeleteCancel}
                    onOk={handleDeleteConfirm}
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
                    <p>Are you sure you want to delete this attendance record?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Attendance Records" />}
                    open={bulkDeleteModal.visible}
                    onCancel={handleBulkDeleteCancel}
                    onOk={handleBulkDeleteConfirm}
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
                    <p>Are you sure you want to delete {bulkDeleteModal.ids?.length} attendance record(s)?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default Attendance; 