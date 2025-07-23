import React from 'react';
import * as Yup from 'yup';
import { useGetPipelinesQuery, useGetStagesQuery } from '../../../../../../config/api/apiServices';
import AdvancedForm from '../../../../../../components/AdvancedForm';
import { message } from 'antd';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Stage name is required'),
    pipeline_id: Yup.string().required('Pipeline is required'),
    type: Yup.string().required('Stage type is required'),
    is_default: Yup.boolean()
});

const StageForm = ({ initialValues, onSubmit, onCancel, loading, hideTypeField }) => {

    const { data: pipelinesResponse, isLoading: isPipelinesLoading } = useGetPipelinesQuery({
        limit: 100
    }, {
        refetchOnMountOrArgChange: true
    });
    
    const { data: stagesResponse, isLoading: isStagesLoading } = useGetStagesQuery({
        limit: 'all'
    }, {
        refetchOnMountOrArgChange: true
    });

    const pipelines = pipelinesResponse?.data?.items || [];
    const allStages = stagesResponse?.data?.items || [];

    const getStageFields = () => {
        const fields = [
            {
                name: 'name',
                label: 'Stage Name',
                type: 'text',
                placeholder: 'Enter stage name',
                rules: [{ required: true, message: 'Please enter stage name' }],
                span: 24
            },
            {
                name: 'pipeline_id',
                label: 'Pipeline',
                type: 'select',
                placeholder: 'Select pipeline',
                rules: [{ required: true, message: 'Please select a pipeline' }],
                options: pipelines.map(p => ({ label: p.name, value: p.id })),
                loading: isPipelinesLoading,
                disabled: isPipelinesLoading || pipelines.length === 0,
                span: 12
            }
        ];

        // Add type field only if hideTypeField is not true
        if (!hideTypeField) {
            fields.push({
                name: 'type',
                label: 'Stage Type',
                type: 'select',
                placeholder: 'Select stage type',
                rules: [{ required: true, message: 'Please select stage type' }],
                options: [
                    { label: 'Lead', value: 'lead' },
                    { label: 'Proposal', value: 'proposal', },
                    { label: 'Project', value: 'project' },
                ],
                span: 12
            });
        } else {
            // Add hidden field to maintain the form structure when type field is hidden
            fields.push({
                name: 'type',
                type: 'hidden',
                span: 0
            });
        }

        fields.push({
            name: 'is_default',
            label: 'Set as default stage',
            type: 'checkbox',
            // span: hideTypeField ? 12 : 24
        });

        return fields;
    };

    const handleSubmit = (values) => {
        try {
            if (values.name && values.pipeline_id && values.type) {
                const stageWithSameName = allStages.find(
                    stage => stage.pipeline === values.pipeline_id && 
                           stage.type === values.type && 
                           stage.name.toLowerCase() === values.name.toLowerCase()
                );
                
                if (stageWithSameName) {
                    if (initialValues && initialValues.id === stageWithSameName.id) {
                    } else {
                        message.error(`A stage with name "${values.name}" already exists for this pipeline and type.`);
                        return;
                    }
                }
                
                if (values.is_default) {
                    const defaultStageExists = allStages.some(
                        stage => stage.pipeline === values.pipeline_id && 
                               stage.type === values.type && 
                               stage.is_default === true &&
                               (!initialValues || stage.id !== initialValues.id)
                    );
                    
                    if (defaultStageExists) {
                        message.warning(`A default ${values.type} stage already exists for this pipeline. This will replace it as the default.`);
                    }
                }
            }
            
            const formData = {
                ...values,
                pipeline: values.pipeline_id,
            };

            delete formData.pipeline_id;
            
            onSubmit(formData);
        } catch (error) {
            message.error(error.message || "Failed to process form");
        }
    };

    const formInitialValues = initialValues ? {
        ...initialValues,
        pipeline_id: initialValues.pipeline_id || initialValues.pipeline,
    } : undefined;
    
    return (
        <AdvancedForm
            initialValues={formInitialValues}
            isSubmitting={loading}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={getStageFields()}
            validationSchema={validationSchema}
            submitButtonText={initialValues ? 'Update Stage' : 'Create Stage'}
        />
    );
};

export default StageForm; 