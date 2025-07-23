import React from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../../components/AdvancedForm';

const FilterForm = ({ initialValues, onSubmit, onCancel, loading, filterType }) => {
    const typeOptions = [
        { value: 'tag', label: 'Tag' },
        { value: 'status', label: 'Status' },
        { value: 'label', label: 'Label' },
        { value: 'source', label: 'Source' },
        { value: 'category', label: 'Category' },
    ];

    // Create validation schema based on whether filterType is provided
    const validationSchema = Yup.object().shape({
        name: Yup.string().required('Filter name is required'),
        ...(filterType ? {} : { type: Yup.string().required('Filter type is required') })
    });

    const getFilterFields = () => {
        const fields = [
            {
                name: 'name',
                label: 'Filter Name',
                type: 'text',
                placeholder: 'Enter filter name',
                rules: [{ required: true, message: 'Please enter filter name' }],
                span: 24
            }
        ];

        // Only show type field if filterType is not provided
        if (!filterType) {
            fields.push({
                name: 'type',
                label: 'Filter Type',
                type: 'select',
                placeholder: 'Select filter type',
                rules: [{ required: true, message: 'Please select filter type' }],
                options: typeOptions,
                disabled: !!initialValues,
                span: 24
            });
        }
        
        // Add created_by field if editing a filter
        if (initialValues?.created_by) {
            fields.push({
                name: 'created_by_display',
                label: 'Created By',
                type: 'text',
                disabled: true,
                initialValue: initialValues.created_by_display || initialValues.created_by || 'System',
                span: 24
            });
        }

        return fields;
    };

    return (
        <AdvancedForm
            initialValues={initialValues}
            isSubmitting={loading}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fields={getFilterFields()}
            validationSchema={validationSchema}
            submitButtonText={initialValues ? 'Update Filter' : 'Create Filter'}
        />
    );
};

export default FilterForm; 