import React from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../components/AdvancedForm';

const validationSchema = Yup.object().shape({
    designation: Yup.string()
        .required('Designation name is required')
        .max(50, 'Designation name cannot exceed 50 characters')
});

const DesignationForm = ({
    initialValues,
    isSubmitting,
    onSubmit,
    onCancel
}) => {
    const fields = [
        {
            name: 'designation',
            label: 'Designation Name',
            type: 'text',
            placeholder: 'Enter designation name',
            rules: [{ required: true, message: 'Please enter designation name' }],
            span: 24
        }
    ];

    return (
        <AdvancedForm
            initialValues={initialValues}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fields={fields}
            validationSchema={validationSchema}
            submitButtonText={initialValues ? 'Update Designation' : 'Add Designation'}
            cancelButtonText="Cancel"
        />
    );
};

export default DesignationForm; 