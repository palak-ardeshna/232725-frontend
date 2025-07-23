import React from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../../components/AdvancedForm';

const validationSchema = Yup.object().shape({
    name: Yup.string()
        .required('Name is required')
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Name must be less than 50 characters')
});

const PipelineForm = ({ initialValues, onSubmit, onCancel, loading }) => {
    const getFormFields = () => {
        return [
            {
                name: 'name',
                label: 'Pipeline Name',
                type: 'text',
                placeholder: 'Enter pipeline name',
                rules: [
                    { required: true, message: 'Please enter pipeline name' },
                    { min: 3, message: 'Pipeline name must be at least 3 characters' },
                    { max: 50, message: 'Pipeline name must be less than 50 characters' }
                ],
                span: 24
            }
        ];
    };

    return (
        <AdvancedForm
            initialValues={initialValues}
            isSubmitting={loading}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fields={getFormFields()}
            validationSchema={validationSchema}
            submitButtonText={initialValues ? 'Update Pipeline' : 'Create Pipeline'}
        />
    );
};

export default PipelineForm;