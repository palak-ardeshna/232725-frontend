import React, { useState, useEffect, useRef } from 'react';
import { Select, Spin } from 'antd';
import addressData from '../utils/Address Data/countries+states+cities.json';

const CountrySearch = ({ value, onChange, placeholder = 'Search country', onCountrySelect }) => {
    const [allCountries, setAllCountries] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        try {
            const countries = [];
            
            if (Array.isArray(addressData)) {
                addressData.forEach(country => {
                    if (country && country.name) {
                        countries.push({
                            label: country.name,
                            value: country.name
                        });
                    }
                });
            }
            
            setAllCountries(countries);
            setFilteredCountries(countries.slice(0, 20));
            
            if (value) {
                const country = countries.find(c => c.value === value);
                if (country) {
                    setSelectedCountry(country);
                }
            }
        } catch (error) {
            setAllCountries([]);
            setFilteredCountries([]);
        }
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [value]);

    const filterCountries = (text) => {
        if (!text || text.trim() === '') {
            return allCountries.slice(0, 20);
        }
        
        const searchStr = text.toLowerCase().trim();
        
        const exactMatches = allCountries.filter(country => 
            country.label && country.label.toLowerCase() === searchStr
        );
        
        const startsWithMatches = allCountries.filter(country => 
            country.label && country.label.toLowerCase().startsWith(searchStr)
        ).sort((a, b) => a.label.length - b.label.length);
        
        const containsMatches = allCountries.filter(country => 
            country.label && country.label.toLowerCase().includes(searchStr) && 
            !country.label.toLowerCase().startsWith(searchStr)
        ).sort((a, b) => a.label.length - b.label.length);
        
        const letterMatches = allCountries.filter(country => {
            if (!country.label) return false;
            if (country.label.toLowerCase().includes(searchStr)) return false;
            
            const countryName = country.label.toLowerCase();
            let currentPos = 0;
            
            for (const letter of searchStr) {
                const pos = countryName.indexOf(letter, currentPos);
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
        
        const uniqueMatches = allMatches.filter((country, index, self) =>
            index === self.findIndex((c) => c.value === country.value)
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
            const filtered = filterCountries(text);
            setFilteredCountries(filtered);
            setIsLoading(false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            const filtered = filterCountries(text);
            setFilteredCountries(filtered);
            setIsLoading(false);
        }, 50);
    };

    const handleSelect = (value, option) => {
        if (onChange) {
            onChange(value);
        }
        
        if (option) {
            const countryData = option.data || option;
            setSelectedCountry(countryData);
            
            if (onCountrySelect && countryData) {
                onCountrySelect({
                    label: countryData.label || value,
                    value: countryData.value || value
                });
            }
        }
        
        setSearchText('');
    };

    const handleClear = () => {
        setSelectedCountry(null);
        setSearchText('');
        if (onChange) {
            onChange(undefined);
        }
        if (onCountrySelect) {
            onCountrySelect(null);
        }
    };

    const customSelectedLabel = () => {
        if (!selectedCountry) return null;
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>{selectedCountry.label}</div>
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
            notFoundContent={isLoading ? <Spin size="small" /> : 'No country found'}
            style={{ 
                width: '100%',
                border: 'none'
            }}
            options={filteredCountries}
            loading={isLoading}
            optionLabelProp="label"
            className="country-search-select"
            popupClassName="country-search-dropdown"
            labelRender={customSelectedLabel}
            onClear={handleClear}
            placement="bottomLeft"
            optionRender={(option) => {
                const countryName = option.label;
                
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
                        }}>{countryName}</div>
                    </div>
                );
            }}
            dropdownStyle={{ 
                minWidth: '300px', 
                maxHeight: '200px',
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

export default CountrySearch;