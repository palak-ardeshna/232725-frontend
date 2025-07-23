import React from 'react';
import { Empty, Pagination } from 'antd';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, type: "spring", stiffness: 100 }
    }
};

const ModuleGrid = ({
    items = [],
    renderItem,
    isLoading = false,
    emptyMessage = "No items found",
    className = "",
    pagination
}) => {
    if (items.length === 0 && !isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ overflow: "visible" }}
            >
                <Empty
                    className="empty-state"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={emptyMessage}
                />
            </motion.div>
        );
    }

    return (
        <motion.div
            className={`module-grid-container ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ overflow: "visible" }}
        >
            <div className="module-grid">
                {items.map((item, index) => (
                    <motion.div
                        key={item.id || index}
                        variants={itemVariants}
                        style={{ overflow: "visible" }}
                    >
                        {renderItem(item, index)}
                    </motion.div>
                ))}
            </div>

            {pagination && (
                <motion.div
                    className="grid-pagination"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={pagination.onChange}
                        showSizeChanger={pagination.showSizeChanger}
                        showTotal={pagination.showTotal}
                        showQuickJumper={pagination.showQuickJumper}
                    />
                </motion.div>
            )}
        </motion.div>
    );
};

ModuleGrid.propTypes = {
    items: PropTypes.array.isRequired,
    renderItem: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    emptyMessage: PropTypes.string,
    className: PropTypes.string,
    pagination: PropTypes.shape({
        current: PropTypes.number,
        pageSize: PropTypes.number,
        total: PropTypes.number,
        onChange: PropTypes.func,
        showSizeChanger: PropTypes.bool,
        showTotal: PropTypes.func,
        showQuickJumper: PropTypes.bool
    })
};

export default ModuleGrid; 