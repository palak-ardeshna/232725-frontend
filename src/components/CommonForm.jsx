import React, { useEffect } from 'react';
import { Form, Button, Space } from 'antd';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    }
};

const CommonForm = ({
    initialValues,
    isSubmitting,
    onSubmit,
    onCancel,
    form: externalForm,
    children,
    submitButtonText,
    cancelButtonText,
    layout = 'vertical',
    className = '',
}) => {
    const [form] = Form.useForm();
    const formInstance = externalForm || form;
    const isEditing = !!initialValues;

    useEffect(() => {
        if (initialValues) {
            formInstance.setFieldsValue(initialValues);
        } else {
            formInstance.resetFields();
        }
    }, [initialValues, formInstance]);

    const handleSubmit = (values) => {
        onSubmit(values);
    };

    return (
        <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
        >
            <Form
                form={formInstance}
                layout={layout}
                onFinish={handleSubmit}
                className={`${className}`}
            >
                {children}

                <motion.div
                    className="form-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <Space size={16}>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                                onClick={onCancel}
                                className="btn btn-secondary"
                                type="default"
                                disabled={isSubmitting}
                            >
                                {cancelButtonText || 'Cancel'}
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isSubmitting}
                                className="btn btn-primary"
                            >
                                {submitButtonText || (isEditing ? 'Update' : 'Create')}
                            </Button>
                        </motion.div>
                    </Space>
                </motion.div>
            </Form>
        </motion.div>
    );
};

CommonForm.propTypes = {
    initialValues: PropTypes.object,
    isSubmitting: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    form: PropTypes.object,
    children: PropTypes.node.isRequired,
    submitButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    layout: PropTypes.oneOf(['horizontal', 'vertical', 'inline']),
    className: PropTypes.string,
};

export default CommonForm; 