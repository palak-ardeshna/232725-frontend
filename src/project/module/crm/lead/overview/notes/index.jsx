import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FiEdit } from 'react-icons/fi';
import NoteList from './components/NoteList';
import NoteForm from './components/NoteForm';
import { ModalTitle } from '../../../../../../components/AdvancedForm';
import ModuleLayout from '../../../../../../components/ModuleLayout';
import {
    useGetNotesQuery,
    useCreateNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation
} from '../../../../../../config/api/apiServices';
import { useSelector } from 'react-redux';

import './notes.scss';

const NotesTab = ({ lead, customTitle, noteType = 'lead', showOnlyUserNotes = true }) => {

    const leadId = lead?.id;
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });
    const [formKey, setFormKey] = useState(Date.now());

    const { currentUser } = useSelector(state => state.auth);
    const userId = currentUser?.id;

    const { data: notesData, isLoading: isLoadingNotes, refetch, error } = useGetNotesQuery({
        related_id: lead?.id,
        user_id: userId, // Always send user_id to filter by created_by
        page: currentPage,
        limit: pageSize
    }, {
        skip: !leadId,
        refetchOnMountOrArgChange: true
    });

    const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
    const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
    const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();

    const notes = notesData?.data?.items || [];
    const total = notesData?.data?.total || 0;
    const currentPageFromServer = notesData?.data?.currentPage || 1;

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    useEffect(() => {
        if (leadId) {
            refetch();
        }
    }, [leadId, refetch]);
    useEffect(() => {
        if (error) {
            message.error('Error fetching notes');
        }
    }, [error]);

    const handleAdd = () => {
        if (!leadId) {
            message.error(`Cannot add note: ${noteType === 'lead' ? 'Lead' : 'Contact'} information is missing`);
            return;
        }
        setFormKey(Date.now());
        setFormModal({ visible: true, data: null });
    };

    const handleEdit = (note) => {
        // Create a deep copy to avoid reference issues
        const noteData = JSON.parse(JSON.stringify(note));

        // Force reset the form key to ensure re-rendering
        setFormKey(Date.now());

        // Create a clean object with only the fields we need
        const formattedNote = {
            id: noteData.id,
            noteTitle: noteData.noteTitle || '',
            description: noteData.description || '',
            priority: noteData.priority || 'general'
        };

        // Set the modal data
        setFormModal({
            visible: true,
            data: formattedNote
        });
    };

    const handleDelete = (note) => setDeleteModal({ visible: true, data: note });
    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (!leadId) {
                throw new Error(`${noteType === 'lead' ? 'Lead' : 'Contact'} information is missing`);
            }

            if (formModal.data) {
                await updateNote({
                    id: formModal.data.id,
                    data: {
                        ...values,
                        description: values.description,
                        noteType: noteType,
                        user_id: userId
                    }
                }).unwrap();
                message.success('Note updated successfully');
            } else {
                const noteData = {
                    noteTitle: values.noteTitle,
                    description: values.description,
                    noteType: noteType,
                    priority: values.priority,
                    related_id: leadId,
                    user_id: userId
                };
                await createNote(noteData).unwrap();
                message.success('Note added successfully');
            }
            setFormModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || 'An unknown error occurred';
            message.error(`Failed to ${formModal.data ? 'update' : 'add'} note: ${errorMessage}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteNote(deleteModal.data.id).unwrap();
            message.success('Note deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || 'An unknown error occurred';
            message.error(`Failed to delete note: ${errorMessage}`);
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            const { ids } = bulkDeleteModal;
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteNote(id).unwrap();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    message.error(`Error deleting note ${id}`);
                }
            }

            setBulkDeleteModal({ visible: false, ids: [] });

            if (successCount > 0) {
                message.success(`Successfully deleted ${successCount} note${successCount > 1 ? 's' : ''}`);
            }

            if (errorCount > 0) {
                message.error(`Failed to delete ${errorCount} note${errorCount > 1 ? 's' : ''}`);
            }

            refetch();
        } catch (error) {
            message.error('An error occurred during bulk deletion');
            setBulkDeleteModal({ visible: false, ids: [] });
        }
    };

    const handleRemoveAll = async () => {
        try {
            if (notes.length === 0) {
                message.warning('No notes to delete');
                return;
            }

            Modal.confirm({
                title: 'Delete All Notes',
                content: `Are you sure you want to delete all notes for this ${noteType === 'lead' ? 'lead' : 'contact'}? This action cannot be undone.`,
                okText: 'Delete All',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                    try {
                        const deletePromises = notes.map(note => deleteNote(note.id).unwrap());
                        await Promise.all(deletePromises);
                        message.success('All notes deleted successfully');
                        refetch();
                    } catch (error) {
                        const errorMessage = error?.data?.message || error?.message || 'An unknown error occurred';
                        message.error(`Failed to delete all notes: ${errorMessage}`);
                    }
                }
            });
        } catch (error) {
            message.error('Failed to delete all notes');
        }
    };

    const isLoading = isLoadingNotes;
    const showRemoveAllButton = notes.length > 1;
    const addButtonText = 'Add Note';
    const modalTitle = formModal.data ? 'Update Note' : 'Add Note';
    const moduleTitle = customTitle || (noteType === 'lead' ? "Lead Notes" : "Contact Notes");

    if (!lead && !isLoading) {
        return (
            <div className="lead-notes-tab error-state">
                <p className="error-message">{noteType === 'lead' ? 'Lead' : 'Contact'} information is missing. Cannot load notes.</p>
            </div>
        );
    }

    return (
        <div className="lead-notes-tab">
            <ModuleLayout
                title={moduleTitle}
                icon={<FiEdit />}
                onAddClick={handleAdd}
                className="notes"
                contentClassName="notes-content"
                showHeader={false}
                addButtonText={addButtonText}
                extraActions={showRemoveAllButton ? [
                    {
                        key: 'remove-all',
                        label: 'Delete All',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: handleRemoveAll
                    }
                ] : []}
                module="note"
            >
                <NoteList
                    notes={notes}
                    isLoading={isLoading}
                    currentPage={currentPageFromServer}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={handlePageChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                />
            </ModuleLayout>

            {formModal.visible && (
                <Modal
                    open={formModal.visible}
                    title={<ModalTitle icon={<FiEdit />} title={modalTitle} />}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={600}
                    className="note-form-modal"
                    maskClosable={false}
                    destroyOnClose={true}
                    forceRender={true}
                >
                    <div className="note-form-wrapper">
                        <NoteForm
                            key={formKey}
                            isSubmitting={isCreating || isUpdating}
                            onSubmit={handleFormSubmit}
                            onCancel={handleFormCancel}
                            initialValues={formModal.data}
                        />
                    </div>
                </Modal>
            )}

            <Modal
                open={deleteModal.visible}
                title={<ModalTitle icon={<DeleteOutlined />} title="Delete Note" />}
                onCancel={handleDeleteCancel}
                onOk={handleDeleteConfirm}
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
                <p>Are you sure you want to delete this note?</p>
                <p>This action cannot be undone.</p>
                {deleteModal.data && (
                    <p>
                        <strong>Title:</strong> {deleteModal.data.noteTitle}
                    </p>
                )}
            </Modal>

            <Modal
                open={bulkDeleteModal.visible}
                title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Notes" />}
                onCancel={handleBulkDeleteCancel}
                onOk={handleBulkDeleteConfirm}
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
                <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected notes?</p>
                <p>This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default NotesTab;
