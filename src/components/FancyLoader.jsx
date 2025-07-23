import React from 'react';

const FancyLoader = ({
    height = '100vh',
    width = '100%',
    primaryColor = 'var(--primary-color)',
    message = 'Loading...',
    subMessage = 'Please wait while we prepare your data',
    subMessage2 = 'This may take a few moments',
    processingText = 'PROCESSING'
}) => {
    return (
        <div className="loader-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height,
            width,
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            perspective: '1000px'
        }}>
            <div style={{
                position: 'absolute',
                width: '200%',
                height: '200%',
                top: '-50%',
                left: '-50%',
                background: `radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 70%)`,
                animation: 'rotate 20s linear infinite',
                opacity: 0.4,
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                width: '150px',
                height: '150px',
                transform: 'rotateX(20deg)',
                transformStyle: 'preserve-3d'
            }}>
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: '4px solid transparent',
                    borderRadius: '50%',
                    borderTopColor: primaryColor,
                    animation: 'spin 1.5s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: '4px solid transparent',
                    borderRadius: '50%',
                    borderRightColor: primaryColor,
                    animation: 'spin 2s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />
                <div style={{
                    position: 'absolute',
                    width: '70%',
                    height: '70%',
                    top: '15%',
                    left: '15%',
                    border: '4px solid transparent',
                    borderRadius: '50%',
                    borderBottomColor: primaryColor,
                    animation: 'spinReverse 1.7s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />

                <div style={{
                    position: 'absolute',
                    width: '85%',
                    height: '85%',
                    top: '7.5%',
                    left: '7.5%',
                    border: '2px solid transparent',
                    borderRadius: '50%',
                    borderLeftColor: primaryColor,
                    opacity: 0.7,
                    animation: 'spin 3s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />
                <div style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    top: '20%',
                    left: '20%',
                    border: '3px solid transparent',
                    borderRadius: '50%',
                    borderTopColor: primaryColor,
                    opacity: 0.5,
                    animation: 'spinReverse 2.5s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />
                <div style={{
                    position: 'absolute',
                    width: '50%',
                    height: '50%',
                    top: '25%',
                    left: '25%',
                    border: '2px solid transparent',
                    borderRadius: '50%',
                    borderRightColor: primaryColor,
                    opacity: 0.8,
                    animation: 'spin 1.2s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />
                <div style={{
                    position: 'absolute',
                    width: '40%',
                    height: '40%',
                    top: '30%',
                    left: '30%',
                    border: '2px solid transparent',
                    borderRadius: '50%',
                    borderBottomColor: primaryColor,
                    opacity: 0.6,
                    animation: 'spinReverse 2.2s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />
                <div style={{
                    position: 'absolute',
                    width: '30%',
                    height: '30%',
                    top: '35%',
                    left: '35%',
                    border: '1px solid transparent',
                    borderRadius: '50%',
                    borderLeftColor: primaryColor,
                    opacity: 0.9,
                    animation: 'spin 1s linear infinite',
                    boxShadow: `0 0 15px ${primaryColor}33`
                }} />

                <div style={{
                    position: 'absolute',
                    width: '20%',
                    height: '20%',
                    top: '40%',
                    left: '40%',
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    opacity: 0.3,
                    animation: 'pulse 2s ease-in-out infinite',
                    boxShadow: `0 0 20px ${primaryColor}`
                }} />
    
                <div style={{
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    top: '10%',
                    left: '50%',
                    opacity: 0.6,
                    animation: 'floatY 3s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    top: '70%',
                    left: '20%',
                    opacity: 0.4,
                    animation: 'floatX 4s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    top: '30%',
                    left: '80%',
                    opacity: 0.5,
                    animation: 'floatY 5s ease-in-out infinite reverse'
                }} />

                <style>
                    {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes spinReverse {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(-360deg); }
                    }
                    @keyframes fadeInOut {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 1; }
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(0.8); opacity: 0.3; }
                        50% { transform: scale(1.2); opacity: 0.7; }
                    }
                    @keyframes floatY {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(30px); }
                    }
                    @keyframes floatX {
                        0%, 100% { transform: translateX(0px); }
                        50% { transform: translateX(30px); }
                    }
                    @keyframes rotate {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    `}
                </style>
            </div>

            <div style={{
                marginTop: '50px',
                fontSize: '24px',
                fontWeight: 'bold',
                background: primaryColor,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'fadeInOut 2s ease-in-out infinite',
                textAlign: 'center',
                textShadow: `0 0 5px ${primaryColor}33`
            }}>
                <div>{message}</div>
                {subMessage && (
                    <div style={{
                        fontSize: '16px',
                        marginTop: '10px',
                        fontWeight: 'normal',
                        letterSpacing: '0.5px'
                    }}>
                        {subMessage}
                    </div>
                )}
                {subMessage2 && (
                    <div style={{
                        fontSize: '14px',
                        marginTop: '5px',
                        opacity: 0.8,
                        fontWeight: '300'
                    }}>
                        {subMessage2}
                    </div>
                )}
                {processingText && (
                    <div style={{
                        marginTop: '20px',
                        fontSize: '12px',
                        letterSpacing: '5px',
                        opacity: 0.6,
                        animation: 'fadeInOut 1.5s linear infinite',
                        padding: '3px 10px',
                        border: `1px solid ${primaryColor}33`,
                        borderRadius: '4px',
                        display: 'inline-block'
                    }}>
                        {processingText}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FancyLoader; 