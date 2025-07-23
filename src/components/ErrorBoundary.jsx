import React from 'react';
import { Result, Button, Typography, Space, Card } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined, BugOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './errorBoundary.scss';

const { Title, Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // You can also log the error to an error reporting service here
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container">
                    <Card className="error-boundary-card">
                        <div className="error-icon">
                            <ExclamationCircleOutlined />
                        </div>
                        <Title level={2} className="error-title">Something went wrong</Title>
                        <Paragraph className="error-subtitle">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </Paragraph>

                        <Space direction="vertical" size="middle" className="error-actions">
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                size="large"
                                className="reload-button"
                                onClick={() => {
                                    this.setState({ hasError: false });
                                    window.location.reload();
                                }}
                            >
                                Reload Page
                            </Button>

                            <Button
                                icon={<ArrowLeftOutlined />}
                                size="large"
                                className="back-button"
                                onClick={() => {
                                    this.setState({ hasError: false });
                                    window.history.back();
                                }}
                            >
                                Go Back
                            </Button>
                        </Space>

                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <div className="error-details">
                                <details>
                                    <summary>
                                        <Space>
                                            <BugOutlined />
                                            <Text strong>Error Details (Development Only)</Text>
                                        </Space>
                                    </summary>
                                    <div className="error-stack">
                                        <Text code>{this.state.error?.toString()}</Text>
                                        <Text type="secondary">Component Stack:</Text>
                                        <pre>{this.state.errorInfo.componentStack}</pre>
                                    </div>
                                </details>
                            </div>
                        )}
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 