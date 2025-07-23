import React from 'react';
import { FileOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, FileWordOutlined } from '@ant-design/icons';
import { MdCategory, MdAccessTime } from 'react-icons/md';
import ModuleCard from '../../../../../../../components/ModuleCard';

const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FilePdfOutlined />;
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return <FileExcelOutlined />;
    if (fileType?.includes('image')) return <FileImageOutlined />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileWordOutlined />;
    return <FileOutlined />;
};

const FileCard = ({ file, onDelete }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const infoItems = [
        {
            icon: <MdCategory />,
            content: `Category: ${file.category || 'N/A'}`
        },
        {
            icon: getFileIcon(file.type),
            content: file.type || 'Unknown type'
        }
    ];

    const metaItems = [
        {
            icon: <MdAccessTime />,
            content: `Uploaded on ${formatDate(file.created_at)}`
        }
    ];

    const handleView = () => {
        window.open(file.file_url, '_blank');
    };

    return (
        <ModuleCard
            title={file.file_name}
            infoItems={infoItems}
            metaItems={metaItems}
            onView={handleView}
            onDelete={() => onDelete(file)}
            item={file}
            hideEditButton={true}
        />
    );
};

export default FileCard; 