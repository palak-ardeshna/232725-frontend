import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../../../components/AdvancedForm';
import dayjs from 'dayjs';
import { Form, Input } from 'antd';
const { TextArea } = Input;

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
    description: Yup.string(),
    includeInTotal: Yup.boolean()
});

const CostForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    initialValues = null
}) => {
    const [form] = Form.useForm();
    const [formValues, setFormValues] = useState({
        name: '',
        amount: '',
        date: dayjs(),
        description: '',
        includeInTotal: true
    });

    useEffect(() => {
        if (initialValues) {
            const dateValue = initialValues.date ?
                (dayjs.isDayjs(initialValues.date) ? initialValues.date : dayjs(initialValues.date))
                : dayjs();

            const processedValues = {
                ...initialValues,
                date: dateValue
            };

            setFormValues(processedValues);

            form.setFieldsValue(processedValues);
        }
    }, [initialValues, form]);

    const costFields = [
        {
            name: 'name',
            label: 'Cost Name',
            type: 'text',
            placeholder: 'Enter cost name',
            rules: [{ required: true, message: 'Please enter cost name' }],
            span: 12
        },
        {
            name: 'amount',
            label: 'Amount (₹)',
            type: 'number',
            placeholder: 'Enter amount',
            rules: [
                { required: true, message: 'Please enter amount' },
                { type: 'number', min: 0, message: 'Amount must be positive' }
            ],
            span: 12,
            addonBefore: '₹',
            className: 'amount-field'
        },
        {
            name: 'date',
            label: 'Date',
            type: 'date',
            placeholder: 'Select date',
            rules: [{ required: true, message: 'Please select a date' }],
            span: 24
        },
        {
            name: 'description',
            label: 'Description',
            type: 'custom',
            component: <TextArea rows={4} placeholder="Enter description (optional)" />,
            placeholder: 'Enter description (optional)',
            rows: 4,
            span: 24
        },
        {
            name: 'includeInTotal',
            label: 'Include in Project Total',
            type: 'switch',
            span: 24,
            help: 'If enabled, this cost will be added to the total project value'
        }
    ];

    const handleSubmit = (values) => {

        const formattedValues = {
            ...values,
            date: values.date ?
                (dayjs.isDayjs(values.date) ? values.date.format() : values.date)
                : dayjs().format()
        };

        onSubmit(formattedValues);
    };

    const submitButtonText = initialValues ? 'Update Cost' : 'Add Cost';

    return (
        <AdvancedForm
            initialValues={formValues}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={costFields}
            validationSchema={validationSchema}
            submitButtonText={submitButtonText}
            cancelButtonText="Cancel"
            columns={2}
            className="cost-form"
            form={form}
        />
    );
};

export default CostForm;