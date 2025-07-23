import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Form } from 'antd';

import AdvancedForm from '../../../../../../../components/AdvancedForm';
import dayjs from 'dayjs';

const validationSchema = Yup.object().shape({
    due_date: Yup.date().required('Due date is required'),
    reschedule_reason: Yup.string().required('Reason for rescheduling is required')
});

const RescheduleForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    initialValues = null
}) => {
    const [form] = Form.useForm();

    const [formValues, setFormValues] = useState({
        due_date: dayjs().add(7, 'days'),
        reschedule_reason: ''
    });

    const rescheduleCount = typeof initialValues?.reschedule_count === 'number' ?
        initialValues.reschedule_count : 0;

    useEffect(() => {
        if (initialValues) {

            const defaultDueDate = dayjs().add(7, 'days');

            const processedValues = {
                due_date: defaultDueDate,
                reschedule_reason: ''
            };

            setFormValues(processedValues);

            form.setFieldsValue(processedValues);
        }
    }, [initialValues, form]);

    const rescheduleFields = [
        {
            name: 'due_date',
            label: 'New Due Date',
            type: 'date',
            placeholder: 'Select new due date',
            rules: [{ required: true, message: 'Please select new due date' }],
            span: 24,
            disabledDate: (current) => current && current < dayjs().startOf('day')
        },
        {
            name: 'reschedule_reason',
            label: 'Reason for Rescheduling',
            type: 'textarea',
            placeholder: 'Enter reason for rescheduling',
            rows: 4,
            rules: [{ required: true, message: 'Please provide reason for rescheduling' }],
            span: 24
        }
    ];

    const handleSubmit = (values) => {
        if (!initialValues.reset_due_on_fail) {
            // Milestone does not allow rescheduling
            return;
        }

        const formattedValues = {
            ...values,
            due_date: values.due_date ?
                (dayjs.isDayjs(values.due_date) ? values.due_date.format('YYYY-MM-DD') : values.due_date)
                : dayjs().add(7, 'days').format('YYYY-MM-DD'),
            status: 'Pending'
        };

        onSubmit(formattedValues);
    };

    return (
        <div>
            <div className="reschedule-info">
                <div className="info-section">
                    <div className="info-row horizontal">
                        <div className="label">Milestone</div>
                        <div className="value">{initialValues?.title}</div>
                    </div>
                    <div className="info-row horizontal">
                        <div className="label">Current Due Date</div>
                        <div className="value">{dayjs(initialValues?.due_date).format('DD MMM YYYY')}</div>
                    </div>
                    <div className="info-row horizontal">
                        <div className="label">Current Status</div>
                        <div className="value">{initialValues?.status}</div>
                    </div>
                    <div className="info-row horizontal">
                        <div className="label">Reschedule Count</div>
                        <div className="value">{rescheduleCount} time(s)</div>
                    </div>
                    {rescheduleCount > 0 && initialValues?.reschedule_reason && (
                        <div className="reason-section">
                            <div className="reason-label">Last Reschedule Reason:</div>
                            <div className="reason-text">{initialValues.reschedule_reason}</div>
                        </div>
                    )}
                </div>
            </div>

            <AdvancedForm
                initialValues={formValues}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                fields={rescheduleFields}
                validationSchema={validationSchema}
                submitButtonText="Reschedule"
                cancelButtonText="Cancel"
                columns={1}
                className="reschedule-form"
                form={form}
            />
        </div>
    );
};

export default RescheduleForm; 