import React from 'react';
import * as Yup from 'yup';
import { Form, DatePicker, TimePicker, Select, InputNumber } from 'antd';
import AdvancedForm from './AdvancedForm';
import dayjs from 'dayjs';

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
    reminder_type: Yup.string().required('Type is required'),
    reminder_date: Yup.date().required('Date is required'),
    repeat_type: Yup.string().required('Repeat type is required'),
    repeat_interval: Yup.number().when('repeat_type', {
        is: (val) => val !== 'none',
        then: Yup.number().required('Interval is required').min(1),
        otherwise: Yup.number().nullable()
    }),
    notification_before: Yup.array().of(
        Yup.object().shape({
            minutes: Yup.number().required('Minutes is required').min(1),
            type: Yup.string().required('Notification type is required')
        })
    )
});

const ReminderForm = ({
    isSubmitting,
    onSubmit,
    onCancel,
    initialValues = null,
    reminderType = 'custom',
    relatedId = null,
    assignedTo = null
}) => {
    const reminderTypeOptions = [
        { value: 'followup', label: 'Follow Up' },
        { value: 'task', label: 'Task' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'custom', label: 'Custom' }
    ];

    const repeatTypeOptions = [
        { value: 'none', label: 'No Repeat' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    const notificationTypeOptions = [
        { value: 'email', label: 'Email' },
        { value: 'in_app', label: 'In App' },
        { value: 'both', label: 'Both' }
    ];

    const reminderFields = [
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            placeholder: 'Enter reminder title',
            rules: [{ required: true, message: 'Please enter a title' }],
            span: 24
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter description',
            rows: 4,
            span: 24
        },
        {
            name: 'reminder_type',
            label: 'Type',
            type: 'select',
            placeholder: 'Select reminder type',
            options: reminderTypeOptions,
            disabled: reminderType !== 'custom',
            initialValue: reminderType,
            span: 12
        },
        {
            name: 'reminder_date',
            label: 'Date',
            type: 'custom',
            component: <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />,
            rules: [{ required: true, message: 'Please select a date' }],
            span: 12
        },
        {
            name: 'repeat_type',
            label: 'Repeat',
            type: 'select',
            placeholder: 'Select repeat type',
            options: repeatTypeOptions,
            initialValue: 'none',
            span: 12
        },
        {
            name: 'repeat_interval',
            label: 'Repeat Interval',
            type: 'custom',
            component: <InputNumber min={1} />,
            placeholder: 'Enter interval',
            span: 12,
            dependencies: ['repeat_type'],
            shouldRender: (values) => values.repeat_type !== 'none'
        },
        {
            name: 'notification_before',
            label: 'Notify Before',
            type: 'custom',
            component: (
                <Form.List name="notification_before" initialValue={[{ minutes: 15, type: 'in_app' }]}>
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field, index) => (
                                <div key={field.key} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <Form.Item {...field} name={[field.name, 'minutes']} style={{ flex: 1, margin: 0 }}>
                                        <InputNumber min={1} placeholder="Minutes" />
                                    </Form.Item>
                                    <Form.Item {...field} name={[field.name, 'type']} style={{ flex: 1, margin: 0 }}>
                                        <Select options={notificationTypeOptions} />
                                    </Form.Item>
                                </div>
                            ))}
                        </>
                    )}
                </Form.List>
            ),
            span: 24
        }
    ];

    const handleSubmit = (values) => {
        const processedValues = {
            ...values,
            reminder_date: values.reminder_date.format('YYYY-MM-DD HH:mm:ss'),
            related_id: relatedId,
            assigned_to: assignedTo
        };
        onSubmit(processedValues);
    };

    const defaultValues = {
        title: '',
        description: '',
        reminder_type: reminderType,
        reminder_date: dayjs(),
        repeat_type: 'none',
        notification_before: [{ minutes: 15, type: 'in_app' }]
    };

    const formInitialValues = initialValues || defaultValues;

    return (
        <AdvancedForm
            initialValues={formInitialValues}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={reminderFields}
            validationSchema={validationSchema}
            isSubmitting={isSubmitting}
            submitButtonText={initialValues ? 'Update Reminder' : 'Set Reminder'}
            cancelButtonText="Cancel"
            layout="vertical"
        />
    );
};

export default ReminderForm; 