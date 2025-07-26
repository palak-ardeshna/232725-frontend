import React from 'react';
import { Typography, Avatar, Row, Col } from 'antd';
import {
    RiBuildingLine,
    RiNumbersLine,
    RiMailLine,
    RiPhoneLine,
    RiGlobalLine,
    RiMapPin2Line,
    RiBankLine,
    RiFileTextLine
} from 'react-icons/ri';

const { Title, Text } = Typography;

const CompanyDetailsView = ({ companyDetails }) => {
    return (
        <div className="profile-content">
            <div className="profile-card main-info">
                <div className="profile-card-header">
                    <div className="profile-avatar">
                        {companyDetails?.logo ? (
                            <Avatar
                                src={companyDetails.logo}
                                size={80}
                                style={{ borderRadius: '20px' }}
                            />
                        ) : (
                            <div className="profile-avatar-text">
                                {companyDetails?.company_name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                        )}
                    </div>
                    <div className="profile-title">
                        <Title level={3}>
                            {companyDetails?.company_name || 'Company Name'}
                        </Title>
                        <div className="profile-subtitle">
                            <div className="status-badge active">
                                Active
                            </div>
                            <div className="role-badge">
                                Company Profile
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-info-grid">
                    <div className="info-item">
                        <div className="info-icon">
                            <RiNumbersLine />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">Registration Number</Text>
                            <Text strong>{companyDetails?.registration_number || 'Not provided'}</Text>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <RiFileTextLine />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">GST Number</Text>
                            <Text strong>{companyDetails?.gst_number || 'Not provided'}</Text>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <RiFileTextLine />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">PAN Number</Text>
                            <Text strong>{companyDetails?.pan_number || 'Not provided'}</Text>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <RiGlobalLine />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">Website</Text>
                            <Text strong>{companyDetails?.website || 'Not provided'}</Text>
                        </div>
                    </div>
                </div>

                <div className="additional-info">
                    <Title level={5} className="section-subtitle">Contact Information</Title>
                    <Row gutter={[24, 16]}>
                        <Col span={12}>
                            <div className="info-item">
                                <div className="info-icon">
                                    <RiMailLine />
                                </div>
                                <div className="info-content">
                                    <Text type="secondary">Email</Text>
                                    <Text strong>{companyDetails?.contact_email || 'Not provided'}</Text>
                                </div>
                            </div>
                        </Col>

                        <Col span={12}>
                            <div className="info-item">
                                <div className="info-icon">
                                    <RiPhoneLine />
                                </div>
                                <div className="info-content">
                                    <Text type="secondary">Phone</Text>
                                    <Text strong>{companyDetails?.contact_phone || 'Not provided'}</Text>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                <div className="additional-info">
                    <Title level={5} className="section-subtitle">Address Information</Title>
                    <Row gutter={[24, 16]}>
                        {(companyDetails?.address_line1 || companyDetails?.address_line2) && (
                            <Col span={24}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiMapPin2Line />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">Address</Text>
                                        <Text strong>
                                            {[companyDetails?.address_line1, companyDetails?.address_line2]
                                                .filter(Boolean)
                                                .join(', ') || 'Not provided'}
                                        </Text>
                                    </div>
                                </div>
                            </Col>
                        )}

                        {companyDetails?.city && (
                            <Col span={12}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiMapPin2Line />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">City</Text>
                                        <Text strong>{companyDetails.city}</Text>
                                    </div>
                                </div>
                            </Col>
                        )}

                        {companyDetails?.state && (
                            <Col span={12}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiMapPin2Line />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">State</Text>
                                        <Text strong>{companyDetails.state}</Text>
                                    </div>
                                </div>
                            </Col>
                        )}

                        {companyDetails?.country && (
                            <Col span={12}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiMapPin2Line />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">Country</Text>
                                        <Text strong>{companyDetails.country}</Text>
                                    </div>
                                </div>
                            </Col>
                        )}

                        {companyDetails?.pincode && (
                            <Col span={12}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiMapPin2Line />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">Pincode</Text>
                                        <Text strong>{companyDetails.pincode}</Text>
                                    </div>
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>

                <div className="additional-info">
                    <Title level={5} className="section-subtitle">Bank Details</Title>
                    <Row gutter={[24, 16]}>
                        {companyDetails?.bank_name && (
                            <Col span={12}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiBankLine />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">Bank Name</Text>
                                        <Text strong>{companyDetails.bank_name}</Text>
                                    </div>
                                </div>
                            </Col>
                        )}

                        {companyDetails?.bank_account_number && (
                            <Col span={12}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiBankLine />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">Account Number</Text>
                                        <Text strong>{companyDetails.bank_account_number}</Text>
                                    </div>
                                </div>
                            </Col>
                        )}

                        {companyDetails?.bank_ifsc && (
                            <Col span={12}>
                                <div className="info-item">
                                    <div className="info-icon">
                                        <RiBankLine />
                                    </div>
                                    <div className="info-content">
                                        <Text type="secondary">IFSC Code</Text>
                                        <Text strong>{companyDetails.bank_ifsc}</Text>
                                    </div>
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailsView; 