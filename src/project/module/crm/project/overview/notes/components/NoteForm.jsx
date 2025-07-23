import React from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../../../components/AdvancedForm';

const validationSchema = Yup.object().shape({
    noteTitle: Yup.string().required('Title is required'),
    description: Yup.string().required('Description is required'),
    priority: Yup.string().required('Priority is required')
});

const NoteForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    initialValues = null
}) => {
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
            rules: [{ required: true, message: 'Please enter a title' }],
            span: 24
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter note content',
            rules: [{ required: true, message: 'Please enter content' }],
            rows: 4,
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
        onSubmit(values);
    };

    const defaultValues = {
        noteTitle: '',
        description: '',
        priority: 'general'
    };

    const formInitialValues = initialValues || defaultValues;
    const submitButtonText = initialValues ? 'Update Note' : 'Add Note';

    return (
        <AdvancedForm
            initialValues={formInitialValues}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={noteFields}
            validationSchema={validationSchema}
            submitButtonText={submitButtonText}
            cancelButtonText="Cancel"
            columns={1}
            className="note-form"
        />
    );
};

export default NoteForm; 