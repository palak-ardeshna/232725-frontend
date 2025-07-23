import React, { useEffect } from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../../../components/AdvancedForm';
import { Form, Input } from 'antd';

const { TextArea } = Input;

const validationSchema = Yup.object().shape({
    noteTitle: Yup.string()
        .required('Title is required')
        .max(50, 'Title cannot exceed 50 characters'),
    description: Yup.string().required('Content is required'),
    priority: Yup.string().required('Priority is required')
});

const NoteForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    initialValues = null
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                noteTitle: initialValues.noteTitle || '',
                description: initialValues.description || '',
                priority: initialValues.priority || 'general'
            });
        }
    }, [initialValues, form]);

    const priorityOptions = [
        { value: 'urgent', label: 'Urgent' },
        { value: 'important', label: 'Important' },
        { value: 'general', label: 'General' }
    ];

    const noteFields = [
        {
            name: 'noteTitle',
            label: 'Title',
            type: 'text',
            placeholder: 'Enter note title',
            rules: [
                { required: true, message: 'Please enter a title' },
                { max: 50, message: 'Title cannot exceed 50 characters' }
            ],
            span: 24
        },
        {
            name: 'description',
            label: 'Description',
            type: 'custom',
            render: () => (
                <TextArea
                    rows={4}
                    placeholder="Enter note content"
                    defaultValue={initialValues?.description || ''}
                />
            ),
            rules: [{ required: true, message: 'Please enter content' }],
            span: 24
        },
        {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            placeholder: 'Select priority',
            rules: [{ required: true, message: 'Please select a priority' }],
            options: priorityOptions,
            span: 24
        }
    ];

    const handleSubmit = (values) => {
        // Ensure all required fields are included
        const submissionValues = {
            ...values,
            id: initialValues?.id
        };


        onSubmit(submissionValues);
    };

    const defaultValues = {
        noteTitle: '',
        description: '',
        priority: 'general'
    };

    const submitButtonText = initialValues ? 'Update Note' : 'Add Note';

    return (
        <AdvancedForm
            initialValues={initialValues || defaultValues}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={noteFields}
            validationSchema={validationSchema}
            submitButtonText={submitButtonText}
            cancelButtonText="Cancel"
            columns={1}
            className="note-form"
            form={form}
        />
    );
};

export default NoteForm;
