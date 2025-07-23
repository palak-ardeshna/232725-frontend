import React, { useEffect } from 'react';
import { Modal, Spin, Avatar } from 'antd';
import { RiContactsLine, RiMailLine, RiPhoneLine, RiTimeLine } from 'react-icons/ri';

const ContactView = ({ contact, isLoading, visible, onClose }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    const getInitials = () => {
        if (!contact || !contact.name) return 'C';

        const nameParts = contact.name.split(' ');
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return contact.name[0].toUpperCase();
    };

    const modalTitle = (
        <div className="modal-header">
            <div className="modal-header-title">
                <RiContactsLine /> Contact Details
            </div>
        </div>
    );

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            className="modal"
            maskClosable={true}
            centered
        >
            {isLoading ? (
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            ) : contact ? (
                <div className="modern-view modern-modal-view">
                    <div className="header">
                        <div className="avatar-container">
                            <Avatar
                                size={80}
                                className="avatar"
                            >
                                {getInitials()}
                            </Avatar>
                        </div>

                        <div className="basic-info">
                            <h2 className="name">
                                {contact.name}
                            </h2>
                        </div>
                    </div>

                    <div className="details-container">
                        <div className="detail-item">
                            <div className="detail-icon">
                                <RiMailLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Email</div>
                                <div className="detail-value">{contact.email}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <RiPhoneLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Phone</div>
                                <div className="detail-value">{contact.phone}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <RiTimeLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Created At</div>
                                <div className="detail-value">{formatDate(contact.createdAt)}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <RiTimeLine />
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Last Updated</div>
                                <div className="detail-value">{formatDate(contact.updatedAt || contact.createdAt)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="error-container">
                    Contact not found
                </div>
            )}
        </Modal>
    );
};

export default ContactView; 