import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../components/AdvancedForm';
import { Button, Upload, message, Badge, Form, Table, Space, Tooltip } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined, FileOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, FileUnknownOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useGetRolesQuery, useGetEmployeesQuery, useGetDesignationsQuery } from '../../../../../config/api/apiServices';

const validationSchema = Yup.object().shape({
    taskName: Yup.string().required('Title is required'),
    description: Yup.string(),
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date().required('End date is required')
        .min(Yup.ref('startDate'), 'End date must be after start date'),
    assignedTo: Yup.string().required('Assigned to is required')
});

const TaskForm = ({ initialValues, onSubmit, users, isLoading, onCancel, designations: propDesignations = [] }) => {

    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileDeleteStates, setFileDeleteStates] = useState({});

    const { data: rolesData } = useGetRolesQuery({
        limit: 'all'
    });

    const { data: employeesData } = useGetEmployeesQuery({
        limit: 'all'
    });

    const { data: designationsData } = useGetDesignationsQuery({
        limit: 'all'
    });

    const roles = rolesData?.data?.items || [];
    const employees = employeesData?.data?.items || [];
    const designations = propDesignations.length > 0 ? propDesignations : (designationsData?.data?.items || []);

    useEffect(() => {
        if (initialValues && initialValues.attachments && initialValues.attachments.length > 0) {
            const attachmentsArray = Array.isArray(initialValues.attachments)
                ? initialValues.attachments
                : [initialValues.attachments];

            const files = attachmentsArray.map((attachment, index) => {
                if (typeof attachment === 'string') {
                    try {
                        const parsedAttachment = JSON.parse(attachment);
                        return {
                            uid: `-${index}`,
                            name: parsedAttachment.file_name || `file-${index}`,
                            status: 'done',
                            url: parsedAttachment.file_url,
                            originalAttachment: parsedAttachment
                        };
                    } catch (e) {
                        return {
                            uid: `-${index}`,
                            name: `file-${index}`,
                            status: 'done',
                            url: attachment,
                            originalAttachment: {
                                file_url: attachment,
                                file_name: `file-${index}`
                            }
                        };
                    }
                }

                const fileName = attachment.file_name || attachment.fileName || `file-${index}`;
                const fileUrl = attachment.file_url || attachment.fileUrl || attachment;

                let cleanFileUrl = fileUrl;
                let cleanAttachment = { ...attachment };

                if (typeof fileUrl === 'string' && (fileUrl.startsWith('[{') || fileUrl.startsWith('{'))) {
                    try {
                        const parsedUrl = JSON.parse(fileUrl);
                        if (parsedUrl.file_url) {
                            cleanFileUrl = parsedUrl.file_url;
                            cleanAttachment.file_url = parsedUrl.file_url;
                        } else if (Array.isArray(parsedUrl) && parsedUrl[0] && parsedUrl[0].file_url) {
                            cleanFileUrl = parsedUrl[0].file_url;
                            cleanAttachment.file_url = parsedUrl[0].file_url;
                        }
                    } catch (e) { }
                }

                return {
                    uid: `-${index}`,
                    name: fileName,
                    status: 'done',
                    url: cleanFileUrl,
                    originalAttachment: cleanAttachment
                };
            });

            setFileList(files);
        } else {
            setFileList([]);
        }
    }, [initialValues]);

    useEffect(() => {
        if (initialValues && initialValues.description) {
            setTimeout(() => {
                form.setFieldsValue({ description: initialValues.description });
            }, 100);
        }
    }, [initialValues, form]);

    useEffect(() => {
        if (initialValues && initialValues.status) {
            setTimeout(() => {
                let formattedStatus = initialValues.status;
                if (typeof formattedStatus === 'string') {
                    formattedStatus = formattedStatus
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                }

                form.setFieldsValue({ status: formattedStatus });
            }, 200);
        }
    }, [initialValues, form]);

    useEffect(() => {
        if (initialValues && initialValues.description) {
            const timer = setTimeout(() => {
                const textarea = document.getElementById('textarea-description');
                if (textarea) {
                    textarea.value = initialValues.description;

                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);

                    form.setFieldsValue({ description: initialValues.description });
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [initialValues, form]);

    const handleFileChange = ({ fileList: newFileList }) => {
        const currentValues = form.getFieldsValue();

        const removedFiles = fileList.filter(oldFile =>
            !newFileList.some(newFile =>
                (oldFile.uid === newFile.uid) ||
                (oldFile.originalAttachment?.file_url === newFile.originalAttachment?.file_url)
            )
        );

        if (removedFiles.length > 0 && initialValues) {
            removedFiles.forEach(file => {
                if (file.originalAttachment && file.originalAttachment.file_url) {
                    const removedFileUrl = file.originalAttachment.file_url;
                }
            });
        }

        const processedFileList = newFileList.map(file => {
            if (file.originFileObj) {
                return {
                    ...file,
                    status: 'done',
                    name: file.name || file.originFileObj.name
                };
            }
            return file;
        });

        setFileList(processedFileList);

        setTimeout(() => {
            form.setFieldsValue({
                ...currentValues,
                attachments: processedFileList
            });
        }, 100);
    };

    const beforeUpload = (file) => {
        return false;
    };

    const deleteFile = async (file) => {
        try {
            const fileKey = file.uid || (file.originalAttachment && file.originalAttachment.file_url) || Math.random().toString();

            setFileDeleteStates(prev => ({
                ...prev,
                [fileKey]: true
            }));

            if (initialValues && initialValues.id && file.originalAttachment && file.originalAttachment.file_url) {
                const fileUrl = file.originalAttachment.file_url;

                const formData = new FormData();
                formData.append('deleteFileUrl', fileUrl);

                if (initialValues.taskName) {
                    formData.append('taskName', initialValues.taskName);
                }
                if (initialValues.description) {
                    formData.append('description', initialValues.description);
                }

                const remainingFiles = fileList.filter(item => item !== file);
                if (remainingFiles.length > 0) {
                    const remainingAttachments = remainingFiles.map(f => f.originalAttachment);
                    formData.append('attachments', JSON.stringify(remainingAttachments));
                } else {
                    formData.append('attachments', JSON.stringify([]));
                }

                await onSubmit(formData);

                const newFileList = fileList.filter(item => item !== file);
                setFileList(newFileList);
            } else {
                const newFileList = fileList.filter(item => item !== file);
                setFileList(newFileList);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            const fileKey = file.uid || (file.originalAttachment && file.originalAttachment.file_url) || Math.random().toString();
            setFileDeleteStates(prev => ({
                ...prev,
                [fileKey]: false
            }));
        }
    };

    const handleSubmit = async (values) => {
        try {
            setIsSubmitting(true);

            // Always ensure status and priority are set for new tasks
            if (!initialValues) {
                values.status = 'Pending';
                values.priority = 'Medium';
            }

            console.log('TaskForm handleSubmit values:', values);

            const formData = new FormData();

            Object.keys(values).forEach(key => {
                if ((key === 'startDate' || key === 'endDate') && values[key]) {
                    formData.append(key, values[key].format('YYYY-MM-DD'));
                } else if (values[key] !== undefined && values[key] !== null && key !== 'attachments') {
                    if (key === 'taskName') {
                        formData.append('taskName', String(values[key]));
                    } else if (key === 'description') {
                        formData.append('description', String(values[key] || ""));
                    } else {
                        formData.append(key, values[key]);
                    }
                }
            });

            if (fileList.length > 0) {
                const newFiles = [];
                const existingFiles = [];

                fileList.forEach(file => {
                    if (file.originFileObj) {
                        newFiles.push(file);
                    } else if (file.originalAttachment) {
                        existingFiles.push(file);
                    }
                });

                newFiles.forEach(file => {
                    if (file.originFileObj) {
                        formData.append('attachments', file.originFileObj);
                    }
                });

                if (initialValues) {
                    const hadAttachmentsBefore = initialValues.attachments &&
                        (Array.isArray(initialValues.attachments) ?
                            initialValues.attachments.length > 0 :
                            initialValues.attachments);

                    if (hadAttachmentsBefore && existingFiles.length === 0) {
                        formData.append('attachments', JSON.stringify([]));
                    }
                    else if (existingFiles.length > 0) {
                        const existingAttachments = existingFiles.map(file => {
                            if (typeof file.originalAttachment === 'string') {
                                try {
                                    return JSON.parse(file.originalAttachment);
                                } catch (e) {
                                    return {
                                        file_url: file.url,
                                        file_name: file.name
                                    };
                                }
                            }
                            return file.originalAttachment;
                        });
                        formData.append('attachments', JSON.stringify(existingAttachments));
                    }
                }

                await onSubmit(formData);
            }
            else {
                const formattedValues = {
                    ...values,
                    startDate: values.startDate ?
                        (typeof values.startDate.format === 'function' ?
                            values.startDate.format('YYYY-MM-DD') :
                            new Date(values.startDate).toISOString().split('T')[0]) :
                        undefined,
                    endDate: values.endDate ?
                        (typeof values.endDate.format === 'function' ?
                            values.endDate.format('YYYY-MM-DD') :
                            new Date(values.endDate).toISOString().split('T')[0]) :
                        undefined,
                };

                // Always ensure status and priority are set for new tasks
                if (!initialValues) {
                    formattedValues.status = 'Pending';
                    formattedValues.priority = 'Medium';
                } else if (initialValues && initialValues.attachments && initialValues.attachments.length > 0) {
                    formattedValues.attachments = [];
                }

                if (formattedValues.taskName) {
                    formattedValues.taskName = String(formattedValues.taskName);
                }

                formattedValues.description = String(values.description || "");

                if (formattedValues.attachments && Array.isArray(formattedValues.attachments) && formattedValues.attachments.length === 0) {
                    delete formattedValues.attachments;
                }

                await onSubmit(formattedValues);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            message.error('Failed to submit form');
        } finally {
            setIsSubmitting(false);
        }
    };

    const preserveFormData = () => {
        return form.getFieldsValue(true);
    };

    const restoreFormData = (formData, newAttachments) => {
        form.setFieldsValue({
            ...formData,
            attachments: newAttachments
        });
    };

    const getFields = () => {
        // Create a list of fields that excludes status and priority fields when in create mode
        const fieldsList = [
            {
                name: 'taskName',
                label: 'Title',
                type: 'text',
                placeholder: 'Enter task title',
                required: true,
                span: 24
            },
            {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Enter task description',
                required: false,
                span: 24,
                rows: 4,
                defaultValue: initialValues?.description || "",
                id: 'textarea-description'
            },
            {
                name: 'startDate',
                label: 'Start Date',
                type: 'date',
                format: "DD/MM/YYYY",
                placeholder: 'Select start date',
                required: true,
                span: 12
            },
            {
                name: 'endDate',
                label: 'End Date',
                type: 'date',
                format: "DD/MM/YYYY",
                placeholder: 'Select end date',
                required: true,
                span: 12
            },
            {
                name: 'assignedTo',
                label: 'Assigned To',
                type: 'select',
                placeholder: 'Select person',
                required: true,
                span: 24,
                showSearch: true,
                filterOption: (input, option) => {
                    const optionLabel = option.label;

                    if (React.isValidElement(optionLabel)) {
                        const nameElement = optionLabel.props.children[0];
                        const roleBadgeElement = optionLabel.props.children[1];

                        const nameText = nameElement?.props?.children?.toLowerCase() || '';
                        const roleText = roleBadgeElement?.props?.children[1]?.props?.children?.toLowerCase() || '';

                        const searchText = input.toLowerCase();

                        return nameText.includes(searchText) || roleText.includes(searchText);
                    }

                    return option.label?.toLowerCase().includes(input.toLowerCase());
                },
                options: [
                    ...users.map(user => {
                        let designationName = '';
                        if (user.designation_id) {
                            const userDesignation = designations.find(d => d.id === user.designation_id);
                            designationName = userDesignation ? userDesignation.designation : '';
                        }

                        const userName = user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.username || 'Unnamed User';

                        const label = (
                            <div className="name-container dropdown-item">
                                <span className="name">{userName}</span>
                                {designationName && (
                                    <span className="role-badge">
                                        <Badge status="processing" />
                                        <span className="role-text"> {designationName}</span>
                                    </span>
                                )}
                            </div>
                        );

                        return {
                            value: `user_${user.id}`,
                            label: label
                        };
                    }),
                    ...employees.map(employee => {
                        let designationName = '';
                        
                        if (employee.designation_id) {
                            const employeeDesignation = designations.find(d => d.id === employee.designation_id);
                            designationName = employeeDesignation ? employeeDesignation.designation : '';
                        } else if (employee.designation) {
                            designationName = employee.designation;
                        }
                        
                        if (!designationName) {
                            designationName = "EMPLOYEE";
                        }

                        const employeeName = employee.username || employee.employee_id || 'Unnamed Employee';

                        const label = (
                            <div className="name-container dropdown-item">
                                <span className="name">{employeeName}</span>
                                <span className="role-badge">
                                    <Badge status="processing" />
                                    <span className="role-text"> {designationName}</span>
                                </span>
                            </div>
                        );

                        return {
                            value: `employee_${employee.id}`,
                            label: label
                        };
                    })
                ]
            },
            {
                name: 'attachments',
                label: 'Attachments',
                type: 'custom',
                span: 24,
                render: () => (
                    <div className="file-upload-container">
                        <div className="file-upload-header">
                            <Upload.Dragger
                                fileList={[]}
                                onChange={(info) => {
                                    const savedFormData = preserveFormData();

                                    const newFiles = [...info.fileList];
                                    const updatedFileList = [...fileList];

                                    newFiles.forEach(newFile => {
                                        const isDuplicate = updatedFileList.some(
                                            existingFile => existingFile.uid === newFile.uid
                                        );

                                        if (!isDuplicate) {
                                            updatedFileList.push({
                                                ...newFile,
                                                status: 'done',
                                                uid: newFile.uid || `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                                                name: newFile.name || newFile.originFileObj.name
                                            });
                                        }
                                    });

                                    setFileList(updatedFileList);

                                    setTimeout(() => {
                                        restoreFormData(savedFormData, updatedFileList);
                                    }, 50);

                                    setTimeout(() => {
                                        restoreFormData(savedFormData, updatedFileList);
                                    }, 200);
                                }}
                                beforeUpload={beforeUpload}
                                multiple
                                showUploadList={false}
                                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            >
                                <p className="ant-upload-drag-icon">
                                    <UploadOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                                <p className="ant-upload-hint">Support for multiple file uploads</p>
                            </Upload.Dragger>
                        </div>

                        {fileList.length > 0 && (
                            <div>
                                <Table
                                    dataSource={fileList.map((file, index) => ({
                                        key: index,
                                        file: file
                                    }))}
                                    columns={[
                                        {
                                            title: 'Type',
                                            dataIndex: 'file',
                                            key: 'type',
                                            width: 60,
                                            render: (file) => (
                                                <div className="file-icon">
                                                    {getFileIcon(file.name)}
                                                </div>
                                            )
                                        },
                                        {
                                            title: 'File Name',
                                            dataIndex: 'file',
                                            key: 'name',
                                            render: (file) => (
                                                <div className="file-name">
                                                    {file.name || (file.originFileObj && file.originFileObj.name) || 'File'}
                                                </div>
                                            )
                                        },
                                        {
                                            title: 'Actions',
                                            dataIndex: 'file',
                                            key: 'actions',
                                            width: 120,
                                            render: (file) => {
                                                const fileKey = file.uid || (file.originalAttachment && file.originalAttachment.file_url) || "";
                                                const isDeleting = fileDeleteStates[fileKey] || false;

                                                return (
                                                    <Space>
                                                        {file.url && (
                                                            <Tooltip title="View File">
                                                                <Button
                                                                    type="text"
                                                                    icon={<EyeOutlined />}
                                                                    onClick={() => {
                                                                        const fileUrl = file.url || (file.originalAttachment && file.originalAttachment.file_url);
                                                                        if (fileUrl) {
                                                                            window.open(fileUrl, '_blank');
                                                                        }
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Delete File">
                                                            <Button
                                                                type="text"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => deleteFile(file)}
                                                                loading={isDeleting}
                                                                disabled={isDeleting || isSubmitting}
                                                            />
                                                        </Tooltip>
                                                    </Space>
                                                );
                                            }
                                        }
                                    ]}
                                    pagination={false}
                                    size="small"
                                    locale={{ emptyText: 'No files uploaded' }}
                                    className="table-list"
                                />
                            </div>
                        )}
                    </div>
                )
            }
        ];

        // Only add status and priority fields when editing (not creating)
        if (initialValues) {
            // Add hidden field for controlling status note visibility
            fieldsList.push({
                name: 'showStatusNote',
                type: 'hidden',
                defaultValue: false
            });

            fieldsList.push({
                name: 'status',
                label: 'Status',
                type: 'select',
                options: [
                    { label: 'Pending', value: 'Pending' },
                    { label: 'In Progress', value: 'In Progress' },
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Cancelled', value: 'Cancelled' }
                ],
                placeholder: 'Select status',
                required: true,
                span: 12,
                onChange: (value, form) => {
                    const currentStatus = initialValues?.status;
                    if (value !== currentStatus) {
                        // Show status note field when status changes
                        form.setFieldsValue({ showStatusNote: true });
                    } else {
                        form.setFieldsValue({ showStatusNote: false });
                    }
                }
            });

            fieldsList.push({
                name: 'priority',
                label: 'Priority',
                type: 'select',
                placeholder: 'Select priority',
                rules: [{ required: true, message: 'Please select a priority' }],
                span: 12,
                options: [
                    { label: 'Low', value: 'Low' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'High', value: 'High' }
                ]
            });

            // Add status note field only when editing
            fieldsList.push({
                name: 'statusNote',
                label: 'Status Change Reason',
                type: 'textarea',
                placeholder: 'Enter reason for status change',
                span: 24,
                dependencies: ['status', 'showStatusNote'],
                hidden: (form) => {
                    // Only show when status is changing
                    const showNote = form.getFieldValue('showStatusNote');
                    const newStatus = form.getFieldValue('status');
                    const currentStatus = initialValues?.status;

                    return !showNote || newStatus === currentStatus;
                },
                rules: [
                    {
                        required: (form) => {
                            const status = form.getFieldValue('status');
                            const currentStatus = initialValues?.status;
                            return status !== currentStatus;
                        },
                        message: 'Please provide a reason for changing the status',
                        min: 5,
                        max: 500
                    }
                ]
            });
        }

        // Add hidden fields for status and priority in create mode
        if (!initialValues) {
            fieldsList.push({
                name: 'status',
                type: 'hidden',
                defaultValue: 'Pending'
            });

            fieldsList.push({
                name: 'priority',
                type: 'hidden',
                defaultValue: 'Medium'
            });
        }

        return fieldsList;
    };

    const description = initialValues?.description || "";

    const formatStatus = (status) => {
        if (!status) return 'Pending';

        return status
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const formattedInitialValues = initialValues ? {
        ...initialValues,
        startDate: initialValues.startDate ? moment(initialValues.startDate) : undefined,
        endDate: initialValues.endDate ? moment(initialValues.endDate) : undefined,
        description: description,
        status: formatStatus(initialValues.status),
        showStatusNote: false // Initialize showStatusNote as false to hide the reason field by default
    } : {
        taskName: '',
        description: '',
        status: 'Pending',
        priority: 'Medium',
        startDate: moment(),
        endDate: moment().add(7, 'days'),
        assignedTo: '',
        showStatusNote: false // Initialize showStatusNote as false for new tasks as well
    };

    if (initialValues && !formattedInitialValues.description && initialValues.description) {
        formattedInitialValues.description = String(initialValues.description);
    }

    useEffect(() => {
        // Set default values for new tasks
        if (!initialValues && form) {
            form.setFieldsValue({
                status: 'Pending',
                priority: 'Medium',
                startDate: moment(),
                endDate: moment().add(7, 'days'),
                showStatusNote: false
            });
        }
        // Set values for existing tasks
        else if (initialValues && form) {
            const timer1 = setTimeout(() => {
                form.setFieldsValue({
                    description: initialValues.description || "",
                    showStatusNote: false // Ensure status note is hidden by default
                });
            }, 100);

            const timer2 = setTimeout(() => {
                form.setFieldsValue({
                    taskName: initialValues.taskName || "",
                    assignedTo: initialValues.assignedTo || "",
                    status: formatStatus(initialValues.status),
                    priority: initialValues.priority || "Medium",
                    showStatusNote: false // Ensure status note is hidden by default
                });
            }, 150);

            const timer3 = setTimeout(() => {
                form.setFieldsValue({
                    ...formattedInitialValues,
                    showStatusNote: false // Ensure status note is hidden by default
                });
            }, 300);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
            };
        }
    }, [form, formattedInitialValues, initialValues]);

    const getFileIcon = (fileName) => {
        if (!fileName) return <FileUnknownOutlined />;

        const extension = fileName.split('.').pop().toLowerCase();

        switch (extension) {
            case 'pdf':
                return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
            case 'xls':
            case 'xlsx':
            case 'csv':
                return <FileExcelOutlined style={{ color: '#52c41a' }} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
                return <FileImageOutlined style={{ color: '#1890ff' }} />;
            default:
                return <FileOutlined />;
        }
    };

    return (
        <AdvancedForm
            initialValues={formattedInitialValues}
            isSubmitting={isLoading || isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={getFields()}
            validationSchema={validationSchema}
            submitButtonText={initialValues ? 'Update Task' : 'Create Task'}
            form={form}
        />
    );
};

export default TaskForm;