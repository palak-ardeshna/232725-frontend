import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonTable from '../../../../../../../components/CommonTable';
import { generateColumns } from '../../../../../../../utils/tableUtils';
import moment from 'moment';

const ProjectCostsTable = ({ project, additionalCosts = [] }) => {
    const navigate = useNavigate();

    const costFields = useMemo(() => [
        {
            name: 'name',
            title: 'Name',
            render: (text) => (
                <div className="title-container">
                    <span className="title">{text}</span>
                </div>
            )
        },
        {
            name: 'amount',
            title: 'Amount',
            render: (amount) => (
                <div className="value-amount">
                    ₹{parseFloat(amount).toLocaleString('en-IN')}
                </div>
            )
        },
        {
            name: 'date',
            title: 'Date',
            render: (date) => date ? moment(date).format('DD MMM YYYY') : '-'
        },
        {
            name: 'description',
            title: 'Description',
            render: (description) => description || '-'
        }
    ], []);

    const costActions = useMemo(() => [{
        key: 'view',
        label: 'View',
        handler: () => navigate(`/admin/crm/project/overview/${project.id}/additionalCosts`)
    }], [navigate, project?.id]);

    const costColumns = useMemo(() => generateColumns(costFields), [costFields]);

    return (
        <div className="table-section cost-section">
            <h5 className="section-title">Additional Costs</h5>
            <div className="table-list">
                <CommonTable
                    module="additionalCosts"
                    data={additionalCosts}
                    columns={costColumns}
                    isLoading={false}
                    pagination={false}
                    actionItems={costActions}
                    extraProps={{
                        itemName: 'costs',
                        className: 'cost-table'
                    }}
                    searchableColumns={['name', 'description']}
                />
            </div>
        </div>
    );
};

export default ProjectCostsTable; 