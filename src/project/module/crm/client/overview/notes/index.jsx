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

const NotesTab = ({ client, customTitle, noteType = 'client', showOnlyUserNotes = true }) => {
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false, ids: [] });

    const { currentUser } = useSelector(state => state.auth);
    const userId = currentUser?.id;

    const { data: notesData, isLoading: isLoadingNotes, refetch } = useGetNotesQuery({
        related_id: client?.id,
        user_id: userId // Always send user_id to filter by created_by
    }, {
        skip: !client?.id,
        refetchOnMountOrArgChange: true
    });

    const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
    const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
    const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();

    const notes = notesData?.data?.items || [];

    useEffect(() => {
        if (client?.id) {
            refetch();
        }
    }, [client?.id, refetch]);

    const handleAdd = () => setFormModal({ visible: true, data: null });
    const handleEdit = (note) => setFormModal({ visible: true, data: note });
    const handleDelete = (note) => setDeleteModal({ visible: true, data: note });
    const handleBulkDelete = (selectedIds) => {
        if (selectedIds.length > 0) {
            setBulkDeleteModal({ visible: true, ids: selectedIds });
        }
    };

    const handleFormCancel = () => setFormModal({ visible: false, data: null });
    const handleDeleteCancel = () => setDeleteModal({ visible: false, data: null });
    const handleBulkDeleteCancel = () => setBulkDeleteModal({ visible: false, ids: [] });

    const handleFormSubmit = async (values) => {
        try {
            if (formModal.data) {
                await updateNote({
                    id: formModal.data.id,
                    data: {
                        ...values,
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
                    related_id: client.id,
                    user_id: userId
                };

                await createNote(noteData).unwrap();
                message.success('Note added successfully');
            }
            setFormModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error(`Failed to ${formModal.data ? 'update' : 'add'} note: ${error.data?.message || error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteNote(deleteModal.data.id).unwrap();
            message.success('Note deleted successfully');
            setDeleteModal({ visible: false, data: null });
            refetch();
        } catch (error) {
            message.error('Failed to delete note');
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
            Modal.confirm({
                title: 'Delete All Notes',
                content: 'Are you sure you want to delete all notes for this client? This action cannot be undone.',
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
                        message.error('Failed to delete all notes');
                    }
                }
            });
        } catch (error) {
            message.error('Failed to delete all notes');
        }
    };

    const isLoading = isLoadingNotes;
    const showRemoveAllButton = notes.length > 1;
    const hasNotes = notes.length > 0;
    const addButtonText = 'Add Note';
    const modalTitle = formModal.data ? 'Update Note' : 'Add Note';

    const moduleTitle = customTitle || "Client Notes";

    return (
        <div className="client-notes-tab">
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
            >
                <NoteList
                    notes={notes}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                />

                <Modal
                    title={<ModalTitle icon={<FiEdit />} title={modalTitle} />}
                    open={formModal.visible}
                    onCancel={handleFormCancel}
                    footer={null}
                    width={600}
                    className="note-form-modal"
                    maskClosable={true}
                    destroyOnHidden={true}
                >
                    <NoteForm
                        isSubmitting={isCreating || isUpdating}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        initialValues={formModal.data}
                    />
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Delete Note" />}
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
                    <p>Are you sure you want to delete this note?</p>
                    <p>This action cannot be undone.</p>
                </Modal>

                <Modal
                    title={<ModalTitle icon={<DeleteOutlined />} title="Bulk Delete Notes" />}
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
                    <p>Are you sure you want to delete {bulkDeleteModal.ids.length} selected notes?</p>
                    <p>This action cannot be undone.</p>
                </Modal>
            </ModuleLayout>
        </div>
    );
};

export default NotesTab; 