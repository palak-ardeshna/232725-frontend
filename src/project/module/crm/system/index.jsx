import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Menu, Spin, Modal } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LineChartOutlined,
    FunnelPlotOutlined,
    FilterOutlined,
    LoadingOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import ModuleLayout from '../../../../components/ModuleLayout';
import { ModalTitle } from '../../../../components/AdvancedForm';
import './system.scss';

const Pipeline = lazy(() => import('./pipeline'));
const Stages = lazy(() => import('./stages'));
const Filter = lazy(() => import('./filter'));

const SYSTEM_MODULES = {
    pipeline: {
        key: 'pipeline',
        label: 'Pipeline',
        icon: <LineChartOutlined />,
        component: Pipeline
    },
    stages: {
        key: 'stages',
        label: 'Stages',
        icon: <FunnelPlotOutlined />,
        component: Stages
    },
    filter: {
        key: 'filter',
        label: 'Filters',
        icon: <FilterOutlined />,
        component: Filter
    }
};

const LoadingSpinner = () => (
    <div className="loading-container">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <span>Loading module...</span>
    </div>
);

export const SystemModule = ({
    title,
    children,
    showViewToggle = true,
    viewMode,
    onViewModeChange,
    onAddClick,
    className = '',
    extraHeaderContent,
    formModal,
    deleteModal,
    viewModal,
    bulkDeleteModal,
    onFormCancel,
    onDeleteCancel,
    onViewCancel,
    onDeleteConfirm,
    onBulkDeleteCancel,
    onBulkDeleteConfirm,
    isDeleting,
    formTitle,
    formIcon,
    deleteTitle,
    deleteItemName,
    bulkDeleteTitle,
    viewTitle,
    formContent,
    viewContent
}) => {
    return (
        <ModuleLayout
            title={title}
            showViewToggle={showViewToggle}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onAddClick={onAddClick}
            className={className}
            extraHeaderContent={extraHeaderContent}
        >
            {children}

            {formModal && (
                <Modal
                    title={<ModalTitle icon={formIcon} title={formTitle} />}
                    open={formModal.visible}
                    onCancel={onFormCancel}
                    footer={null}
                    width={500}
                    className="modal"
                    maskClosable={true}
                    styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
                >
                    {formContent}
                </Modal>
            )}

            {viewModal && viewContent && (
                <Modal
                    title={<ModalTitle icon={viewModal.icon} title={viewTitle} />}
                    open={viewModal.visible}
                    onCancel={onViewCancel}
                    footer={null}
                    width={800}
                    className="modal"
                    maskClosable={true}
                >
                    {viewContent}
                </Modal>
            )}

            {deleteModal && (
                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title={deleteTitle} />}
                    open={deleteModal.visible}
                    onOk={onDeleteConfirm}
                    onCancel={onDeleteCancel}
                    okText="Delete"
                    cancelText="Cancel"
                    className="delete-modal"
                    centered
                    maskClosable={false}
                    okButtonProps={{
                        danger: true,
                        loading: isDeleting
                    }}
                >
                    <p>Are you sure you want to delete {deleteItemName} "{deleteModal.data?.name}"?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            )}

            {bulkDeleteModal && (
                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title={bulkDeleteTitle || `Bulk Delete ${deleteItemName}s`} />}
                    open={bulkDeleteModal.visible}
                    onOk={onBulkDeleteConfirm}
                    onCancel={onBulkDeleteCancel}
                    okText="Delete All"
                    cancelText="Cancel"
                    className="delete-modal"
                    centered
                    maskClosable={false}
                    okButtonProps={{
                        danger: true,
                        loading: isDeleting
                    }}
                >
                    <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected {deleteItemName}s?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            )}
        </ModuleLayout>
    );
};

const System = () => {
    const navigate = useNavigate();
    const { name } = useParams();
    const [menuMode, setMenuMode] = useState('inline');
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 1024;
            setMenuMode(isMobile ? 'horizontal' : 'inline');
            setIsMobileView(isMobile);
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentModule = name ? SYSTEM_MODULES[name] : SYSTEM_MODULES.pipeline;
    const CurrentComponent = currentModule?.component || Pipeline;

    const handleMenuClick = (key) => {
        navigate(`/admin/crm/system/${key}`);
    };

    const getMenuContainerStyle = () => {
        if (isMobileView) {
            return {
                display: 'flex',
                justifyContent: 'flex-start',
                width: '100%',
                maxWidth: '100%',
                background: 'var(--bg-primary)',
                padding: '0',
                overflow: 'hidden',
                borderBottom: '1px solid var(--border-color)',
                borderRadius: '8px 8px 0 0',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
                marginBottom: '16px'
            };
        }
        return {
            width: '300px',
            minWidth: '300px',
            height: '100%'
        };
    };

    return (
        <div className="system-container">
            <div style={getMenuContainerStyle()} className="menu-container">
                <Menu
                    mode={menuMode}
                    className="system-menu"
                    selectedKeys={[currentModule?.key || 'pipeline']}
                    disabledOverflow={true}
                    overflowedIndicator={null}
                    style={{
                        paddingLeft: isMobileView ? 0 : '14px',
                        width: '100%',
                        borderBottom: 'none'
                    }}
                    items={Object.values(SYSTEM_MODULES).map(module => ({
                        key: module.key,
                        icon: module.icon,
                        label: module.label,
                        onClick: () => handleMenuClick(module.key)
                    }))}
                />
            </div>
            <div className="system-content">
                <Suspense fallback={<LoadingSpinner />}>
                    <CurrentComponent />
                </Suspense>
            </div>
        </div>
    );
};

export default System; 