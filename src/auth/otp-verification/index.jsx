import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layout/AuthLayout';

const OtpVerification = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputs = useRef([]);

    useEffect(() => {
        const resetEmail = sessionStorage.getItem('resetEmail');
        if (!resetEmail) {
            setFormError('Please submit your email first');
            setTimeout(() => {
                navigate('/forgot-password');
            }, 1500);
            return;
        }
        setEmail(resetEmail);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    const handlePaste = (e, index) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();

        if (/^\d{6}$/.test(pastedData)) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputs.current[5].focus();
        }
        else if (/^\d{1}$/.test(pastedData)) {
            handleChange(pastedData, index);
        }
    };

    const handleChange = (value, index) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setFormError('Please enter all 6 digits');
            return;
        }

        try {
            setIsLoading(true);

            await new Promise(resolve => setTimeout(resolve, 1000));

            setFormSuccess('OTP verified successfully');

            setTimeout(() => {
                navigate('/reset-password');
            }, 1500);
        } catch (err) {
            setFormError('Invalid OTP. Please try again.');
            console.error('OTP verification error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend) return;

        try {
            setCanResend(false);
            setTimeLeft(60);

            await new Promise(resolve => setTimeout(resolve, 1000));

            setFormSuccess('New verification code sent');
            
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setFormError('Failed to send new code');
            setCanResend(true);
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
                <h1>Enter Verification Code</h1>
                <p>We've sent a 6-digit code to your email address</p>
                {email && <p style={{ color: '#19a7ce', fontWeight: '500' }}>{email}</p>}
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
                    className="otp-input-group"
                    variants={itemVariants}
                >
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <motion.input
                            key={index}
                            ref={el => inputs.current[index] = el}
                            className="otp-input"
                            type="text"
                            maxLength={1}
                            value={otp[index]}
                            onChange={e => handleChange(e.target.value, index)}
                            onKeyDown={e => handleKeyDown(e, index)}
                            onPaste={e => handlePaste(e, index)}
                            disabled={isLoading}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { duration: 0.5, delay: 0.1 * index }
                                }
                            }}
                            whileFocus={{ scale: 1.05, borderColor: '#19a7ce' }}
                        />
                    ))}
                </motion.div>

                <motion.p
                    style={{
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '14px',
                        margin: '0 0 24px'
                    }}
                    variants={itemVariants}
                >
                    You can paste your complete verification code
                </motion.p>

                <motion.button
                    type="submit"
                    className="auth-button"
                    disabled={isLoading || otp.some(digit => !digit)}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(25, 167, 206, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                >
                    {isLoading ? (
                        <div className="spinner"></div>
                    ) : (
                        <>
                            Verify Code
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </>
                    )}
                </motion.button>

                <motion.div
                    style={{
                        marginTop: '24px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}
                    variants={itemVariants}
                >
                    <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                        Didn't receive the code?
                        {canResend ? (
                            <motion.button
                                type="button"
                                onClick={handleResendCode}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#19a7ce',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    padding: '0 4px',
                                    fontSize: '14px'
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Resend Code
                            </motion.button>
                        ) : (
                            <span style={{ color: '#19a7ce', fontWeight: 500, marginLeft: '4px' }}>
                                Resend in {timeLeft}s
                            </span>
                        )}
                    </p>

                    <Link to="/forgot-password" className="auth-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Reset Password
                    </Link>
                </motion.div>
            </motion.form>
        </AuthLayout>
    );
};

export default OtpVerification; 