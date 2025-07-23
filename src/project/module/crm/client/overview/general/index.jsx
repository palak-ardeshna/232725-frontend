import React, { useState } from 'react';
import { Card, Button, Typography, Divider, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useUpdateContactMutation } from '../../../../../../config/api/apiServices';
import ClientForm from '../../components/ClientForm';
import GeneralDetailsTab from '../../../../../../components/GeneralDetailsTab';
import './general.scss';

const { Title } = Typography;

const GeneralTab = ({ client }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleUpdate = async (values) => {
        try {
            // Ensure isClient is set to true when updating
            const clientData = {
                ...values,
                isClient: true
            };

            await updateContact({
                id: client.id,
                data: clientData
            }).unwrap();
            message.success('Client updated successfully');
            setIsEditing(false);
        } catch (error) {
            message.error(`Failed to update client: ${error.data?.message || error.message}`);
        }
    };

    if (isEditing) {
        return (
            <div className="general-tab">
                <Card className="edit-client-card">
                    <Title level={4}>Edit Client</Title>
                    <Divider />
                    <ClientForm
                        initialValues={client}
                        isSubmitting={isUpdating}
                        onSubmit={handleUpdate}
                        onCancel={handleCancel}
                    />
                </Card>
            </div>
        );
    }

    return (
        <>

            <GeneralDetailsTab
                data={client}
                type="client"
                classifications={{}}
                className="client-details"
            />
        </>
    );
};

export default GeneralTab; 