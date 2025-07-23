import React from 'react';
import { Spin, Modal, Avatar, Badge } from 'antd';
import {
    RiContactsLine, RiMapPinLine, RiPhoneLine, RiMailLine,
    RiUser3Line, RiVipCrownLine, RiTimeLine, RiBuilding4Line,
    RiUserStarLine, RiBuildingLine
} from 'react-icons/ri';

const EmployeeView = ({ employee, roleMap = {}, departmentMap = {}, designationMap = {}, isLoading, visible, onClose }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const modalTitle = (
        <div className="modal-header">
            <div className="modal-header-title">
                <RiContactsLine /> Employee Details
            </div>
        </div>
    );

    const getDisplayName = () => {
        if (!employee) return 'N/A';

        const fname = employee.first_name;
        const lname = employee.last_name;
        if (
            fname && fname !== "null" && fname.trim() !== "" &&
            lname && lname !== "null" && lname.trim() !== ""
        ) {
            return `${fname} ${lname}`;
        }
        return employee.username || 'N/A';
    };

    if (isLoading) {
        return (
            <Modal
                title={modalTitle}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={700}
                className="common-modal modern-modal"
                maskClosable={true}
                centered
            >
                <div className="loading-container">
                    <Spin size="large" />
                </div>
            </Modal>
        );
    }

    if (!employee) {
        return (
            <Modal
                title={modalTitle}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={700}
                className="common-modal modern-modal"
                maskClosable={true}
                centered
            >
                <div className="error-container">
                    Employee not found
                </div>
            </Modal>
        );
    }

    const roleName = roleMap?.[employee.role_id] || 'N/A';
    const departmentName = departmentMap?.[employee.department] || 'N/A';
    const designationName = designationMap?.[employee.designation] || 'N/A';

    const formatAddress = () => {
        if (!employee) return 'N/A';

        const parts = [];
        if (employee.address && employee.address !== "null" && employee.address.trim() !== "") parts.push(employee.address);
        const cityState = [];
        if (employee.city && employee.city !== "null" && employee.city.trim() !== "") cityState.push(employee.city);
        if (employee.state && employee.state !== "null" && employee.state.trim() !== "") cityState.push(employee.state);
        if (cityState.length > 0) {
            parts.push(cityState.join(", "));
        }
        if (employee.country && employee.country !== "null" && employee.country.trim() !== "") {
            parts.push(employee.country);
        }
        if (employee.zip_code && employee.zip_code !== "null" && employee.zip_code.trim() !== "") {
            parts.push(employee.zip_code);
        }
        return parts.length > 0 ? parts.join(", ") : "N/A";
    };

    const getInitials = () => {
        if (!employee) return '';

        const firstInitial = employee.first_name ? employee.first_name.charAt(0).toUpperCase() : '';
        const lastInitial = employee.last_name ? employee.last_name.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial || (employee.username ? employee.username.charAt(0).toUpperCase() : '');
    };

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            className="common-modal modern-modal"
            maskClosable={true}
            centered
        >
            <div className="modern-view modern-modal-view">
                <div className="header">
                    <div className="avatar-container">
                        {employee.profile_picture && employee.profile_picture !== "null" && employee.profile_picture.trim() !== "" ? (
                            <Avatar
                                size={80}
                                className="avatar"
                                src={employee.profile_picture}
                            />
                        ) : (
                            <Avatar
                                size={80}
                                className="avatar"
                            >
                                {getInitials()}
                            </Avatar>
                        )}
                        <Badge
                            status={employee.is_active ? "success" : "error"}
                            className={`status-badge ${employee.is_active ? 'active' : 'inactive'}`}
                        />
                    </div>

                    <div className="basic-info">
                        <h2 className="name">
                            {getDisplayName()}
                        </h2>
                        <div className="badge-container">
                            <div className="badge">
                                <RiVipCrownLine className="icon" />
                                <span className="text">{roleName}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="details-container">
                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiUser3Line />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Username</div>
                            <div className="detail-value">{employee.username || 'N/A'}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiMailLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Email</div>
                            <div className="detail-value">{employee.email || 'N/A'}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiPhoneLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Phone</div>
                            <div className="detail-value">{employee.phone || 'N/A'}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiMapPinLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Address</div>
                            <div className="detail-value">{formatAddress()}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiBuilding4Line />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Department</div>
                            <div className="detail-value">{departmentName}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiUserStarLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Designation</div>
                            <div className="detail-value">{designationName}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiTimeLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Created At</div>
                            <div className="detail-value">{formatDate(employee.createdAt)}</div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <RiTimeLine />
                        </div>
                        <div className="detail-content">
                            <div className="detail-label">Last Updated</div>
                            <div className="detail-value">{formatDate(employee.updatedAt)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EmployeeView; 