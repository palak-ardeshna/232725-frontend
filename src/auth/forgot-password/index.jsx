import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layout/AuthLayout';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!email) {
            setFormError('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setFormError('Please enter a valid email address');
            return;
        }

        try {
            setIsLoading(true);

            await new Promise(resolve => setTimeout(resolve, 1000));

            sessionStorage.setItem('resetEmail', email);

            setFormSuccess('Verification code sent to your email');
            
            setTimeout(() => {
                navigate('/otp-verification');
            }, 1500);
        } catch (err) {
            setFormError('Failed to send verification code. Please try again.');
            console.error('Forgot password error:', err);
        } finally {
            setIsLoading(false);
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
                <h1>Reset Password</h1>
                <p>Enter your email address to receive password reset instructions</p>
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

            {formSuccess && (
                <motion.div
                    className="success-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>{formSuccess}</span>
                </motion.div>
            )}

            <motion.form onSubmit={handleSubmit} variants={itemVariants}>
                <motion.div
                    className="form-group"
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <label htmlFor="email">Email Address</label>
                    <div className="input-container">
                        <i className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </i>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            disabled={isLoading}
                            required
                        />
                    </div>
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
                            Send Instructions
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </>
                    )}
                </motion.button>

                <motion.div variants={itemVariants} style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link to="/login" className="auth-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Login
                    </Link>
                </motion.div>
            </motion.form>

            <motion.div
                className="info-box"
                variants={itemVariants}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <p>Secure password reset process</p>
            </motion.div>
        </AuthLayout>
    );
};

export default ForgotPassword; 