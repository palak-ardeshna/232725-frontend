import React from 'react';
import { Drawer, Typography, Switch } from 'antd';
import { useTheme } from './ThemeContext';
import { BsSunFill, BsMoonFill } from 'react-icons/bs';
import './ThemeDrawer.scss';

const { Title } = Typography;

const ThemeDrawer = ({ open, onClose }) => {
    const { theme, isDark, changeTheme, toggleDarkMode, themeOptions } = useTheme();

    return (
        <Drawer
            title={null}
            placement="right"
            onClose={onClose}
            open={open}
            width={380}
            className={`theme-drawer ${isDark ? 'dark-mode' : ''}`}
            destroyOnHidden
            closeIcon={null}
        >
            <div className="theme-drawer-custom-header">
                <span className="theme-drawer-close" onClick={onClose}>×</span>
                <Title level={4} className="theme-drawer-title">Choose Theme</Title>
                <Switch
                    checked={isDark}
                    onChange={toggleDarkMode}
                    checkedChildren={<BsMoonFill size={14} />}
                    unCheckedChildren={<BsSunFill size={14} />}
                    className="theme-mode-switch"
                />
            </div>
            <div className="theme-options-container">
                {themeOptions.map((themeOption) => (
                    <div
                        key={themeOption.value}
                        className={`theme-option ${theme === themeOption.value ? 'active' : ''}`}
                        onClick={() => changeTheme(themeOption.value)}
                    >
                        <div
                            className="theme-color-preview"
                            style={{ backgroundColor: themeOption.color }}
                        />
                        <span className="theme-label">{themeOption.label}</span>
                    </div>
                ))}
            </div>
        </Drawer>
    );
};

export default ThemeDrawer; 