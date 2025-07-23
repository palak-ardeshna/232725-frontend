import React from 'react';
import { useSelector } from 'react-redux';
import NotesTab from '../crm/lead/overview/notes';

const NotesModule = ({ related_id, moduleTitle = 'Notes' }) => {
    const { currentUser } = useSelector(state => state.auth);

    const lead = {
        id: related_id,
    };

    const CustomNotesTab = (props) => (
        <NotesTab
            {...props}
            customTitle={moduleTitle}
            noteType="Self"
            showOnlyUserNotes={true}
        />
    );

    return (
        <div className="notes-module-wrapper">
            <CustomNotesTab lead={lead} />
        </div>
    );
};

export default NotesModule; 