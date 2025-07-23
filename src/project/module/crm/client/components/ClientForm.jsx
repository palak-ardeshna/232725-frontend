import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import AdvancedForm from '../../../../../components/AdvancedForm';
import CitySearch from '../../../../../components/CitySearch';
import StateSearch from '../../../../../components/StateSearch';
import CountrySearch from '../../../../../components/CountrySearch';

// Define validation schema using Yup
const validationSchema = Yup.object().shape({
    name: Yup.string()
        .required('Client name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    email: Yup.string()
       
        .email('Please enter a valid email address'),
    phone: Yup.string()
        .required('Phone number is required')
        .matches(/^\d+$/, 'Please enter a valid phone number (digits only)')
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number must be less than 15 digits')
});

const ClientForm = ({ initialValues, isSubmitting, onSubmit, onCancel }) => {
    // Initialize form values with default empty values
    const [formValues, setFormValues] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        country: '',
        zip_code: ''
    });

    // Update formValues when initialValues change (for editing)
    useEffect(() => {
        if (initialValues) {
            // Extract address values from address object
            const address = initialValues.address || {};

            setFormValues({
                name: initialValues.name || '',
                email: initialValues.email || '',
                phone: initialValues.phone || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || '',
                zip_code: address.zipcode || ''
            });
        }
    }, [initialValues]);

    // Define fields configuration
    const clientFields = [
        {
            name: 'name',
            label: 'Full Name',
            type: 'text',
            placeholder: 'Enter full name',
            rules: [
                { required: true, message: 'Please enter the client name' },
                { min: 2, message: 'Name must be at least 2 characters' },
                { max: 50, message: 'Name must be less than 50 characters' }
            ],
            span: 12
        },
        {
            name: 'email',
            label: 'Email',
            type: 'text',
            placeholder: 'Enter email address',   
            span: 12
        },
        {
            name: 'phone',
            label: 'Phone Number',
            type: 'text',
            placeholder: 'Enter phone number',
            rules: [
                { required: true, message: 'Please enter the phone number' },
                {
                    validator: async (_, value) => {
                        if (value) {
                            if (!/^\d+$/.test(value)) {
                                throw new Error('Please enter a valid phone number (digits only)');
                            }
                            if (value.length < 10 || value.length > 15) {
                                throw new Error('Phone number must be between 10-15 digits');
                            }
                        }
                    }
                }
            ],
            span: 12
        },
        {
            name: 'city',
            label: 'City',
            type: 'custom',
            span: 12,
            render: () => (
                <CitySearch
                    value={formValues?.city || ''}
                    onChange={(value) => {
                        setFormValues(prev => ({
                            ...prev,
                            city: value
                        }));
                    }}
                    onCitySelect={(cityData) => {
                        if (cityData) {
                            setFormValues(prev => ({
                                ...prev,
                                city: cityData.label,
                                state: cityData.state || '',
                                country: cityData.country || ''
                            }));
                        }
                    }}
                    placeholder="Search by city name"
                />
            )
        },
        {
            name: 'state',
            label: 'State',
            type: 'custom',
            span: 12,
            render: () => (
                <StateSearch
                    value={formValues?.state || ''}
                    onChange={(value) => {
                        setFormValues(prev => ({
                            ...prev,
                            state: value
                        }));
                    }}
                    onStateSelect={(stateData) => {
                        if (stateData) {
                            setFormValues(prev => ({
                                ...prev,
                                state: stateData.label,
                                country: stateData.country || prev.country
                            }));
                        }
                    }}
                    country={formValues?.country || ''}
                    placeholder="Search by state name"
                />
            )
        },
        {
            name: 'country',
            label: 'Country',
            type: 'custom',
            span: 12,
            render: () => (
                <CountrySearch
                    value={formValues?.country || ''}
                    onChange={(value) => {
                        setFormValues(prev => ({
                            ...prev,
                            country: value
                        }));
                    }}
                    placeholder="Search by country name"
                />
            )
        },
        {
            name: 'zip_code',
            label: 'Zip Code',
            type: 'text',
            placeholder: 'Enter zip code',
            span: 12,
            initialValue: formValues.zip_code
        }
    ];

    const handleSubmit = (values) => {
        // Create address object for backend
        const address = {
            city: values.city,
            state: values.state,
            country: values.country,
            zipcode: values.zip_code
        };

        const formData = {
            name: values.name,
            email: values.email,
            phone: values.phone,
            address: address,
            isClient: true // Always set isClient to true for clients
        };

        // If editing, preserve the ID
        if (initialValues?.id) {
            formData.id = initialValues.id;
        }

        onSubmit(formData);
    };

    return (
        <AdvancedForm
            initialValues={formValues}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            fields={clientFields}
            validationSchema={validationSchema}
            submitButtonText={initialValues ? 'Update Client' : 'Create Client'}
            resetOnSubmit={true}
        />
    );
};

export default ClientForm; 