import React, { useState, useEffect, useCallback } from 'react';
import { Modal, message, Select, Button, DatePicker } from 'antd';
import { PlusOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { RiSettings3Line } from 'react-icons/ri';
import SettingsForm from './components/SettingsForm';
import SettingsView from './components/SettingsView';
import SettingsList from './components/SettingsList';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import { settingApi } from '../../../../config/api/apiServices';
import dayjs from 'dayjs';
import './components/settingsView.scss';

const { MonthPicker } = DatePicker;
const { Option } = Select;

const YearSelector = ({ selectedYear, onChange }) => {
    const currentYear = dayjs().year();

    return (
        <Select
            value={selectedYear || currentYear}
            onChange={onChange}
            className="year-selector"
            style={{ width: 80 }}
            suffixIcon={<CalendarOutlined />}
            popupMatchSelectWidth={false}
            options={[
                { value: currentYear - 2, label: currentYear - 2 },
                { value: currentYear - 1, label: currentYear - 1 },
                { value: currentYear, label: currentYear },
                { value: currentYear + 1, label: currentYear + 1 },
                { value: currentYear + 2, label: currentYear + 2 }
            ]}
        />
    );
};

const MonthSelector = ({ selectedMonth, onChange }) => {
    return (
        <MonthPicker
            value={selectedMonth}
            onChange={onChange}
            format="MMMM"
            allowClear={false}
            placeholder="Select Month"
            suffixIcon={<CalendarOutlined />}
            renderExtraFooter={() => null}
        // popupClassName="month-picker-dropdown"
        />
    );
};

const Settings = () => {
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [formKey, setFormKey] = useState(Date.now());
    const [viewMode, setViewMode] = useState('list');
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [monthlySettings, setMonthlySettings] = useState([]);
    const [resetConfirmModal, setResetConfirmModal] = useState({ visible: false, month: null });

    const { data: response, isLoading, refetch } = settingApi.useGetAllQuery({ limit: 100 });

    const [createSettings, { isLoading: isCreating }] = settingApi.useCreateMutation();
    const [updateSettings, { isLoading: isUpdating }] = settingApi.useUpdateMutation();

    // Format number to display as integer or with decimal
    const formatNumber = (value) => {
        if (value === undefined || value === null) return 0;

        // Check if the value is a whole number or has decimal
        const numValue = parseFloat(value);
        if (Number.isInteger(numValue)) {
            return numValue;
        } else {
            // Round to 1 decimal place
            return Math.round(numValue * 10) / 10;
        }
    };

    // Get the first settings object if available
    const settings = response?.data?.items?.[0] || null;
    const hasSettings = !!settings && settings.id !== 'temp';

    // Force refetch when component mounts
    useEffect(() => {
        refetch();
    }, [refetch]);

    // Generate monthly settings data
    useEffect(() => {
        // Create an array for multiple years (5 years total: 2 years back, current year, and 2 years ahead)
        const months = [];
        const currentYear = dayjs().year();
        const startYear = currentYear - 2;
        const endYear = currentYear + 2;

        // Get the monthly settings from the settings object if it exists
        const monthlyData = settings?.monthly_settings || {};

        for (let year = startYear; year <= endYear; year++) {
            for (let month = 0; month < 12; month++) {
                const monthDate = dayjs().month(month).year(year);
                const monthStr = monthDate.format('YYYY-MM');

                // Get month-specific data if available
                const monthData = monthlyData[monthStr] || {
                    working_hours_per_day: 9,
                    half_day_hours: 4.5,
                    total_working_days: 0,
                    full_working_days: 0,
                    half_working_days: 0,
                    total_expected_hours: 0,
                    holidays: { full: 0, half: 0 }
                };

                // Create a copy of settings for this month
                const monthSettings = {
                    ...(settings || {
                        id: 'temp',
                        office_start_time: '09:00:00',
                        office_end_time: '18:00:00',
                        saturday_policy: ['half-day', 'half-day', 'half-day', 'full-day', 'off'],
                        late_threshold: '09:15:00',
                        early_leave_threshold: '17:45:00',
                    }),
                    month: monthDate.format('MMMM YYYY'),
                    monthKey: monthStr,
                    key: `${year}-${month}`,
                    monthData: monthData
                };

                months.push(monthSettings);
            }
        }

        setMonthlySettings(months);
    }, [settings]); // Remove selectedYear from dependencies

    const handleAdd = useCallback(() => {
        setFormKey(Date.now());

        // Create default settings object
        const defaultSettings = {
            office_start_time: '09:00:00',
            office_end_time: '18:00:00',
            saturday_policy: ['half-day', 'half-day', 'half-day', 'full-day', 'off'],
            late_threshold: '09:15:00',
            early_leave_threshold: '17:45:00',
            monthly_settings: {}
        };

        // Add current month data
        const currentMonth = dayjs();
        const monthStr = currentMonth.format('YYYY-MM');
        defaultSettings.monthly_settings[monthStr] = {
            working_hours_per_day: 9,
            half_day_hours: 4.5,
            total_working_days: 0,
            full_working_days: 0,
            half_working_days: 0,
            total_expected_hours: 0,
            holidays: { full: 0, half: 0 }
        };

        setFormModal({ visible: true, data: null, defaultValues: defaultSettings });
    }, []);

    const handleEdit = useCallback((monthData) => {
        setFormKey(Date.now());

        // If no settings exist yet or settings have temp ID, create default settings
        if (!settings || settings.id === 'temp') {
            handleAdd();
            return;
        }

        // Get the monthly settings
        const monthlyData = settings?.monthly_settings || {};

        // Determine which month to edit
        let monthStr;
        let monthDate;

        if (monthData) {
            // If a specific month was clicked, use that month
            monthStr = monthData.monthKey;
            monthDate = dayjs(monthStr, 'YYYY-MM');
        } else if (viewMode === 'grid' && selectedMonth) {
            // If in grid view, use the currently selected month
            monthDate = selectedMonth;
            monthStr = selectedMonth.format('YYYY-MM');
        } else {
            // Default to current month
            monthDate = dayjs();
            monthStr = monthDate.format('YYYY-MM');
        }

        // Use month-specific data if available
        const monthSpecificData = monthlyData[monthStr] || {
            working_hours_per_day: 9,
            half_day_hours: 4.5,
            total_working_days: 0,
            full_working_days: 0,
            half_working_days: 0,
            total_expected_hours: 0,
            holidays: { full: 0, half: 0 }
        };

        // Make sure we pass the holidays_detail to the form
        setFormModal({
            visible: true,
            data: {
                ...settings,
                currentMonth: monthStr,
                monthData: monthSpecificData,
                monthly_settings: monthlyData,
                holidays_detail: settings?.holidays_detail || []
            }
        });
    }, [settings, handleAdd, viewMode, selectedMonth]);

    const handleFormCancel = useCallback(() => {
        setFormModal({ visible: false, data: null });
    }, []);

    const handleFormSubmit = useCallback(async (values) => {
        try {
            if (formModal.data) {
                // Update existing settings
                await updateSettings({
                    id: formModal.data.id,
                    data: values
                }).unwrap();
                message.success('Office settings updated successfully');
            } else {
                // Create new settings
                await createSettings(values).unwrap();
                message.success('Office settings created successfully');
            }
            setFormModal({ visible: false, data: null });
            setTimeout(() => refetch(), 300); // Force refetch to ensure we have the latest data
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} settings: ${error.data?.message || error.message}`);
        }
    }, [formModal, createSettings, updateSettings, refetch]);

    const handleYearChange = useCallback((year) => {
        setSelectedYear(year);
        // Update the selected month to maintain the same month but with new year
        setSelectedMonth(prevMonth => {
            return dayjs().year(year).month(prevMonth.month());
        });
    }, []);

    const handleMonthChange = useCallback((month) => {
        setSelectedMonth(month);
    }, []);

    const handleViewModeChange = useCallback((mode) => {
        setViewMode(mode);
    }, []);

    const handleRowClick = useCallback((record) => {
        const date = dayjs(record.monthKey);
        setSelectedMonth(date);
        setSelectedYear(date.year());

        // Change view mode to grid to show the month overview
        setViewMode('grid');
    }, []);

    // Handle reset confirmation
    const showResetConfirm = useCallback((month) => {
        setResetConfirmModal({ visible: true, month });
    }, []);

    const handleResetConfirm = useCallback(async () => {
        if (!resetConfirmModal.month) return;

        try {
            const monthStr = resetConfirmModal.month.format('YYYY-MM');

            if (settings && settings.id !== 'temp') {
                const monthlyData = settings.monthly_settings || {};

                // Create a new monthly settings object with the month reset to default values
                const newMonthlySettings = { ...monthlyData };

                // Set default values for the month
                newMonthlySettings[monthStr] = {
                    working_hours_per_day: 9,
                    half_day_hours: 4.5,
                    total_working_days: 0,
                    full_working_days: 0,
                    half_working_days: 0,
                    total_expected_hours: 0,
                    holidays: { full: 0, half: 0 }
                };

                // Update the settings with the new monthly settings
                await updateSettings({
                    id: settings.id,
                    data: {
                        ...settings,
                        monthly_settings: newMonthlySettings
                    }
                }).unwrap();
            } else {
                // If no settings exist yet, create default settings
                handleAdd();
            }

            message.success(`Settings for ${resetConfirmModal.month.format('MMMM YYYY')} have been reset to default values`);
            setResetConfirmModal({ visible: false, month: null });
            setTimeout(() => refetch(), 300);
        } catch (error) {
            message.error(`Failed to reset settings: ${error.data?.message || error.message}`);
        }
    }, [resetConfirmModal, settings, updateSettings, refetch, handleAdd]);

    const handleResetCancel = useCallback(() => {
        setResetConfirmModal({ visible: false, month: null });
    }, []);

    const renderContent = useCallback(() => {
        if (isLoading) {
            return <SettingsView isLoading={true} />;
        }

        if (viewMode === 'grid') {
            // Get the monthly settings
            const monthlyData = settings?.monthly_settings || {};

            // Find settings for current selectedMonth, making sure to respect the selected year
            const selectedMonthWithYear = dayjs().year(selectedYear).month(selectedMonth.month());
            const monthStr = selectedMonthWithYear.format('YYYY-MM');

            // Use month-specific data if available
            const monthSpecificData = monthlyData[monthStr] || {
                working_hours_per_day: 9,
                half_day_hours: 4.5,
                total_working_days: 0,
                full_working_days: 0,
                half_working_days: 0,
                total_expected_hours: 0,
                holidays: { full: 0, half: 0 }
            };

            const currentMonthSettings = {
                ...(settings || {
                    id: 'temp',
                    office_start_time: '09:00:00',
                    office_end_time: '18:00:00',
                    saturday_policy: ['half-day', 'half-day', 'half-day', 'full-day', 'off'],
                    late_threshold: '09:15:00',
                    early_leave_threshold: '17:45:00',
                }),
                monthData: monthSpecificData
            };

            // Create the month selector component to pass to the SettingsView
            const monthSelectorComponent = (
                <MonthSelector
                    selectedMonth={selectedMonthWithYear}
                    onChange={handleMonthChange}
                />
            );

            return (
                <div className="settings-view-container">
                    <SettingsView
                        settings={currentMonthSettings}
                        selectedMonth={selectedMonthWithYear}
                        monthSelector={monthSelectorComponent}
                    />
                </div>
            );
        }

        // Filter monthlySettings to show only the selected year
        const filteredSettings = monthlySettings.filter(
            setting => dayjs(setting.monthKey).year() === selectedYear
        );

        // Use the monthlySettings state which now contains 5 years of data
        return (
            <SettingsList
                settings={filteredSettings}
                onEdit={hasSettings ? handleEdit : handleAdd}
                onRowClick={handleRowClick}
                loading={isLoading}
                onReset={(record) => showResetConfirm(dayjs(record.monthKey))}
            />
        );
    }, [viewMode, settings, isLoading, selectedMonth, selectedYear, monthlySettings, handleEdit, handleRowClick, handleMonthChange, showResetConfirm, hasSettings, handleAdd]);

    // Custom action button for edit or add
    const actionButtons = (
        <Button
            type="primary"
            icon={hasSettings ? <EditOutlined /> : <PlusOutlined />}
            onClick={hasSettings ? () => handleEdit() : handleAdd}
            className="btn btn-primary"
        >
            {hasSettings ? 'Edit Settings' : 'Add Settings'}
        </Button>
    );

    // Extra header content for year selector
    const extraHeaderContent = (
        <YearSelector
            selectedYear={selectedYear}
            onChange={handleYearChange}
        />
    );

    return (
        <ModuleLayout
            module="settings"
            title="Office Settings"
            showAddButton={false}
            className="settings"
            actionButtons={actionButtons}
            showViewToggle={true}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            extraHeaderContent={extraHeaderContent}
            extraHeaderPosition="left"
        >
            {renderContent()}

            <Modal
                title={<ModalTitle icon={<RiSettings3Line />} title={formModal.data ? 'Edit Office Settings' : 'Add Office Settings'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="settings-modal"
                maskClosable={false}
                destroyOnClose={true}
            >
                <SettingsForm
                    key={formKey}
                    initialValues={formModal.data || formModal.defaultValues}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <Modal
                title="Reset Month Settings"
                open={resetConfirmModal.visible}
                onOk={handleResetConfirm}
                onCancel={handleResetCancel}
                okText="Reset"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <p>Are you sure you want to reset settings for {resetConfirmModal.month?.format('MMMM YYYY')}?</p>
                <p>All values will be set to default (zero) values. This action cannot be undone.</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Settings; 