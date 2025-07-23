import React from 'react';
import { motion } from 'framer-motion';
import './authLayout.scss';

const AuthLayout = ({ children }) => {
    const backgroundShapes = [
        { top: '10%', left: '10%', size: '60px', delay: 0.2 },
        { top: '20%', right: '15%', size: '40px', delay: 0.3 },
        { bottom: '15%', left: '15%', size: '50px', delay: 0.4 },
        { bottom: '20%', right: '10%', size: '70px', delay: 0.5 },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const logoVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.6
            }
        }
    };

    return (
        <div className="auth-layout">
            {backgroundShapes.map((shape, index) => (
                <motion.div
                    key={index}
                    className="background-shape"
                    style={{
                        top: shape.top,
                        left: shape.left,
                        right: shape.right,
                        bottom: shape.bottom,
                        width: shape.size,
                        height: shape.size
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: 0.5,
                        scale: 1,
                        rotate: [0, 360]
                    }}
                    transition={{
                        duration: 20,
                        delay: shape.delay,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear"
                    }}
                />
            ))}

            <div className="auth-container">
                <motion.div
                    className="auth-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        className="company-logo"
                        variants={logoVariants}
                    >
                        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 0H40C40 11.0457 31.0457 20 20 20C8.9543 20 0 11.0457 0 0H20Z" fill="#1a4b6e" />
                            <path d="M0 20H20C20 31.0457 11.0457 40 0 40V20Z" fill="#1a4b6e" />
                            <path d="M40 20H20C20 31.0457 28.9543 40 40 40V20Z" fill="#3a8baf" />
                            <path d="M50 10H60V30H50V10Z" fill="#333333" />
                            <path d="M65 10H90C90 15.5228 85.5228 20 80 20H65V10Z" fill="#333333" />
                            <path d="M65 20H80C85.5228 20 90 24.4772 90 30H65V20Z" fill="#333333" />
                            <path d="M95 10H105C110.523 10 115 14.4772 115 20C115 25.5228 110.523 30 105 30H95V10Z" fill="#333333" />
                        </svg>
                    </motion.div>

                    {children}

                    <motion.div
                        className="auth-footer"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { delay: 0.8 }
                            }
                        }}
                    >
                        <p>Perfect CRM © {new Date().getFullYear()}</p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthLayout; 