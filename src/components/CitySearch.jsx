import React, { useState, useEffect, useRef } from 'react';
import { Select, Spin } from 'antd';
import addressData from '../utils/Address Data/countries+states+cities.json';

const CitySearch = ({ value, onChange, placeholder = 'Search city', onCitySelect }) => {
    const [allCities, setAllCities] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        try {
            const cities = [];
            
            if (Array.isArray(addressData)) {
                addressData.forEach(country => {
                    if (country && country.states && Array.isArray(country.states)) {
                        country.states.forEach(state => {
                            if (state && state.cities && Array.isArray(state.cities)) {
                                state.cities.forEach(city => {
                                    if (city && city.name) {
                                        cities.push({
                                            label: city.name,
                                            value: city.name,
                                            state: state.name,
                                            country: country.name
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            
            setAllCities(cities);
            setFilteredCities(cities.slice(0, 20));
            
            if (value) {
                const city = cities.find(c => c.value === value);
                if (city) {
                    setSelectedCity(city);
                }
            }
        } catch (error) {
            setAllCities([]);
            setFilteredCities([]);
        }
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [value]);

    const filterCities = (text) => {
        if (!text || text.trim() === '') {
            return allCities.slice(0, 20);
        }
        
        const searchStr = text.toLowerCase().trim();
        
        const exactMatches = allCities.filter(city => 
            city.label && city.label.toLowerCase() === searchStr
        );
        
        const startsWithMatches = allCities.filter(city => 
            city.label && city.label.toLowerCase().startsWith(searchStr)
        ).sort((a, b) => a.label.length - b.label.length);
        
        const containsMatches = allCities.filter(city => 
            city.label && city.label.toLowerCase().includes(searchStr) && 
            !city.label.toLowerCase().startsWith(searchStr)
        ).sort((a, b) => a.label.length - b.label.length);
        
        const letterMatches = allCities.filter(city => {
            if (!city.label) return false;
            if (city.label.toLowerCase().includes(searchStr)) return false;
            
            const cityName = city.label.toLowerCase();
            let currentPos = 0;
            
            for (const letter of searchStr) {
                const pos = cityName.indexOf(letter, currentPos);
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
        
        const uniqueMatches = allMatches.filter((city, index, self) =>
            index === self.findIndex((c) => c.value === city.value)
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
            const filtered = filterCities(text);
            setFilteredCities(filtered);
            setIsLoading(false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            const filtered = filterCities(text);
            setFilteredCities(filtered);
            setIsLoading(false);
        }, 50);
    };

    const handleSelect = (value, option) => {
        if (onChange) {
            onChange(value);
        }
        
        if (option) {
            const cityData = option.data || option;
            setSelectedCity(cityData);
            
            if (onCitySelect && cityData) {
                onCitySelect({
                    label: cityData.label || value,
                    value: cityData.value || value,
                    state: cityData.state || '',
                    country: cityData.country || ''
                });
            }
        }
        
        setSearchText('');
    };

    const handleClear = () => {
        setSelectedCity(null);
        setSearchText('');
        if (onChange) {
            onChange(undefined);
        }
        if (onCitySelect) {
            onCitySelect(null);
        }
    };

    const customSelectedLabel = () => {
        if (!selectedCity) return null;
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>{selectedCity.label}</div>
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
            notFoundContent={isLoading ? <Spin size="small" /> : 'No city found'}
            style={{ 
                width: '100%',
                border: 'none'
            }}
            options={filteredCities}
            loading={isLoading}
            optionLabelProp="label"
            className="city-search-select"
            popupClassName="city-search-dropdown"
            labelRender={customSelectedLabel}
            onClear={handleClear}
            placement="bottomLeft"
            optionRender={(option) => {
                const cityName = option.label;
                
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
                        }}>{cityName}</div>
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

export default CitySearch;