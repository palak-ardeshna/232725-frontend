import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Switch, Checkbox, Radio, Row, Col } from 'antd';
import PropTypes from 'prop-types';
import CommonForm from './CommonForm';

export const ModalTitle = ({ icon, title }) => {
    let IconComponent = null;
    if (icon) {
        if (typeof icon === 'function') {
            const Icon = icon;
            IconComponent = <Icon />;
        } else {
            IconComponent = icon;
        }
    }

    return (
        <div className="modal-header">
            <div className="modal-header-title">
                {IconComponent} {title}
            </div>
        </div>
    );
};

ModalTitle.propTypes = {
    icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.node]),
    title: PropTypes.string.isRequired
};

const AdvancedForm = ({
    initialValues,
    isSubmitting,
    onSubmit,
    onCancel,
    fields,
    title,
    submitButtonText,
    cancelButtonText,
    layout = 'vertical',
    className = '',

    validationSchema = null,
    form: externalForm,
    resetOnSubmit = false,
    formRef,
}) => {
    const [form] = Form.useForm();
    const formInstance = externalForm || form;

    useEffect(() => {
        if (formRef && typeof formRef === 'function') {
            formRef(formInstance);
        }
    }, [formInstance, formRef]);

    const isEditing = !!initialValues;

    const handleSubmit = async (values) => {
        try {
            if (validationSchema) {
                await validationSchema.validate(values, { abortEarly: false });
            }
            onSubmit(values);

            if (resetOnSubmit && !isEditing) {
                formInstance.resetFields();
            }
        } catch (error) {
            if (error.inner) {
                const fieldErrors = {};
                error.inner.forEach(err => {
                    fieldErrors[err.path] = err.message;
                });
                formInstance.setFields(
                    Object.entries(fieldErrors).map(([name, errors]) => ({
                        name,
                        errors: [errors]
                    }))
                );
                return;
            }
        }
    };

    const renderField = (field) => {
        const {
            name,
            label,
            type = 'text',
            placeholder,
            rules = [],
            options = [],
            rows,
            min,
            max,
            step,
            disabled = false,
            dependencies = [],
            showWhen = null,
            span = 24,
            hidden = false,
            ...rest
        } = field;

        // Don't render hidden fields visually
        if (type === 'hidden' || hidden === true) {
            return (
                <Form.Item
                    name={name}
                    style={{ display: 'none' }}
                    noStyle
                >
                    <Input type="hidden" />
                </Form.Item>
            );
        }

        if (showWhen && dependencies.length > 0) {
            return (
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => {
                        return dependencies.some(
                            dep => prevValues[dep] !== currentValues[dep]
                        );
                    }}
                >
                    {({ getFieldValue }) => {
                        const show = showWhen(getFieldValue);
                        if (!show) return null;

                        return renderFormItem(field);
                    }}
                </Form.Item>
            );
        }

        return renderFormItem(field);
    };

    const renderFormItem = (field) => {
        const {
            name,
            label,
            type = 'text',
            placeholder,
            rules = [],
            options = [],
            rows,
            min,
            max,
            step,
            disabled = false,
            span = 24,
            render,
            ref,
            ...rest
        } = field;

        let control;

        switch (type) {
            case 'hidden':
                return (
                    <Form.Item
                        name={name}
                        noStyle
                    >
                        <Input type="hidden" />
                    </Form.Item>
                );
            case 'custom':
                if (typeof render === 'function') {
                    control = render();
                } else {
                    control = <Input placeholder={placeholder || `Enter ${label}`} disabled={disabled} {...rest} />;
                }
                break;
            case 'text':
                control = <Input placeholder={placeholder || `Enter ${label}`} disabled={disabled} {...rest} />;
                break;
            case 'password':
                control = <Input.Password
                    placeholder={placeholder || `Enter ${label}`}
                    disabled={disabled}
                    autoComplete="new-password"
                    {...rest}
                />;
                break;
            case 'textarea':
                control = (
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Input.TextArea
                            placeholder={placeholder || `Enter ${label}`}
                            rows={rows || 4}
                            disabled={disabled}
                            style={{ flex: 1 }}
                            ref={ref}
                            id={`textarea-${name}`}
                            data-name={name}
                            {...rest}
                        />
                        {field.addonAfter && <div style={{ marginLeft: '10px', marginTop: '5px' }}>{field.addonAfter}</div>}
                    </div>
                );
                break;
            case 'number':
                control = <InputNumber
                    placeholder={placeholder || `Enter ${label}`}
                    min={min}
                    max={max}
                    step={step || 1}
                    disabled={disabled}
                    style={{ width: '100%' }}
                    {...rest}
                />;
                break;
            case 'select':
                control = (
                    <Select
                        placeholder={placeholder || `Select ${label}`}
                        disabled={disabled}
                        optionLabelProp={field.optionLabelProp}
                        popupRender={field.popupRender}
                        {...rest}
                    >
                        {options.map(option => (
                            <Select.Option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                {...(option.selectedLabel ? { selectedLabel: option.selectedLabel } : {})}
                            >
                                {option.customContent || option.label}
                            </Select.Option>
                        ))}
                    </Select>
                );
                break;
            case 'date':
                control = <DatePicker
                    placeholder={placeholder || `Select ${label}`}
                    style={{ width: '100%' }}
                    disabled={disabled}
                    {...rest}
                />;
                break;
            case 'switch':
                control = <Switch disabled={disabled} {...rest} />;
                break;
            case 'checkbox':
                control = <Checkbox disabled={disabled} {...rest}>{label}</Checkbox>;
                break;
            case 'radio':
                control = (
                    <Radio.Group disabled={disabled} {...rest}>
                        {options.map(option => (
                            <Radio key={option.value} value={option.value}>
                                {option.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                );
                break;
            default:
                control = <Input placeholder={placeholder || `Enter ${label}`} disabled={disabled} {...rest} />;
        }

        return (
            <Col span={span}>
                <Form.Item
                    name={name}
                    label={type !== 'checkbox' ? label : null}
                    rules={rules}
                    valuePropName={type === 'switch' || type === 'checkbox' ? 'checked' : 'value'}
                >
                    {control}
                </Form.Item>
            </Col>
        );
    };

    return (
        <div className={`advanced-form-container ${className}`}>
            {title && <h2 className="form-title">{title}</h2>}

            <CommonForm
                initialValues={initialValues}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                form={formInstance}
                submitButtonText={submitButtonText || (initialValues && initialValues.id && !initialValues._isNewProject ? 'Update' : 'Create')}
                cancelButtonText={cancelButtonText}
                layout={layout}
                className={`advanced-form ${className}`}
            >
                <Row gutter={16}>
                    {fields.map((field, index) => (
                        <React.Fragment key={field.name || index}>
                            {renderField(field)}
                        </React.Fragment>
                    ))}
                </Row>
            </CommonForm>
        </div>
    );
};

AdvancedForm.propTypes = {
    initialValues: PropTypes.object,
    isSubmitting: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    fields: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            type: PropTypes.oneOf([
                'text', 'password', 'textarea', 'number',
                'select', 'date', 'switch', 'checkbox', 'radio', 'custom', 'hidden'
            ]),
            placeholder: PropTypes.string,
            rules: PropTypes.array,
            options: PropTypes.arrayOf(
                PropTypes.shape({
                    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
                    value: PropTypes.any.isRequired,
                    disabled: PropTypes.bool,
                    customContent: PropTypes.node,
                    selectedLabel: PropTypes.string
                })
            ),
            rows: PropTypes.number,
            min: PropTypes.number,
            max: PropTypes.number,
            step: PropTypes.number,
            disabled: PropTypes.bool,
            dependencies: PropTypes.array,
            showWhen: PropTypes.func,
            span: PropTypes.number,
            optionLabelProp: PropTypes.string,
            popupRender: PropTypes.func
        })
    ).isRequired,
    title: PropTypes.string,
    submitButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    layout: PropTypes.oneOf(['horizontal', 'vertical', 'inline']),
    className: PropTypes.string,

    validationSchema: PropTypes.object,
    form: PropTypes.object,
    resetOnSubmit: PropTypes.bool,
    formRef: PropTypes.func
};

export default AdvancedForm; 