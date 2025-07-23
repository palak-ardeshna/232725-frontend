import React, { useState, useMemo } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { RiContactsLine } from 'react-icons/ri';
import ContactList from './components/ContactList';
import ContactForm from './components/ContactForm';
import ContactView from './components/ContactView';
import { ModalTitle } from '../../../../components/AdvancedForm';
import ModuleLayout from '../../../../components/ModuleLayout';
import {
    useGetContactsQuery,
    useDeleteContactMutation,
    useGetContactQuery,
    useCreateContactMutation,
    useUpdateContactMutation,
    useGetLeadsQuery
} from '../../../../config/api/apiServices';
import './contact.scss';

const Contact = () => {
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [viewModal, setViewModal] = useState({ visible: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [convertToClientModal, setConvertToClientModal] = useState({ visible: false, data: null });
    const [formKey, setFormKey] = useState(Date.now());

    const { data: response, isLoading } = useGetContactsQuery({
        page: currentPage,
        limit: pageSize,
        isClient: false // This ensures we only get contacts, not clients
    });

    const { data: leadsResponse, isLoading: isLoadingLeads } = useGetLeadsQuery({ limit: 'all' });

    const { data: viewingContactResponse, isLoading: isViewLoading } = useGetContactQuery(
        viewModal.id,
        { skip: !viewModal.id }
    );

    const viewingContact = viewingContactResponse?.data;

    const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();
    const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
    const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();

    const contacts = response?.data?.items || [];
    const leads = leadsResponse?.data?.items || [];
    const total = response?.data?.total || 0;
    const currentPageFromServer = response?.data?.currentPage || 1;

    const contactsWithLeadCount = useMemo(() => {
        if (!contacts.length || !leads.length) {
            return contacts;
        }

        return contacts.map(contact => {
            const contactLeads = leads.filter(lead => lead.contact === contact.id);
            return {
                ...contact,
                leadCount: contactLeads.length
            };
        });
    }, [contacts, leads]);

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleAdd = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (contact) => setFormModal({ visible: true, data: contact });
    const handleView = (contact) => {
        setViewModal({ visible: true, id: contact.id });
    };
    const handleDelete = (contact) => setDeleteModal({ visible: true, data: contact });
    const handleConvertToClient = (contact) => setConvertToClientModal({ visible: true, data: contact });

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleViewCancel = () => setViewModal({ visible: false, id: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });
    const handleConvertToClientCancel = () => setConvertToClientModal({ visible: false, data: null });

    const handleFormSubmit = async (values) => {
        try {
            const contactData = {
                ...values,
                isClient: false
            };

            if (formModal.data) {
                await updateContact({
                    id: formModal.data.id,
                    data: contactData
                }).unwrap();
                message.success('Contact updated successfully');
            } else {
                await createContact(contactData).unwrap();
                message.success('Contact created successfully');
            }
            setFormModal({ visible: false, data: null });
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'create'} contact: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteContact(deleteModal.data.id).unwrap();
            message.success('Contact deleted successfully');
            setDeleteModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to delete contact');
        }
    };

    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteContact(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} contact${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} contact${errorCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const handleConvertToClientConfirm = async () => {
        try {
            const { data: contact } = convertToClientModal;
            if (!contact) return;

            await updateContact({
                id: contact.id,
                data: {
                    ...contact,
                    isClient: true
                }
            }).unwrap();

            message.success(`${contact.name} has been converted to a client successfully`);
            setConvertToClientModal({ visible: false, data: null });
        } catch (error) {
            message.error('Failed to convert contact to client');
        }
    };

    return (
        <ModuleLayout
            title="Contacts"
            showViewToggle={true}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onAddClick={handleAdd}
            className="contact"
            module="contact"
        >
            <ContactList
                contacts={contactsWithLeadCount}
                isLoading={isLoading || isLoadingLeads}
                viewMode={viewMode}
                pagination={{
                    current: currentPageFromServer,
                    pageSize: pageSize,
                    total: total,
                    onChange: handlePageChange
                }}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onConvertToClient={handleConvertToClient}
            />

            <Modal
                title={<ModalTitle icon={RiContactsLine} title={formModal.data ? 'Edit Contact' : 'Add Contact'} />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={700}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <ContactForm
                    key={formKey}
                    initialValues={formModal.data}
                    isSubmitting={isCreating || isUpdating}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>

            <ContactView
                contact={viewingContact}
                isLoading={isViewLoading}
                visible={viewModal.visible}
                onClose={handleViewCancel}
            />

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Contact" />}
                open={deleteModal.visible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
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
                <p>Are you sure you want to delete contact "{deleteModal.data?.name}"?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Contacts" />}
                open={bulkDeleteModal.visible}
                onOk={handleBulkDeleteConfirm}
                onCancel={handleBulkDeleteCancel}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected contacts?</p>
                <p>This action cannot be undone.</p>
            </Modal>

            <Modal
                title={<ModalTitle icon={<UserAddOutlined />} title="Convert to Client" />}
                open={convertToClientModal.visible}
                onOk={handleConvertToClientConfirm}
                onCancel={handleConvertToClientCancel}
                okText="Convert"
                cancelText="Cancel"
                className="convert-modal"
                centered
                maskClosable={false}
                okButtonProps={{
                    loading: isUpdating
                }}
            >
                <p>Are you sure you want to convert "{convertToClientModal.data?.name}" to a client?</p>
            </Modal>
        </ModuleLayout>
    );
};

export default Contact;