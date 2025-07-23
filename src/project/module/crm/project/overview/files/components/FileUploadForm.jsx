import React, { useState } from 'react';
import { Upload, Button, Select, Form, Input, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const FileUploadForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const [fileList, setFileList] = useState([]);
    const [fileCategory, setFileCategory] = useState('company');
    const [fileName, setFileName] = useState('');
    const [form] = Form.useForm();

    const uploadProps = {
        onRemove: file => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);

            if (newFileList.length === 0) {
                setFileName('');
            }
        },
        beforeUpload: file => {
            setFileList([...fileList, file]);

            if (!fileName && fileList.length === 0) {
                setFileName(file.name);
                form.setFieldsValue({ fileName: file.name });
            }

            return false;
        },
        fileList,
    };

    const handleSubmit = () => {
        if (fileList.length === 0) {
            return;
        }

        const formData = new FormData();

        formData.append('fileCategory', fileCategory);
        formData.append('fileName', fileName);

        fileList.forEach(file => {
            formData.append('projectFiles', file.originFileObj || file);
        });

        onSubmit(formData);
    };
        
    const showMultipleFilesWarning = fileList.length > 1;

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
                name="fileName"
                label="File Name"
                initialValue={fileName}
                rules={[{ required: true, message: 'Please enter a file name' }]}
                help={showMultipleFilesWarning ?
                    "Note: Custom filename will only be applied to the first file when uploading multiple files" : null}
            >
                <Input
                    placeholder="Enter file name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                />
            </Form.Item>

            <Form.Item
                name="fileCategory"
                label="File Category"
                initialValue={fileCategory}
                rules={[{ required: true, message: 'Please select a category' }]}
            >
                <Select
                    value={fileCategory}
                    onChange={setFileCategory}
                    style={{ width: '100%' }}
                >
                    <Option value="company">Company</Option>
                    <Option value="contact">Contact</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="files"
                label="Files"
                rules={[{ required: true, message: 'Please upload at least one file' }]}
            >
                <Upload.Dragger {...uploadProps} multiple>
                    <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag files to this area to upload</p>

                </Upload.Dragger>
            </Form.Item>

            {showMultipleFilesWarning && (
                <Alert
                    message="Multiple Files Selected"
                    description="The custom filename will only be applied to the first file. Other files will use their original names."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form.Item className="form-actions">
                <Button onClick={onCancel} style={{ marginRight: 8 }}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={fileList.length === 0}
                >
                    Upload
                </Button>
            </Form.Item>
        </Form>
    );
};

export default FileUploadForm; 