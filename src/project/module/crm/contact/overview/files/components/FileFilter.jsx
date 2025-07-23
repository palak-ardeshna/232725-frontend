import React, { useState, useEffect, useRef } from 'react';
import { Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

const { Option } = Select;

const FileFilter = ({ selectedCategory, handleCategoryChange }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const filterRef = useRef(null);

    // Check screen size on mount and resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
            // Close filter dropdown when resizing up from mobile
            if (window.innerWidth > 768) {
                setIsFilterOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Handle click outside to close the filter on mobile
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };

        // Add click listener for outside clicks
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleFilter = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        setIsFilterOpen(!isFilterOpen);
    };

    const closeFilter = () => {
        setIsFilterOpen(false);
    };

    const categories = [
        { key: 'all', value: null, label: 'All Files' },
        { key: 'contact', value: 'contact', label: 'Contact Files' },
        { key: 'company', value: 'company', label: 'Company Files' }
    ];

    return (
        <div className="filter-container">
            <div
                className={`module-filter ${isFilterOpen ? 'open' : ''}`}
                ref={filterRef}
            >
                {isMobileView && (
                    <div className={`filter-icon ${isFilterOpen ? 'active' : ''}`} onClick={toggleFilter}>
                        <FilterOutlined />
                    </div>
                )}
                <Select
                    placeholder="Filter by Category"
                    style={{ width: '100%' }}
                    value={selectedCategory}
                    onChange={(value) => {
                        handleCategoryChange(value);
                        if (isMobileView) {
                            closeFilter();
                        }
                    }}
                    allowClear={false}
                    showSearch
                    optionFilterProp="children"
                    onBlur={isMobileView ? closeFilter : undefined}
                    onClick={(e) => isMobileView && e.stopPropagation()}
                    styles={{ popup: { root: { minWidth: '180px' } } }}
                >
                    {categories.map(option => (
                        <Option key={option.key} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </div>
        </div>
    );
};

export default FileFilter; 