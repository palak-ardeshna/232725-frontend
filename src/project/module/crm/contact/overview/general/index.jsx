import React from 'react';
import { useNavigate } from 'react-router-dom';
import GeneralDetailsTab from '../../../../../../components/GeneralDetailsTab';
import './general.scss';

const GeneralTab = ({ contact }) => {
    const navigate = useNavigate();

    if (!contact) {
        return null;
    }

    return (
        <GeneralDetailsTab
            data={contact}
            type="contact"
            classifications={{}}
            className="contact-details"
        />
    );
};

export default GeneralTab; 