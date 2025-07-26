import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { RiBuildingLine } from 'react-icons/ri';
import { useGetCompanyDetailsQuery } from '../../../../config/api/apiServices';
import CompanyDetailsForm from './CompanyDetailsForm';
import CompanyDetailsView from './CompanyDetailsView';
import ModuleLayout from '../../../../components/ModuleLayout';
import { ModalTitle } from '../../../../components/AdvancedForm';

const CompanyDetailsPage = () => {
    const { data: companyDetails, isLoading } = useGetCompanyDetailsQuery();
    const [formModal, setFormModal] = useState({ visible: false, data: null });
    const [formKey, setFormKey] = useState(Date.now());

    const handleEdit = () => {
        setFormKey(Date.now());
        setFormModal({ visible: true, data: companyDetails?.data });
    };

    const handleFormCancel = () => {
        setFormModal({ visible: false, data: null });
    };

    const handleFormSuccess = () => {
        message.success('Company details updated successfully');
        setFormModal({ visible: false, data: null });
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <ModuleLayout
            title="Company Profile"
            showViewToggle={false}
            onAddClick={handleEdit}
            addButtonText="Edit Company Details"
            className="profile"
        >
            <CompanyDetailsView companyDetails={companyDetails?.data} />

            <Modal
                title={<ModalTitle icon={RiBuildingLine} title="Edit Company Details" />}
                open={formModal.visible}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                className="modal"
                maskClosable={true}
                destroyOnClose={true}
            >
                <CompanyDetailsForm
                    key={formKey}
                    initialValues={formModal.data}
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            </Modal>
        </ModuleLayout>
    );
};

export default CompanyDetailsPage; 