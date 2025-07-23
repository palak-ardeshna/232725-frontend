import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation, useAdminLoginMutation, useEmployeeLoginMutation } from '../services/authApi';
import { useSelector } from 'react-redux';
import AuthLayout from '../layout/AuthLayout';
import './login.scss';

const Login = () => {
    const navigate = useNavigate();
    const [login] = useLoginMutation();
    const [adminLogin] = useAdminLoginMutation();
    const [employeeLogin] = useEmployeeLoginMutation();

    const { isLoading, error, isLogin } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
        userType: 'admin'
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState(null);

    const userTypes = [
        { id: 'admin', label: 'Admin' },
        { id: 'employee', label: 'Employee' }
    ];

    useEffect(() => {
        const savedIdentifier = localStorage.getItem('crm_identifier');
        const savedUserType = localStorage.getItem('crm_userType');

        if (savedIdentifier) {
            setFormData(prev => ({
                ...prev,
                identifier: savedIdentifier,
                userType: savedUserType || 'admin'
            }));
            setRememberMe(true);
        }

        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');

        if (token && userType) {
            const dashboardRoutes = {
                admin: '/admin/dashboard',
                employee: '/employee/dashboard'
            };

            // Use replace to avoid adding to history stack
            navigate(dashboardRoutes[userType] || '/admin/dashboard', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        if (error) {
            setFormError(error);
        }
    }, [error]);

    useEffect(() => {
        if (isLogin) {
            const userType = localStorage.getItem('userType');
            const dashboardRoutes = {
                admin: '/admin/dashboard',
                employee: '/employee/dashboard'
            };

            // Use replace to avoid adding to history stack
            navigate(dashboardRoutes[userType] || '/admin/dashboard', { replace: true });
        }
    }, [isLogin, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleUserTypeChange = (userType) => {
        setFormData({
            ...formData,
            userType
        });
    };

    const handleRememberMeChange = () => {
        setRememberMe(!rememberMe);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.identifier || !formData.password) {
            setFormError('Please enter both email/username and password');
            return;
        }

        try {
            if (rememberMe) {
                localStorage.setItem('crm_identifier', formData.identifier);
                localStorage.setItem('crm_userType', formData.userType);
            } else {
                localStorage.removeItem('crm_identifier');
                localStorage.removeItem('crm_userType');
            }

            const credentials = {
                id: formData.identifier,
                password: formData.password,
                userType: formData.userType
            };

            switch (formData.userType) {
                case 'admin':
                    await adminLogin({
                        email: formData.identifier,
                        password: formData.password
                    }).unwrap();
                    break;
                case 'employee':
                    await employeeLogin({
                        email: formData.identifier,
                        password: formData.password
                    }).unwrap();
                    break;
                default:
                    await login(credentials).unwrap();
            }

        } catch (err) {
            setFormError(err.data?.message || 'Invalid email/username or password. Please try again.');
            console.error('Login error:', err);
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
        <AuthLayout>
            <motion.div className="auth-header" variants={itemVariants}>
                <h1>Welcome Back</h1>
                <p>Sign in to your account to continue</p>
            </motion.div>

            {formError && (
                <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{formError}</span>
                </motion.div>
            )}

            <motion.div className="user-type-selector" variants={itemVariants}>
                {userTypes.map(type => (
                    <motion.button
                        key={type.id}
                        type="button"
                        className={`user-type-btn ${formData.userType === type.id ? 'active' : ''}`}
                        onClick={() => handleUserTypeChange(type.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {type.label}
                    </motion.button>
                ))}
            </motion.div>

            <motion.form onSubmit={handleSubmit} variants={itemVariants}>
                <motion.div
                    className="form-group"
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <label htmlFor="identifier">Email / Username</label>
                    <div className="input-container">
                        <i className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </i>
                        <input
                            type="text"
                            id="identifier"
                            name="identifier"
                            value={formData.identifier}
                            onChange={handleChange}
                            placeholder="Enter your email or username"
                            disabled={isLoading}
                            required
                        />
                    </div>
                </motion.div>

                <motion.div
                    className="form-group"
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <label htmlFor="password">Password</label>
                    <div className="input-container">
                        <i className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </i>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            required
                        />
                        <motion.button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            whileTap={{ scale: 0.9 }}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </motion.button>
                    </div>
                </motion.div>

                <motion.div className="form-options" variants={itemVariants}>
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={handleRememberMeChange}
                            disabled={isLoading}
                        />
                        <span className="checkmark"></span>
                        Remember me
                    </label>
                    <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
                </motion.div>

                <motion.button
                    type="submit"
                    className="auth-button"
                    disabled={isLoading}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(25, 167, 206, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                >
                    {isLoading ? (
                        <div className="spinner"></div>
                    ) : (
                        <>
                            Sign In
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </>
                    )}
                </motion.button>
            </motion.form>
        </AuthLayout>
    );
};

export default Login;
