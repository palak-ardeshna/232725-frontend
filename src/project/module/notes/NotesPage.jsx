import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../auth/services/authSlice';
import NotesModule from './index';
import './NotesPage.scss';

const NotesPage = () => {
    const user = useSelector(selectCurrentUser);

    return (
        <div className="notes-page">
            <NotesModule
                related_id={user?.id}
                moduleTitle="Notes Manager"
                module="note"
            />
        </div>
    );
};

export default NotesPage; 