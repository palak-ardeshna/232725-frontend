import React from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../components/AdvancedForm';

const validationSchema = Yup.object().shape({
    department: Yup.string()
        .required('Department is required')
        .min(3, 'Department must be at least 3 characters')
        .max(50, 'Department must be less than 50 characters')
});

const DepartmentForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    const getFields = () => [
        {
            name: 'department',
            label: 'Department',
            type: 'text',
            placeholder: 'Enter department',
            rules: [
                { required: true, message: 'Please enter department' },
                { min: 3, message: 'Department must be at least 3 characters' },
                { max: 50, message: 'Department must be less than 50 characters' }
            ],
            span: 24
        }
    ];

    return (
        <AdvancedForm
            initialValues={initialValues || { department: '' }}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fields={getFields()}
            validationSchema={validationSchema}
            submitButtonText={initialValues ? 'Update Department' : 'Create Department'}
        />
    );
};

export default DepartmentForm; 