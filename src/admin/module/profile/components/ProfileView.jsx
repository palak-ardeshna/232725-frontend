import React from 'react';
import { Typography, Avatar, Row, Col } from 'antd';
import {
    RiUser3Line,
    RiMailLine,
    RiPhoneLine,
    RiShieldUserLine,
    RiTimeLine,
    RiLockPasswordLine,
    RiMapPin2Line,
    RiMapPinLine,
    RiBuildingLine,
    RiGovernmentLine,
    RiTeamLine
} from 'react-icons/ri';

const { Title, Text } = Typography;

const ProfileView = ({ user, userRole }) => {
    const getInitials = () => {
        const firstInitial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : '';
        const lastInitial = user?.lastName ? user.lastName.charAt(0).toUpperCase() : '';
        const firstNameInitial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : '';
        const lastNameInitial = user?.last_name ? user.last_name.charAt(0).toUpperCase() : '';

        return (firstInitial + lastInitial) || (firstNameInitial + lastNameInitial) || user?.username?.charAt(0).toUpperCase() || 'U';
    };

    const getFullName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        } else if (user?.first_name && user?.last_name) {
            return `${user.first_name} ${user.last_name}`;
        } else {
            return user?.username || 'Username';
        }
    };

    const getProfilePic = () => {
        return user?.profilePic || user?.profile_picture;
    };

    return (
        <div className="profile-content">
            <div className="profile-card main-info">
                <div className="profile-card-header">
                    <div className="profile-avatar">
                        {getProfilePic() ? (
                            <Avatar
                                src={getProfilePic()}
                                size={80}
                                style={{ borderRadius: '20px' }}
                            />
                        ) : (
                            <div className="profile-avatar-text">
                                {getInitials()}
                            </div>
                        )}
                    </div>
                    <div className="profile-title">
                        <Title level={3}>
                            {getFullName()}
                        </Title>
                        <div className="profile-subtitle">
                            <div className={`status-badge ${user?.status || user?.is_active ? 'active' : 'inactive'}`}>
                                {user?.status || (user?.is_active ? 'Active' : 'Inactive')}
                            </div>
                            <div className="role-badge">
                                {userRole || 'Super Admin'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-info-grid">
                    <div className="info-item">
                        <div className="info-icon">
                            <RiUser3Line />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">Username</Text>
                            <Text strong>{user?.username}</Text>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <RiMailLine />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">Email</Text>
                            <Text strong>{user?.email}</Text>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <RiPhoneLine />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">Phone</Text>
                            <Text strong>{user?.phone || 'Not provided'}</Text>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <RiShieldUserLine />
                        </div>
                        <div className="info-content">
                            <Text type="secondary">Created By</Text>
                            <Text strong>{user?.created_by || 'SUPER_ADMIN'}</Text>
                        </div>
                    </div>
                </div>

                {userRole === 'employee' && (
                    <div className="additional-info">
                        <Title level={5} className="section-subtitle">Employee Information</Title>
                        <Row gutter={[24, 16]}>
                            {user?.employee_id && (
                                <Col span={12}>
                                    <div className="info-item">
                                        <div className="info-icon">
                                            <RiUser3Line />
                                        </div>
                                        <div className="info-content">
                                            <Text type="secondary">Employee ID</Text>
                                            <Text strong>{user.employee_id}</Text>
                                        </div>
                                    </div>
                                </Col>
                            )}

                            {user?.branch && (
                                <Col span={12}>
                                    <div className="info-item">
                                        <div className="info-icon">
                                            <RiBuildingLine />
                                        </div>
                                        <div className="info-content">
                                            <Text type="secondary">Branch</Text>
                                            <Text strong>{user.branch}</Text>
                                        </div>
                                    </div>
                                </Col>
                            )}

                            {user?.department && (
                                <Col span={12}>
                                    <div className="info-item">
                                        <div className="info-icon">
                                            <RiGovernmentLine />
                                        </div>
                                        <div className="info-content">
                                            <Text type="secondary">Department</Text>
                                            <Text strong>{user.department}</Text>
                                        </div>
                                    </div>
                                </Col>
                            )}

                            {user?.designation && (
                                <Col span={12}>
                                    <div className="info-item">
                                        <div className="info-icon">
                                            <RiTeamLine />
                                        </div>
                                        <div className="info-content">
                                            <Text type="secondary">Designation</Text>
                                            <Text strong>{user.designation}</Text>
                                        </div>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </div>
                )}

                {(userRole === 'employee' || userRole === 'user') && (
                    user?.address || user?.city || user?.state || user?.country || user?.zip_code ? (
                        <div className="additional-info">
                            <Title level={5} className="section-subtitle">Address Information</Title>
                            <Row gutter={[24, 16]}>
                                {user?.address && (
                                    <Col span={24}>
                                        <div className="info-item">
                                            <div className="info-icon">
                                                <RiMapPin2Line />
                                            </div>
                                            <div className="info-content">
                                                <Text type="secondary">Address</Text>
                                                <Text strong>{user.address}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                )}

                                {user?.city && (
                                    <Col span={12}>
                                        <div className="info-item">
                                            <div className="info-icon">
                                                <RiMapPinLine />
                                            </div>
                                            <div className="info-content">
                                                <Text type="secondary">City</Text>
                                                <Text strong>{user.city}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                )}

                                {user?.state && (
                                    <Col span={12}>
                                        <div className="info-item">
                                            <div className="info-icon">
                                                <RiMapPinLine />
                                            </div>
                                            <div className="info-content">
                                                <Text type="secondary">State</Text>
                                                <Text strong>{user.state}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                )}

                                {user?.country && (
                                    <Col span={12}>
                                        <div className="info-item">
                                            <div className="info-icon">
                                                <RiMapPinLine />
                                            </div>
                                            <div className="info-content">
                                                <Text type="secondary">Country</Text>
                                                <Text strong>{user.country}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                )}

                                {user?.zip_code && (
                                    <Col span={12}>
                                        <div className="info-item">
                                            <div className="info-icon">
                                                <RiMapPinLine />
                                            </div>
                                            <div className="info-content">
                                                <Text type="secondary">ZIP Code</Text>
                                                <Text strong>{user.zip_code}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    ) : null
                )}
            </div>

            <div className="profile-card security-info">
                <Title level={4} className="section-title">
                    Security Settings
                </Title>

                <div className="security-items">
                    <div className="security-item">
                        <div className="security-icon">
                            <RiLockPasswordLine />
                        </div>
                        <div className="security-content">
                            <div className="security-text">
                                <Text strong>Two Factor Authentication</Text>
                                <Text type="secondary">Add an extra layer of security to your account</Text>
                            </div>
                            <div className="status-badge inactive">Disabled</div>
                        </div>
                    </div>

                    <div className="security-item">
                        <div className="security-icon">
                            <RiTimeLine />
                        </div>
                        <div className="security-content">
                            <div className="security-text">
                                <Text strong>Last Login</Text>
                                <Text type="secondary">{new Date().toLocaleString()}</Text>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView; 