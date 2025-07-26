import React, { useState, useEffect } from 'react';
import { Layout, Typography, Space, Row, Col } from 'antd';
import { GithubOutlined, TwitterOutlined, LinkedinOutlined } from '@ant-design/icons';
import './styles.scss';

const { Footer } = Layout;
const { Link } = Typography;

const DashboardFooter = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    return (
        <Footer className="dashboard-footer">
            <div className="dashboard-footer-content">
                <Typography.Text className="dashboard-footer-copyright">
                    © {new Date().getFullYear()} grewox infotech. All rights reserved.
                </Typography.Text>

                <Space className="dashboard-footer-links" wrap={isMobile}>
                    <Link href="/privacy-policy">
                        Privacy Policy
                    </Link>
                    <Link href="/terms-of-service">
                        Terms of Service
                    </Link>
                    <Space className="dashboard-footer-social">
                        <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                            <GithubOutlined />
                        </Link>
                        <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                            <TwitterOutlined />
                        </Link>
                        <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                            <LinkedinOutlined />
                        </Link>
                    </Space>
                </Space>
            </div>
        </Footer>
    );
};

export default DashboardFooter;
