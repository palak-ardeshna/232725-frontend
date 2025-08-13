import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Dropdown, Input, Button, Space, Empty } from 'antd';
import { SearchOutlined, MoreOutlined, FilterOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionGuard from './PermissionGuard';
import { withPermissionCheck } from '../utils/tableUtils';
import { useSelector } from 'react-redux';
import { parsePermissions, hasPermission } from '../utils/permissionUtils.jsx';
import { publicModules } from '../config/permissions';

const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.5 }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.3 }
    }
};

const CommonTable = ({
    data = [],
    columns = [],
    isLoading = false,
    pagination = {
        current: 1,
        pageSize: 10,
        total: 0,
        onChange: () => { },
    },
    actionItems = [],
    extraProps = {},
    searchableColumns = [],
    dateColumns = [],
    rowSelection = false,
    onBulkDelete = null,
    module = '',
    getActionItems,
    onRowClick
}) => {

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [hasDeletePermission, setHasDeletePermission] = useState(false);

    // Get user permissions
    const user = useSelector(state => state.auth?.user);
    const userType = user?.userType;
    const permissions = parsePermissions(user?.permissions);

    // Check if user has delete permission for this module
    useEffect(() => {
        if (!module) return;

        // Check if module is public or user has permission
        const isPublic = publicModules.includes(module);
        const newPermissionValue = userType === 'admin' || userType === 'superadmin' || isPublic || permissions?.[module]?.['delete'] === true;
        
        if (hasDeletePermission !== newPermissionValue) {
            setHasDeletePermission(newPermissionValue);

            // If user doesn't have delete permission, reset selected rows
            if (!newPermissionValue) {
                setSelectedRowKeys([]);
                setShowBulkActions(false);
            }
        }
    }, [userType, permissions, module, hasDeletePermission]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setSelectedRowKeys([]);
        setShowBulkActions(false);
    }, [data]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const handleSearch = useCallback((selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    }, []);

    const handleReset = useCallback((clearFilters, confirm) => {
        clearFilters();
        setSearchText('');
        confirm();
    }, []);

    const handleSelectChange = useCallback((selectedKeys) => {
        setSelectedRowKeys(selectedKeys);
        setShowBulkActions(selectedKeys.length > 0);
    }, []);

    const handleBulkDelete = useCallback(() => {
        if (onBulkDelete && selectedRowKeys.length > 0) {
            onBulkDelete(selectedRowKeys);
        }
    }, [onBulkDelete, selectedRowKeys]);

    // Create a stable reference for the filter dropdown component
    const FilterDropdown = useCallback(({ setSelectedKeys, selectedKeys, confirm, clearFilters, dataIndex }) => (
        <div style={{ padding: 8 }}>
            <Input
                placeholder={`Search ${dataIndex}`}
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
                <Button
                    type="primary"
                    onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    icon={<SearchOutlined />}
                    className="btn btn-filter btn-primary"
                    size="small"
                >
                    Search
                </Button>
                <Button
                    onClick={() => handleReset(clearFilters, confirm)}
                    className="btn btn-filter btn-reset"
                    size="small"
                >
                    Reset
                </Button>
            </Space>
        </div>
    ), [handleSearch, handleReset]);

    const getColumnSearchProps = useCallback((dataIndex) => ({
        filterDropdown: (props) => <FilterDropdown {...props} dataIndex={dataIndex} />,
        filterIcon: filtered => (
            <SearchOutlined style={{ color: filtered ? 'var(--primary-color)' : undefined }} />
        ),
        onFilter: (value, record) => {
            if (dataIndex === 'source') {
                return record[dataIndex] === value;
            }

            return record[dataIndex]
                ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
                : '';
        },
        filteredValue: searchedColumn === dataIndex ? [searchText] : null
    }), [FilterDropdown, searchedColumn, searchText]);

    // Process action items
    const processedActionItems = useMemo(() => {
        if (!actionItems || !Array.isArray(actionItems)) {
            return [];
        }

        return actionItems.filter(item => {
            // Check if the item should be shown based on permissions
            if (item.module && item.permission) {
                return hasPermission(userType, permissions, item.module, item.permission);
            }
            return true;
        });
    }, [actionItems, userType, permissions]);

    // Prepare columns with search and filter functionality - use useMemo to prevent recreation on every render
    const enhancedColumns = useMemo(() => {
        const processedColumns = columns.map(column => {
            let enhancedColumn = { ...column };
            const dataIndex = column.dataIndex || column.name;

            if (searchableColumns.includes(dataIndex)) {
                enhancedColumn = {
                    ...enhancedColumn,
                    ...getColumnSearchProps(dataIndex)
                };
            }

            if (column.filters) {
                enhancedColumn.filterIcon = filtered => (
                    <FilterOutlined style={{ color: filtered ? 'var(--primary-color)' : undefined }} />
                );
            }

            if (dateColumns.includes(dataIndex) && !column.render) {
                enhancedColumn.render = (value, record) => {
                    const dateValue = value || (column.fallbackField && record[column.fallbackField]);
                    return formatDate(dateValue);
                };
            }

            return enhancedColumn;
        });

        // Add actions column if needed
        const finalColumns = [...processedColumns];

        if (processedActionItems.length > 0) {
            finalColumns.push({
                title: 'Actions',
                key: 'actions',
                width: 80,
                className: 'action-column',
                render: (_, record) => {
                    // Filter items based on shouldShow property
                    const visibleItems = processedActionItems
                        .filter(action => !action.shouldShow || action.shouldShow(record))
                        .map(action => ({
                            key: action.key,
                            icon: action.icon,
                            danger: action.danger,
                            label: action.label,
                            onClick: (e) => {
                                // Stop propagation to prevent row click
                                if (e && e.domEvent) {
                                    e.domEvent.stopPropagation();
                                } else if (e) {
                                    e.stopPropagation();
                                }

                                if (action.handler) {
                                    action.handler(record);
                                }
                            }
                        }));

                    if (visibleItems.length === 0) {
                        return null;
                    }

                    return (
                        <Dropdown
                            menu={{ items: visibleItems }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <motion.button
                                className="btn btn-icon btn-ghost"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <MoreOutlined />
                            </motion.button>
                        </Dropdown>
                    );
                }
            });
        }

        return finalColumns;
    }, [columns, searchableColumns, dateColumns, getColumnSearchProps, formatDate, processedActionItems]);

    // Prepare row props to handle row click
    const getRowProps = (record) => {
        const props = {};

        if (onRowClick) {
            props.onClick = () => onRowClick(record);
            props.style = { cursor: 'pointer' };
        }

        return props;
    };

    // Check if module is a public module
    const isPublicModule = useMemo(() => {
        return publicModules.includes(module);
    }, [module]);

    // Configure row selection based on rowSelection prop and permissions
    const rowSelectionConfig = rowSelection ? {
        selectedRowKeys,
        onChange: handleSelectChange,
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE
        ],
        getCheckboxProps: (record) => ({
            disabled: typeof rowSelection === 'object' && rowSelection.permission
                ? !hasPermission(userType, permissions, rowSelection.module || module, rowSelection.permission)
                : typeof rowSelection === 'function'
                    ? !rowSelection(record)
                    : record.created_by === 'SYSTEM',
            name: record.name,
        }),
    } : undefined;

    return (
        <motion.div
            className="common-table"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {showBulkActions && (hasDeletePermission || isPublicModule) && (
                <div className="bulk-actions">
                    <span className="selected-count">{selectedRowKeys.length} items selected</span>
                    <Space>
                        {isPublicModule ? (
                            <motion.button
                                className="btn btn-danger-outline bulk-delete-btn"
                                onClick={handleBulkDelete}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <DeleteOutlined /> Bulk Delete
                            </motion.button>
                        ) : (
                            <PermissionGuard module={module} action="delete">
                                <motion.button
                                    className="btn btn-danger-outline bulk-delete-btn"
                                    onClick={handleBulkDelete}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <DeleteOutlined /> Bulk Delete
                                </motion.button>
                            </PermissionGuard>
                        )}
                    </Space>
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${pagination.current}-${pagination.pageSize}`}
                    className="table-scroll-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Table
                        columns={enhancedColumns}
                        dataSource={data}
                        rowKey="id"
                        loading={isLoading}
                        onChange={(newPagination, filters, sorter) => {
                            pagination.onChange(newPagination.current, newPagination.pageSize);
                        }}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} ${extraProps.itemName || 'items'}`,
                            showQuickJumper: true,
                            position: isMobile ? ['bottomCenter'] : ['bottomRight']
                        }}
                        locale={{
                            emptyText: (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={`No ${extraProps.itemName || 'items'} found`}
                                    />
                                </motion.div>
                            )
                        }}
                        scroll={{ x: 'max-content', y: extraProps.scrollY }}
                        rowSelection={rowSelectionConfig}
                        onRow={getRowProps}
                        {...extraProps}
                    />
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default withPermissionCheck(CommonTable);