import React, { useState, useEffect, useRef } from 'react';
import * as Yup from 'yup';
import { Button, DatePicker, Form, Input, InputNumber, Select, Table, Modal, message, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FaMagic } from "react-icons/fa";
import { useGetContactsQuery, useCreateLeadMutation, useGetPipelinesQuery, useGetStagesQuery } from '../../../../../config/api/apiServices';
import AdvancedForm, { ModalTitle } from '../../../../../components/AdvancedForm';
import dayjs from 'dayjs';
import LeadForm from '../../lead/components/LeadForm';
import '../../proposal/proposal.scss';
import AiTextGenerator from '../../../../../utils/Ai';
import * as XLSX from 'xlsx';

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
    lead: Yup.string().required('Lead is required'),
    validUntil: Yup.date(),
    terms: Yup.string(),
    notes: Yup.string(),
    items: Yup.array().of(
        Yup.object().shape({
            name: Yup.string().required('Item name is required'),
            total: Yup.number().required('Total is required').min(0, 'Total must be positive')
        })
    )
});

const parseItems = (itemsData) => {
    if (!itemsData) return [];

    if (Array.isArray(itemsData)) return itemsData;

    if (typeof itemsData === 'string') {
        try {
            const parsedItems = JSON.parse(itemsData);
            return Array.isArray(parsedItems) ? parsedItems : [];
        } catch (error) {
            return [];
        }
    }

    return [];
};

const ProposalForm = ({ initialValues, isSubmitting, onSubmit, onCancel, leads = [] }) => {
    const parsedInitialItems = initialValues ? parseItems(initialValues.items) : [];

    const [items, setItems] = useState(parsedInitialItems);
    const [totalAmount, setTotalAmount] = useState(initialValues?.amount || 0);
    const [selectedLead, setSelectedLead] = useState(initialValues?.lead || null);
    const [isLeadModalVisible, setIsLeadModalVisible] = useState(false);
    const [leadFormKey, setLeadFormKey] = useState(Date.now());
    const [isGenerating, setIsGenerating] = useState({ description: false, terms: false, notes: false });
    const isEditing = !!initialValues;
    const [form] = Form.useForm();
    
    const descriptionRef = useRef(null);
    const termsRef = useRef(null);
    const notesRef = useRef(null);

    const { data: contactsResponse } = useGetContactsQuery({ limit: 'all' });
    const contacts = contactsResponse?.data?.items || [];
    const [createLead, { isLoading: isCreatingLead }] = useCreateLeadMutation();

    const { data: pipelinesResponse } = useGetPipelinesQuery({ limit: 'all' });
    const pipelines = pipelinesResponse?.data?.items || [];

    const { data: stagesResponse2 } = useGetStagesQuery({
        limit: 'all',
    }, {
        skip: false
    });
    const stages = stagesResponse2?.data?.items || [];

    const aiGenerator = useRef(new AiTextGenerator()).current;

    const formattedInitialValues = initialValues ? {
        ...initialValues,
        validUntil: initialValues.validUntil ? dayjs(initialValues.validUntil) : null
    } : undefined;

    useEffect(() => {
        const total = items.reduce((sum, item) => sum + (item.total || 0), 0);
        setTotalAmount(total);
    }, [items]);

    useEffect(() => {
        if (selectedLead) {
            const selectedLeadData = leads.find(lead => lead.id === selectedLead);
            if (selectedLeadData) {
                if (selectedLeadData.contact) {
                    form.setFieldValue('contact', selectedLeadData.contact);
                }
                
                if (items.length === 0 || (items.length === 1 && items[0].total === 0)) {
                    if (selectedLeadData.leadValue) {
                        const defaultItem = {
                            name: 'Service',
                            tax: 0,
                            discount: 0,
                            total: selectedLeadData.leadValue
                        };
                        setItems([defaultItem]);
                        setTotalAmount(selectedLeadData.leadValue);
                    }
                }
            }
        }
    }, [selectedLead, leads, form, items]);

    const handleLeadChange = (leadId) => {
        setSelectedLead(leadId);
        const selectedLeadData = leads.find(lead => lead.id === leadId);
        if (selectedLeadData) {
            if (selectedLeadData.contact) {
                form.setFieldValue('contact', selectedLeadData.contact);
            }
            
            if (items.length === 0 || (items.length === 1 && items[0].total === 0)) {
                if (selectedLeadData.leadValue) {
                    const defaultItem = {
                        name: 'Service',
                        tax: 0,
                        discount: 0,
                        total: selectedLeadData.leadValue
                    };
                    setItems([defaultItem]);
                    setTotalAmount(selectedLeadData.leadValue);
                }
            }
        }
    };

    const handleAddLead = () => {
        setLeadFormKey(Date.now());
        setIsLeadModalVisible(true);
    };

    const handleLeadFormCancel = () => {
        setIsLeadModalVisible(false);
    };

    const handleLeadFormSubmit = async (values) => {
        try {
            const result = await createLead(values).unwrap();
            if (result && result.data) {
                const newLead = result.data;
                setSelectedLead(newLead.id);
                form.setFieldValue('lead', newLead.id);
                if (newLead.contact) {
                    form.setFieldValue('contact', newLead.contact);
                }
                message.success('Lead created successfully');
            }
            setIsLeadModalVisible(false);
        } catch (error) {
            message.error('Failed to create lead');
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                name: '',
                tax: 0,
                discount: 0,
                total: 0
            }
        ]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleAIGenerate = async (type) => {
        try {
            const leadData = selectedLead ? leads.find(lead => lead.id === selectedLead) : null;
            
            const result = await aiGenerator.generateAIContent(type, leadData, form, setIsGenerating, isGenerating);
            
            if (result.success) {
                message.success(result.message);
            } else {
                message.error(result.message);
            }
        } catch (error) {
            message.error(`Failed to create ${type}: ${error.message}`);
            setIsGenerating({ ...isGenerating, [type]: false });
        }
    };

    const handleExportToExcel = () => {
        try {
            const exportData = items.map((item, index) => ({
                'Item Name': item.name || '',
                'Total (₹)': item.total || 0
            }));
            
            exportData.push({
                'Item Name': 'TOTAL',
                'Total (₹)': totalAmount
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            
            const colWidths = [
                { wch: 20 }, 
                { wch: 15 }  
            ];
            worksheet['!cols'] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Proposal Items');
            
            const title = form.getFieldValue('title') || 'Proposal';
            XLSX.writeFile(workbook, `${title}.xlsx`);
            
            message.success('Exported to Excel successfully');
        } catch (error) {
            console.error('Export error:', error);
            message.error('Failed to export to Excel');
        }
    };

    const renderItemsTable = () => {
        const columns = [
            {
                title: 'Item',
                dataIndex: 'name',
                key: 'name',
                render: (text, record, index) => (
                    <Input
                        value={text}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Item name"
                    />
                )
            },
            {
                title: 'Total',
                dataIndex: 'total',
                key: 'total',
                width: 120,
                render: (text, record, index) => (
                    <InputNumber
                        value={text}
                        onChange={(value) => handleItemChange(index, 'total', value)}
                        addonBefore="₹"
                        style={{ width: '100%' }}
                        min={0}
                    />
                )
            },
            {
                title: '',
                key: 'action',
                width: 50,
                render: (text, record, index) => (
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveItem(index)}
                        danger
                    />
                )
            }
        ];

        const tableDataSource = Array.isArray(items) ? items : [];

        return (
            <div className="proposal-items">
                <div className="proposal-items-header">
                    <h3>Proposal Items</h3>
                </div>
                <div className="table-list">
                    <Table
                        dataSource={tableDataSource}
                        columns={columns}
                        pagination={false}
                        rowKey={(record, index) => index}
                        footer={() => (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                    type="dashed"
                                    onClick={handleAddItem}
                                    icon={<PlusOutlined />}
                                >
                                    Add Item
                                </Button>
                                <div className="total-amount">
                                    <strong>Total Amount: ₹{totalAmount.toLocaleString()}</strong>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>
        );
    };

    const getProposalFields = () => {
        const fields = [
            {
                name: 'title',
                label: 'Proposal Title',
                type: 'text',
                placeholder: 'Enter proposal title',
                rules: [{ required: true, message: 'Please enter proposal title' }],
                span: 12
            },
            {
                name: 'lead',
                label: 'Associated Lead',
                type: 'select',
                placeholder: 'Select Lead',
                rules: [{ required: true, message: 'Please select lead' }],
                options: leads.map(lead => ({ label: lead.leadTitle, value: lead.id })),
                showSearch: true,
                optionFilterProp: 'children',
                onChange: handleLeadChange,
                span: 12,
                popupRender: (menu) => (
                    <div>
                        {menu}
                        <div style={{
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleAddLead}
                                style={{ width: '100%', height: '38px' }}
                                icon={<PlusOutlined />}
                            >
                                Add Lead
                            </Button>
                        </div>
                    </div>
                )
            },
            {
                name: 'validUntil',
                label: 'Valid Until',
                type: 'date',
                span: 12
            },
            {
                name: 'status',
                label: 'Status',
                type: 'select',
                placeholder: 'Select Status',
                options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Sent', value: 'sent' },
                    { label: 'Accepted', value: 'accepted' },
                    { label: 'Rejected', value: 'rejected' },
                    { label: 'Expired', value: 'expired' }
                ],
                span: 12,
                initialValue: isEditing ? undefined : 'draft'
            }
        ];

        fields.push({
            name: 'contact',
            type: 'text',
            style: { display: 'none' },
            span: 0
        });

        fields.push({
            name: 'description',
            label: 'Description',
            type: 'custom',
            span: 24,
            render: () => (
                <div className="ai-textarea-container">
                    <Form.Item name="description" noStyle>
                        <Input.TextArea 
                            rows={6} 
                            placeholder="Enter proposal description"
                            id="description-textarea"
                            data-name="description"
                            style={{ 
                                resize: 'vertical',
                                minHeight: '120px'
                            }}
                        />
                    </Form.Item>
                    <Tooltip title={selectedLead ? "Generate using AI" : "Select a lead first to enable AI generation"}>
                        <Button
                            type="link"
                            icon={<FaMagic style={{ fontSize: '18px' }} />}
                            onClick={() => handleAIGenerate('description')}
                            loading={isGenerating.description}
                            className="ai-generate-button"
                            disabled={!selectedLead}
                        />
                    </Tooltip>
                </div>
            )
        });

        fields.push({
            name: 'terms',
            label: 'Terms & Conditions',
            type: 'custom',
            span: 24,
            render: () => (
                <div className="ai-textarea-container">
                    <Form.Item name="terms" noStyle>
                        <Input.TextArea 
                            rows={6} 
                            placeholder="Enter terms and conditions"
                            id="terms-textarea"
                            data-name="terms"
                            style={{ 
                                resize: 'vertical',
                                minHeight: '120px'
                            }}
                        />
                    </Form.Item>
                    <Tooltip title={selectedLead ? "Generate using AI" : "Select a lead first to enable AI generation"}>
                        <Button
                            type="link"
                            icon={<FaMagic style={{ fontSize: '18px' }} />}
                            onClick={() => handleAIGenerate('terms')}
                            loading={isGenerating.terms}
                            className="ai-generate-button"
                            disabled={!selectedLead}
                        />
                    </Tooltip>
                </div>
            )
        });

        fields.push({
            name: 'notes',
            label: 'Notes',
            type: 'custom',
            span: 24,
            render: () => (
                <div className="ai-textarea-container">
                    <Form.Item name="notes" noStyle>
                        <Input.TextArea 
                            rows={6} 
                            placeholder="Enter additional notes"
                            id="notes-textarea"
                            data-name="notes"
                            style={{ 
                                resize: 'vertical',
                                minHeight: '120px'
                            }}
                        />
                    </Form.Item>
                    <Tooltip title={selectedLead ? "Generate using AI" : "Select a lead first to enable AI generation"}>
                        <Button
                            type="link"
                            icon={<FaMagic style={{ fontSize: '18px' }} />}
                            onClick={() => handleAIGenerate('notes')}
                            loading={isGenerating.notes}
                            className="ai-generate-button"
                            disabled={!selectedLead}
                        />
                    </Tooltip>
                </div>
            )
        });

        return fields;
    };

    const handleSubmit = async (values) => {
        try {
            const formattedValues = {
                ...values,
                validUntil: values.validUntil ? values.validUntil.toISOString() : null,
                amount: totalAmount,
                items: Array.isArray(items) ? items : []
            };

            onSubmit(formattedValues);
        } catch (error) {
        }
    };

    return (
        <div className="proposal-form">
            <AdvancedForm
                form={form}
                initialValues={formattedInitialValues}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                fields={getProposalFields()}
                validationSchema={validationSchema}
                className="proposal-details-form"
            />

            {renderItemsTable()}

            <Modal
                title={<ModalTitle title="Add Lead" />}
                open={isLeadModalVisible}
                onCancel={handleLeadFormCancel}
                footer={null}
                width={800}
                destroyOnClose={true}
                className="lead-form-modal"
            >
                <LeadForm
                    key={leadFormKey}
                    onSubmit={handleLeadFormSubmit}
                    onCancel={handleLeadFormCancel}
                    isSubmitting={isCreatingLead}
                    pipelines={pipelines}
                    stages={stages}
                />
            </Modal>
        </div>
    );
};

export default ProposalForm;