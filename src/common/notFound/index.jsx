import React from 'react';
import { Button, Typography, Layout, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PiWarningCircleBold, PiArrowLeftBold } from "react-icons/pi";
const { Title, Text } = Typography;
const { Content } = Layout;
import './notFound.scss';
const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Space direction="vertical" align="center" size={24} className="not-found">
            <Text type="danger">
                <PiWarningCircleBold size={48} />
            </Text>

            <Title level={1}>404</Title>
            <Title level={2}>Page Not Found</Title>
            <Text type="secondary">
                Oops! The page you're looking for doesn't exist or has been moved.
            </Text>

            <Button
                type="primary"
                size="large"
                icon={<PiArrowLeftBold />}
                onClick={() => navigate('/')}
            >
                Back to Home
            </Button>
        </Space>
    );
};

export default NotFound; 