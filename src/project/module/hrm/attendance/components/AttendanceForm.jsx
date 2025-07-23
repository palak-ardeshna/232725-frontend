import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Space, Switch, TimePicker, Row, Col, Checkbox, Alert, message, Modal, Tag, Badge } from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useSelector } from 'react-redux';
import { PlusOutlined, UserOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import { selectCurrentUser, selectUserRole } from '../../../../../auth/services/authSlice';
import { ModalTitle } from '../../../../../components/AdvancedForm';
import EmployeeForm from '../../employee/components/EmployeeForm';
import {
    useGetRolesQuery,
    useCreateEmployeeMutation,
    useDeleteEmployeeMutation,
    departmentApi,
    designationApi
} from '../../../../../config/api/apiServices';

dayjs.extend(isSameOrBefore);

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const statusOptions = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
];

const AttendanceForm = ({ initialValues, isSubmitting, onSubmit, onCancel, employees = [], isAdmin, currentEmployeeId }) => {
    const [form] = Form.useForm();
    const currentUser = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const [selectedStatus, setSelectedStatus] = useState(initialValues?.status || 'present');
    const [isMultipleDates, setIsMultipleDates] = useState(false);
    const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().add(7, 'days').endOf('day')]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [createEmployee, { isLoading: isCreatingEmployee }] = useCreateEmployeeMutation();
    const [deleteEmployee, { isLoading: isDeleteEmployee }] = useDeleteEmployeeMutation();

    const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({
        limit: 'all'
    });

    const { data: departmentsData, isLoading: isLoadingDepartments } = departmentApi.useGetAllQuery();

    const { data: designationsData, isLoading: isLoadingDesignations } = designationApi.useGetAllQuery();

    useEffect(() => {
        if (!initialValues) {
            if (!isAdmin) {
                if (currentEmployeeId) {
                    const currentEmployeeInfo = employees.find(emp => emp.id === currentEmployeeId);
                    if (currentEmployeeInfo) {
                        form.setFieldsValue({
                            employee_id: [currentEmployeeId],
                            createdBy: getEmployeeName(currentEmployeeInfo)
                        });
                        setSelectedEmployees([currentEmployeeId]);
                    }
                }
                else if (currentUser && currentUser.id) {
                    const currentEmployeeInfo = employees.find(emp =>
                        emp.user_id === currentUser.id ||
                        emp.email === currentUser.email ||
                        emp.username === currentUser.username
                    );

                    const employeeId = currentEmployeeInfo?.id || currentUser.id;
                    form.setFieldsValue({
                        employee_id: [employeeId],
                        createdBy: currentEmployeeInfo ?
                            getEmployeeName(currentEmployeeInfo) :
                            `${currentUser.username || currentUser.firstName || currentUser.email || currentUser.id}`
                    });
                    setSelectedEmployees([employeeId]);
                }
            }
        } else if (initialValues.employee_id) {
            setSelectedEmployees(Array.isArray(initialValues.employee_id)
                ? initialValues.employee_id
                : [initialValues.employee_id]);
        }
    }, [currentUser, form, initialValues, isAdmin, employees, currentEmployeeId]);

    const getEmployeeName = (employee) => {
        if (employee.first_name || employee.last_name) {
            return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        }

        if (employee.firstName || employee.lastName) {
            return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        }

        return employee.username || employee.email || employee.employee_id || 'Unknown Employee';
    };

    const prepareInitialValues = () => {
        if (!initialValues) {
            return {
                employee_id: isAdmin ? [] : (currentEmployeeId ? [currentEmployeeId] : (currentUser?.id ? [currentUser.id] : [])),
                date: dayjs(),
                check_in: null,
                check_out: null,
                status: 'present'
            };
        }

        return {
            ...initialValues,
            employee_id: isAdmin
                ? (Array.isArray(initialValues.employee_id)
                    ? initialValues.employee_id
                    : [initialValues.employee_id])
                : (currentEmployeeId ? [currentEmployeeId] : (initialValues.employee_id ? [initialValues.employee_id] : [])),
            date: initialValues.date ? dayjs(initialValues.date) : null,
            check_in: initialValues.check_in ? dayjs(`2000-01-01T${initialValues.check_in}`) : null,
            check_out: initialValues.check_out ? dayjs(`2000-01-01T${initialValues.check_out}`) : null
        };
    };

    const handleFinish = (values) => {
        try {
            const processedValues = { ...values };

            // Validate check-in and check-out times
            if (processedValues.check_in && processedValues.check_out) {
                const checkIn = dayjs(processedValues.check_in);
                const checkOut = dayjs(processedValues.check_out);

                if (checkIn.isSame(checkOut)) {
                    message.error('Check-in time and check-out time cannot be the same');
                    return;
                }

                if (checkOut.isBefore(checkIn)) {
                    message.error('Check-out time cannot be before check-in time');
                    return;
                }
            }

            if (!Array.isArray(processedValues.employee_id) || processedValues.employee_id.length === 0) {
                message.error('Please select at least one employee');
                return;
            }

            const selectedEmployeeIds = processedValues.employee_id.map(id => String(id));
            const allRecords = [];

            // If this is a new record (not editing), set status to 'present' by default
            if (!initialValues) {
                processedValues.status = 'present';
            }

            if (isMultipleDates && dateRange && dateRange.length === 2) {
                const startDate = dateRange[0];
                const endDate = dateRange[1];

                if (!startDate || !endDate) {
                    message.error('Please select a valid date range');
                    return;
                }

                if (!startDate || !endDate || !dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
                    message.error('Please select a valid date range');
                    return;
                }

                const daysDiff = endDate.diff(startDate, 'day');
                if (daysDiff > 31) {
                    message.error('Date range is too large (maximum 31 days)');
                    return;
                }

                // Loop through each employee
                for (const employeeId of selectedEmployeeIds) {
                    let currentDate = startDate.clone();
                    let dayCount = 0;
                    const maxDays = 100;

                    // Loop through each date
                    while (currentDate.isSameOrBefore(endDate, 'day') && dayCount < maxDays) {
                        const recordData = {
                            ...processedValues,
                            employee_id: employeeId,
                            date: currentDate.format('YYYY-MM-DD'),
                            check_in: processedValues.check_in ? processedValues.check_in.format('HH:mm:00') : null,
                            check_out: processedValues.check_out ? processedValues.check_out.format('HH:mm:00') : null
                        };

                        // Remove the employee_id array
                        delete recordData.employee_ids;

                        allRecords.push(recordData);
                        currentDate = dayjs(currentDate).add(1, 'day');
                        dayCount++;
                    }
                }

                if (allRecords.length === 1) {
                    // If there's only one record, submit it directly
                    onSubmit(allRecords[0], false);
                } else {
                    // Submit multiple records
                    onSubmit(allRecords, true);
                }
            } else {
                // Single date, multiple employees
                const formattedRecords = selectedEmployeeIds.map(employeeId => {
                    const recordData = {
                        ...processedValues,
                        employee_id: employeeId,
                        date: processedValues.date.format('YYYY-MM-DD'),
                        check_in: processedValues.check_in ? processedValues.check_in.format('HH:mm:00') : null,
                        check_out: processedValues.check_out ? processedValues.check_out.format('HH:mm:00') : null
                    };

                    // Remove the employee_id array
                    delete recordData.employee_ids;

                    return recordData;
                });

                if (formattedRecords.length === 1) {
                    // If there's only one record, submit it directly
                    onSubmit(formattedRecords[0], false);
                } else {
                    // Submit multiple records
                    onSubmit(formattedRecords, true);
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            message.error('An error occurred while submitting the form. Please try again.');
        }
    };

    const handleStatusChange = (value) => {
        setSelectedStatus(value);

        if (value === 'absent' || value === 'leave') {
            form.setFieldsValue({
                check_in: null,
                check_out: null
            });
        }
    };

    const handleEmployeeChange = (employeeIds) => {
        setSelectedEmployees(employeeIds);
    };

    const handleAddEmployee = () => {
        setUserModalVisible(true);
        setEmployeeDropdownOpen(false);
    };

    const handleUserCancel = () => {
        setUserModalVisible(false);
    };

    const handleUserSubmit = async (values) => {
        try {
            const result = await createEmployee(values).unwrap();
            message.success('Employee added successfully');
            setUserModalVisible(false);
            handleDone();
        } catch (error) {
            message.error(`Failed to add employee: ${error.data?.message || error.message}`);
        }
    };

    const handleDone = () => {
        setUserModalVisible(false);
    };

    const handleDeleteEmployee = (employee) => {
        setItemToDelete(employee);
        setDeleteModalVisible(true);
    };

    const handleDeleteCancel = () => {
        setDeleteModalVisible(false);
        setItemToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteEmployee(itemToDelete.id).unwrap();
            message.success('Employee deleted successfully');
            setDeleteModalVisible(false);
            setItemToDelete(null);
        } catch (error) {
            message.error('Failed to delete employee');
        }
    };

    return (
        <>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={prepareInitialValues()}
                className="attendance-form"
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="employee_id"
                            label="Employee"
                            rules={[{ required: true, message: 'Please select employee' }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="Select employee"
                                onChange={handleEmployeeChange}
                                value={selectedEmployees}
                                disabled={!isAdmin}
                                open={employeeDropdownOpen}
                                onDropdownVisibleChange={setEmployeeDropdownOpen}
                                dropdownRender={menu => (
                                    <div>
                                        {menu}
                                        {isAdmin && (
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
                                                    onClick={handleAddEmployee}
                                                    style={{ width: '100%', height: '38px' }}
                                                >
                                                    Add Employee
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            >
                                {employees.map(employee => (
                                    <Option key={employee.id} value={employee.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{getEmployeeName(employee)}</span>
                                            {isAdmin && employee.created_by !== 'SYSTEM' && !selectedEmployees.includes(employee.id) && (
                                                <DeleteOutlined
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEmployee(employee);
                                                    }}
                                                    style={{ color: '#ff4d4f' }}
                                                />
                                            )}
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item>
                            <Checkbox
                                checked={isMultipleDates}
                                onChange={(e) => setIsMultipleDates(e.target.checked)}
                            >
                                Multiple Dates
                            </Checkbox>
                        </Form.Item>
                    </Col>

                    {isMultipleDates ? (
                        <Col span={24}>
                            <Form.Item
                                label="Date Range"
                                rules={[{ required: true, message: 'Please select date range' }]}
                            >
                                <RangePicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                    disabledDate={(current) => {
                                        return current && current > dayjs().endOf('day');
                                    }}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    ) : (
                        <Col span={24}>
                            <Form.Item
                                name="date"
                                label="Date"
                                rules={[{ required: true, message: 'Please select date' }]}
                            >
                                <DatePicker
                                    disabledDate={(current) => {
                                        return current && current > dayjs().endOf('day');
                                    }}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    )}

                    <Col span={12}>
                        <Form.Item
                            name="check_in"
                            label="Check In"
                            rules={[{ required: selectedStatus === 'present', message: 'Please select check in time' }]}
                        >
                            <TimePicker
                                format="HH:mm"
                                style={{ width: '100%' }}
                                disabled={selectedStatus !== 'present'}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name="check_out"
                            label="Check Out"
                            rules={[{ required: selectedStatus === 'present', message: 'Please select check out time' }]}
                        >
                            <TimePicker
                                format="HH:mm"
                                style={{ width: '100%' }}
                                disabled={selectedStatus !== 'present'}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name="status"
                            label="Status"
                            rules={[{ required: true, message: 'Please select status' }]}
                        >
                            <Select
                                placeholder="Select status"
                                onChange={handleStatusChange}
                                value={selectedStatus}
                            >
                                {statusOptions.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name="notes"
                            label="Notes"
                        >
                            <TextArea rows={4} placeholder="Enter notes" />
                        </Form.Item>
                    </Col>
                </Row>

                <div className="form-actions">
                    <Space>
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isSubmitting}>
                            {initialValues ? 'Update' : 'Create'}
                        </Button>
                    </Space>
                </div>
            </Form>

            <Modal
                title={<ModalTitle icon={<UserOutlined />} title="Add New Employee" />}
                open={userModalVisible}
                onCancel={handleUserCancel}
                footer={null}
                width={1000}
                className="modal"
                maskClosable={false}
                destroyOnClose={true}
            >
                <EmployeeForm
                    initialValues={null}
                    departments={departmentsData?.data?.items || []}
                    designations={designationsData?.data?.items || []}
                    roles={rolesData?.data?.items || []}
                    isLoading={{
                        departments: isLoadingDepartments,
                        designations: isLoadingDesignations
                    }}
                    isSubmitting={isCreatingEmployee}
                    onSubmit={handleUserSubmit}
                    onCancel={handleUserCancel}
                />
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Employee" />}
                open={deleteModalVisible}
                onCancel={handleDeleteCancel}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: isDeleteEmployee }}
                className="delete-modal"
                centered
                maskClosable={false}
                onOk={handleDeleteConfirm}
            >
                <p>Are you sure you want to delete employee "{itemToDelete?.username}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </>
    );
};

export default AttendanceForm; 