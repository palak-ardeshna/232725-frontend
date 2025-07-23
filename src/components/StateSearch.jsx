import React, { useState, useEffect, useRef } from 'react';
import { Select, Spin } from 'antd';
import addressData from '../utils/Address Data/countries+states+cities.json';

const StateSearch = ({ value, onChange, placeholder = 'Search state', onStateSelect, country }) => {
    const [allStates, setAllStates] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredStates, setFilteredStates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedState, setSelectedState] = useState(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        try {
            const states = [];
            
            if (Array.isArray(addressData)) {
                addressData.forEach(countryData => {
                    if (countryData && countryData.states && Array.isArray(countryData.states)) {
                        if (country && countryData.name !== country) {
                            return;
                        }
                        
                        countryData.states.forEach(state => {
                            if (state && state.name) {
                                states.push({
                                    label: state.name,
                                    value: state.name,
                                    country: countryData.name
                                });
                            }
                        });
                    }
                });
            }
            
            setAllStates(states);
            setFilteredStates(states.slice(0, 20));
            
            if (value) {
                const state = states.find(s => s.value === value);
                if (state) {
                    setSelectedState(state);
                }
            }
        } catch (error) {
            setAllStates([]);
            setFilteredStates([]);
        }
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [value, country]);

    const filterStates = (text) => {
        if (!text || text.trim() === '') {
            return allStates.slice(0, 20);
        }
        
        const searchStr = text.toLowerCase().trim();
        
        const exactMatches = allStates.filter(state => 
            state.label && state.label.toLowerCase() === searchStr
        );
        
        const startsWithMatches = allStates.filter(state => 
            state.label && state.label.toLowerCase().startsWith(searchStr)
        ).sort((a, b) => a.label.length - b.label.length);
        
        const containsMatches = allStates.filter(state => 
            state.label && state.label.toLowerCase().includes(searchStr) && 
            !state.label.toLowerCase().startsWith(searchStr)
        ).sort((a, b) => a.label.length - b.label.length);
        
        const letterMatches = allStates.filter(state => {
            if (!state.label) return false;
            if (state.label.toLowerCase().includes(searchStr)) return false;
            
            const stateName = state.label.toLowerCase();
            let currentPos = 0;
            
            for (const letter of searchStr) {
                const pos = stateName.indexOf(letter, currentPos);
                if (pos === -1) return false;
                currentPos = pos + 1;
            }
            
            return true;
        }).sort((a, b) => a.label.length - b.label.length);
        
        const allMatches = [
            ...exactMatches,
            ...startsWithMatches.slice(0, 5),
            ...containsMatches.slice(0, 5),
            ...letterMatches.slice(0, 3)
        ];
        
        const uniqueMatches = allMatches.filter((state, index, self) =>
            index === self.findIndex((s) => s.value === state.value)
        );
        
        return uniqueMatches.slice(0, 10);
    };

    const handleSearch = (text) => {
        if (!text && value) {
            return;
        }
        
        setSearchText(text);
        setIsLoading(true);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (text.length <= 2) {
            const filtered = filterStates(text);
            setFilteredStates(filtered);
            setIsLoading(false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            const filtered = filterStates(text);
            setFilteredStates(filtered);
            setIsLoading(false);
        }, 50);
    };

    const handleSelect = (value, option) => {
        if (onChange) {
            onChange(value);
        }
        
        if (option) {
            const stateData = option.data || option;
            setSelectedState(stateData);
            
            if (onStateSelect && stateData) {
                onStateSelect({
                    label: stateData.label || value,
                    value: stateData.value || value,
                    country: stateData.country || ''
                });
            }
        }
        
        setSearchText('');
    };

    const handleClear = () => {
        setSelectedState(null);
        setSearchText('');
        if (onChange) {
            onChange(undefined);
        }
        if (onStateSelect) {
            onStateSelect(null);
        }
    };

    const customSelectedLabel = () => {
        if (!selectedState) return null;
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>{selectedState.label}</div>
            </div>
        );
    };

    return (
        <Select
            showSearch={!value}
            value={value}
            placeholder={placeholder}
            defaultActiveFirstOption={false}
            showArrow={true}
            allowClear={true}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleSelect}
            notFoundContent={isLoading ? <Spin size="small" /> : 'No state found'}
            style={{ 
                width: '100%',
                border: 'none'
            }}
            options={filteredStates}
            loading={isLoading}
            optionLabelProp="label"
            className="state-search-select"
            popupClassName="state-search-dropdown"
            labelRender={customSelectedLabel}
            onClear={handleClear}
            placement="bottomLeft"
            optionRender={(option) => {
                const stateName = option.label;
                
                return (
                    <div style={{ 
                        padding: '4px 8px', 
                        borderBottom: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        ':hover': {
                            backgroundColor: '#f5f5f5'
                        }
                    }}>
                        <div style={{ 
                            fontSize: '14px',
                            lineHeight: '1.2'
                        }}>{stateName}</div>
                    </div>
                );
            }}
            dropdownStyle={{ 
                minWidth: '300px', 
                maxHeight: '250px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: 'none',
                boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)',
                padding: '4px',
                marginTop: '4px'
            }}
            dropdownAlign={{
                offset: [0, 4]
            }}
            listHeight={250}
            dropdownMatchSelectWidth={true}
        />
    );
};

export default StateSearch;