import { message } from 'antd';
export const exportToExcel = async (options) => {
    try {
        const {
            data,
            columns,
            filename = `export_${new Date().toISOString().split('T')[0]}`,
            sheetName = 'Data',
            addTotalRow = false,
            totalRowLabel = 'TOTAL',
            totalColumn = '',
            totalValue = null
        } = options;

        const XLSX = await import('xlsx');

        if (!Array.isArray(data) || data.length === 0) {
            message.error('No data to export');
            return false;
        }

        const exportData = data.map(item => {
            const row = {};
            Object.keys(columns).forEach(key => {
                row[columns[key].title || key] = item[key] !== undefined ? item[key] : '';
            });
            return row;
        });

        if (addTotalRow && totalColumn) {
            const totalRow = {};
            Object.keys(columns).forEach(key => {
                if (key === totalColumn) {
                    totalRow[columns[key].title || key] = totalValue !== null ? totalValue :
                        data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
                } else if (columns[totalColumn]) {
                    const columnKeys = Object.keys(columns);
                    const totalColumnIndex = columnKeys.indexOf(totalColumn);
                    if (totalColumnIndex > 0 && key === columnKeys[totalColumnIndex - 1]) {
                        totalRow[columns[key].title || key] = totalRowLabel;
                    } else {
                        totalRow[columns[key].title || key] = '';
                    }
                } else {
                    totalRow[columns[key].title || key] = '';
                }
            });
            exportData.push(totalRow);
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        const colWidths = [];
        Object.keys(columns).forEach(key => {
            if (columns[key].width) {
                colWidths.push({ wch: columns[key].width });
            }
        });

        if (colWidths.length > 0) {
            worksheet['!cols'] = colWidths;
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        const fileExtension = filename.endsWith('.xlsx') ? '' : '.xlsx';
        const fullFilename = `${filename}${fileExtension}`;


        XLSX.writeFile(workbook, fullFilename);

        message.success(`Data exported to Excel successfully`);
        return true;
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        message.error('Failed to export to Excel');
        return false;
    }
};
export const formatCurrency = (value, currency = 'INR', minimumFractionDigits = 0) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits
    }).format(value || 0);
};
export const formatDate = (dateString, options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
}) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', options);
};

export default {
    exportToExcel,
    formatCurrency,
    formatDate
}; 