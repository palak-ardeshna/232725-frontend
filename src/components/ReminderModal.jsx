import React from 'react';
import { Modal, Form, DatePicker, TimePicker, Input, Button, Space, Switch, InputNumber, message, Radio } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { ModalTitle } from './AdvancedForm';
import { useTheme } from '../common/theme/ThemeContext';
import { useGetRemindersQuery } from '../config/api/apiServices';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const { TextArea } = Input;

const ReminderModal = ({
    visible,
    onCancel,
    onSubmit,
    initialValues = null,
    isSubmitting = false,
    relatedId = null,
    reminderType = 'task',
    title = 'Set Reminder',
    taskDueDate = null,
    assignedTo = null,
    taskName = '',
    taskDescription = ''
}) => {
    const [form] = Form.useForm();
    const [isCustomMode, setIsCustomMode] = React.useState(false);
    const [isDailyMode, setIsDailyMode] = React.useState(false);
    const { isDark } = useTheme();

    // Fetch existing reminders for this task
    const { data: remindersData } = useGetRemindersQuery({
        related_id: relatedId,
        reminder_type: reminderType
    }, {
        skip: !relatedId
    });

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            let reminderDate, reminderTime;
            let reminderDateTime;

            if (isCustomMode) {
                reminderDate = values.date.format('YYYY-MM-DD');
                reminderTime = values.time.format('HH:mm:ss');
                reminderDateTime = `${reminderDate} ${reminderTime}`;
            } else {
                if (isDailyMode) {
                    // For daily mode, check if due date is in future
                    const tomorrow = dayjs().add(1, 'day');
                    const startDate = dayjs.utc(tomorrow).startOf('day'); // Force UTC midnight
                    const dueDate = dayjs(taskDueDate);
                    const daysDiff = dueDate.diff(startDate, 'day');

                    if (daysDiff <= 0) {
                        message.error('Task due date must be in the future for daily reminders');
                        return;
                    }

                    // Set reminder to start from tomorrow at 00:00 UTC
                    reminderDateTime = startDate.format(); // This will give UTC time
                } else {
                    // Regular days before reminder
                    const dueDate = taskDueDate ? dayjs(taskDueDate) : dayjs();
                    const daysBefore = values.days_before || 1;
                    reminderDate = dueDate.subtract(daysBefore, 'day').format('YYYY-MM-DD');
                    reminderTime = dayjs().set('hour', 9).set('minute', 0).set('second', 0).format('HH:mm:ss');
                    reminderDateTime = `${reminderDate} ${reminderTime}`;
                }
            }

            // Check if a reminder already exists for this date and time
            const existingReminders = remindersData?.data?.items || [];
            const reminderTimestamp = dayjs(reminderDateTime).valueOf();

            // Check for reminders within a 5-minute window
            const hasExistingReminder = existingReminders.some(reminder => {
                const existingTimestamp = dayjs(reminder.reminder_date).valueOf();
                const timeDiff = Math.abs(existingTimestamp - reminderTimestamp);
                const minutesDiff = timeDiff / (1000 * 60);
                return minutesDiff <= 5;
            });

            if (hasExistingReminder) {
                message.warning('Reminder already exists for this time');
                return;
            }

            // Check if reminder date is in the past
            if (dayjs(reminderDateTime).isBefore(dayjs())) {
                message.error('Cannot set reminder for past time');
                return;
            }

            const data = {
                title: isCustomMode ? values.title : `📌 ${taskName}`,
                description: isCustomMode ? values.description :
                    `🔔 ${isDailyMode ? 'Daily Reminder' : 'Task Due Tomorrow'}\n\n` +
                    `📌 ${taskName}\n` +
                    `📝 ${taskDescription}\n\n` +
                    `⏰ Due Date: ${dayjs(taskDueDate).format('DD MMM YYYY')}`,
                reminder_type: reminderType,
                related_id: relatedId,
                reminder_date: reminderDateTime,
                status: 'pending',
                assigned_to: assignedTo?.replace('user_', '').replace('employee_', ''),
                repeat_type: isDailyMode ? 'daily' : 'none',
                repeat_until: isDailyMode ? taskDueDate : null,
                repeat_interval: isDailyMode ? 1 : null
            };

            onSubmit(data);
        } catch (error) {
            // Validation failed - no need for console log
        }
    };

    React.useEffect(() => {
        if (visible && initialValues) {
            const reminderDateTime = dayjs(initialValues.reminder_date);
            form.setFieldsValue({
                title: initialValues.title,
                description: initialValues.description,
                date: reminderDateTime,
                time: reminderDateTime,
                is_custom: true,
                reminder_mode: 'days_before'
            });
            setIsCustomMode(true);
            setIsDailyMode(false);
        } else if (visible) {
            form.resetFields();
            setIsCustomMode(false);
            setIsDailyMode(false);
        }
    }, [visible, initialValues, form]);

    const handleModeChange = (checked) => {
        setIsCustomMode(checked);
        setIsDailyMode(false);
        form.resetFields();
        if (!checked) {
            form.setFieldsValue({
                reminder_mode: 'days_before'
            });
        }
    };

    return (
        <Modal
            open={visible}
            title={<ModalTitle icon={<BellOutlined />} title={title} />}
            onCancel={onCancel}
            footer={null}
            className={`common-modal ${isDark ? 'dark-mode' : ''}`}
            maskClosable={false}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    days_before: 1,
                    is_custom: false,
                    reminder_mode: 'days_before',
                    title: `📌 ${taskName}`,
                    description:
                        `🔔 Task Due Tomorrow\n\n` +
                        `📌 ${taskName}\n` +
                        `📝 ${taskDescription}\n\n` +
                        `⏰ Due Date: ${dayjs(taskDueDate).format('DD MMM YYYY')}`
                }}
            >
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                        {isCustomMode ? 'Switch to Simple' : 'Switch to Custom'}
                    </h3>
                    <Switch
                        checked={isCustomMode}
                        onChange={handleModeChange}
                        checkedChildren="Custom"
                        unCheckedChildren="Simple"
                    />
                </div>

                {!isCustomMode ? (
                    <>
                        <Form.Item
                            name="reminder_mode"
                            label={<span style={{ color: 'var(--text-primary)' }}>Reminder Type</span>}
                        >
                            <Radio.Group onChange={(e) => setIsDailyMode(e.target.value === 'daily')}>
                                <Radio value="days_before">Days Before Due Date</Radio>
                                <Radio value="daily">Daily Until Due Date</Radio>
                            </Radio.Group>
                        </Form.Item>

                        {!isDailyMode && (
                            <Form.Item
                                name="days_before"
                                label={<span style={{ color: 'var(--text-primary)' }}>Remind me before (days)</span>}
                                rules={[
                                    { required: true, message: 'Please enter number of days' },
                                    { type: 'number', min: 1, message: 'Days must be at least 1' }
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    placeholder="Enter days"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        )}
                    </>
                ) : (
                    <>
                        <Form.Item
                            name="title"
                            label={<span style={{ color: 'var(--text-primary)' }}>Reminder Title</span>}
                            rules={[{ required: true, message: 'Please enter a title' }]}
                        >
                            <Input placeholder="Enter reminder title" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label={<span style={{ color: 'var(--text-primary)' }}>Description</span>}
                        >
                            <TextArea rows={4} placeholder="Enter reminder description" />
                        </Form.Item>

                        <Form.Item
                            name="date"
                            label={<span style={{ color: 'var(--text-primary)' }}>Reminder Date</span>}
                            rules={[{ required: true, message: 'Please select a date' }]}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="time"
                            label={<span style={{ color: 'var(--text-primary)' }}>Reminder Time</span>}
                            rules={[{ required: true, message: 'Please select a time' }]}
                        >
                            <TimePicker style={{ width: '100%' }} format="HH:mm" />
                        </Form.Item>
                    </>
                )}

                <div className="form-actions">
                    <Space size={16}>
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
                            Set Reminder
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
};

export default ReminderModal; 