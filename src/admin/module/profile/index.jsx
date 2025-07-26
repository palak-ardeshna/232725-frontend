import React, { useState } from 'react';
import { Modal, message, Button } from 'antd';
import { RiUser3Line, RiBuildingLine } from 'react-icons/ri';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser, selectUserRole, selectAuthLoading } from '../../../auth/services/authSlice';
import { useUpdateProfileMutation } from '../../../auth/services/authApi';
import EditProfileForm from './components/EditProfileForm';
import ProfileView from './components/ProfileView';
import CompanyDetailsForm from './components/CompanyDetailsForm';
import ModuleLayout from '../../../components/ModuleLayout';
import { ModalTitle } from '../../../components/AdvancedForm';
import './styles.scss';

const Profile = () => {
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser);
    const userRole = useSelector(selectUserRole);
    const isLoading = useSelector(selectAuthLoading);
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [companyModal, setCompanyModal] = useState(false);
    const [formKey, setFormKey] = useState(Date.now());

    const handleEdit = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: user });
    };

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };

    const handleCompanyClick = () => {
        navigate(`/${userRole.toLowerCase()}/company-details`);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (values instanceof FormData) {
                await updateProfile(values).unwrap();
            } else {
                await updateProfile(values).unwrap();
            }
            message.success('Profile updated successfully');
            setFormModal({ visible: false, data: null });
        } catch (error) {
            if (error.data) {
                const errorMessage = error.data.message?.replace('⚠️ ', '');
                message.error(errorMessage || 'Failed to update profile');
            } else {
                message.error('An unexpected error occurred');
            }
        }
    };

    return (
        <ModuleLayout
            title="Profile"
            showViewToggle={false}
            onAddClick={handleEdit}
            addButtonText="Edit Profile"
            actionButtons={
                <Button className='btn btn-outline' type='button' onClick={handleCompanyClick} icon={<RiBuildingLine />}>
                    Company Details
                </Button>
            }
            className="profile"
        >
            <ProfileView user={user} userRole={userRole} />

            <Modal
                title={<ModalTitle icon={RiUser3Line} title="Edit Profile" />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnHidden={true}
            >
                <EditProfileForm
                    key={formKey}
                    initialValues={formModal.data}
                    onCancel={handleFormCancel}
                    onSubmit={handleFormSubmit}
                    isSubmitting={isUpdating}
                />
            </Modal>
        </ModuleLayout>
    );
};

export default Profile;