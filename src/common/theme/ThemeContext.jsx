import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEME_OPTIONS = [
    { label: 'Default Blue', value: 'theme-default', color: '#19a7ce' },
    { label: 'Ocean Blue', value: 'theme-ocean', color: '#0ea5e9' },
    { label: 'Royal Purple', value: 'theme-purple', color: '#8b5cf6' },
    { label: 'Emerald Green', value: 'theme-green', color: '#10b981' },
    { label: 'Sunset Orange', value: 'theme-orange', color: '#f97316' },
    { label: 'Ruby Red', value: 'theme-red', color: '#ef4444' },
    { label: 'Rose Pink', value: 'theme-pink', color: '#ec4899' },
    { label: 'Royal Indigo', value: 'theme-indigo', color: '#6366f1' },
    { label: 'Teal', value: 'theme-teal', color: '#14b8a6' },
    { label: 'Golden Amber', value: 'theme-amber', color: '#f59e0b' },
    { label: 'Sky Blue', value: 'theme-sky', color: '#0284c7' },
    { label: 'Lime Green', value: 'theme-lime', color: '#84cc16' },
    { label: 'Royal Blue', value: 'theme-royal-blue', color: '#2563eb' },
    { label: 'Deep Brown', value: 'theme-deep-brown', color: '#92400e' },
    { label: 'Golden Yellow', value: 'theme-golden-yellow', color: '#eab308' },
    { label: 'Midnight Black', value: 'theme-midnight-black', color: '#18181b' },
    { label: 'Deep Indigo', value: 'theme-deep-indigo', color: '#4338ca' },
    { label: 'Ice Blue', value: 'theme-ice-blue', color: '#38bdf8' },
    { label: 'Warm Brown', value: 'theme-warm-brown', color: '#b45309' },
    { label: 'Navy Blue', value: 'theme-navy-blue', color: '#1e40af' },
    { label: 'Sunflower', value: 'theme-sunflower', color: '#facc15' },
    { label: 'Charcoal', value: 'theme-charcoal', color: '#334155' },
    { label: 'Sapphire', value: 'theme-sapphire', color: '#2563eb' },
    { label: 'Chocolate', value: 'theme-chocolate', color: '#854d0e' },
    { label: 'Electric Purple', value: 'theme-electric-purple', color: '#9333ea' },
    { label: 'Coral Red', value: 'theme-coral-red', color: '#f43f5e' },
    { label: 'Forest Green', value: 'theme-forest-green', color: '#16a34a' },
    { label: 'Deep Ocean', value: 'theme-deep-ocean', color: '#0369a1' },
    { label: 'Burnt Orange', value: 'theme-burnt-orange', color: '#ea580c' },
    { label: 'Royal Gold', value: 'theme-royal-gold', color: '#d97706' },
    { label: 'Deep Rose', value: 'theme-deep-rose', color: '#be185d' },
    { label: 'Slate Gray', value: 'theme-slate-gray', color: '#475569' },
    { label: 'Turquoise', value: 'theme-turquoise', color: '#0d9488' },
    { label: 'Berry Purple', value: 'theme-berry-purple', color: '#a21caf' },
    { label: 'Autumn Bronze', value: 'theme-autumn-bronze', color: '#a16207' },
    { label: 'Steel Blue', value: 'theme-steel-blue', color: '#2d5a9e' }
];

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'theme-default';
    });

    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('isDark') === 'true';
    });

    useEffect(() => {
        document.body.style.transition = '';

        // Remove all theme classes
        document.body.classList.forEach(className => {
            if (className.startsWith('theme-')) {
                document.body.classList.remove(className);
            }
        });

        document.body.classList.add(theme);

        // Toggle dark mode class with smooth transition
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        localStorage.setItem('theme', theme);
        localStorage.setItem('isDark', isDark);
    }, [theme, isDark]);

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const toggleDarkMode = () => {
        setIsDark(prev => !prev);
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                isDark,
                changeTheme,
                toggleDarkMode,
                themeOptions: THEME_OPTIONS
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};