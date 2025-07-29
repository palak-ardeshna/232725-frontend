export const moduleCategories = [
    { key: 'crm', name: 'CRM' },
    { key: 'user_management', name: 'User Management' },
    { key: 'hrm', name: 'HRM' },
];

export const publicModules = ['note', 'files', 'additionalCosts', 'activity', 'followup', 'inquiry'];

export const availableModules = [
    { key: 'contact', name: 'Contact', category: 'crm' },
    { key: 'lead', name: 'Leads', category: 'crm' },
    { key: 'client', name: 'Clients', category: 'crm' },
    { key: 'project', name: 'Project', category: 'crm' },
    { key: 'proposal', name: 'Proposal', category: 'crm' },
    { key: 'note', name: 'Note', category: 'crm' },
    { key: 'activity', name: 'Activity', category: 'crm' },
    { key: 'task', name: 'Task', category: 'crm' },
    { key: 'followup', name: 'Followup', category: 'crm' },
    { key: 'milestone', name: 'Milestone', category: 'crm' },
    { key: 'milestoneTask', name: 'Milestone Task', category: 'crm' },
    { key: 'files', name: 'Files', category: 'crm' },
    { key: 'additionalCosts', name: 'Additional Costs', category: 'crm' },

    { key: 'employee', name: 'Employee', category: 'hrm' },
    { key: 'teamMember', name: 'Team Member', category: 'hrm' },
    { key: 'department', name: 'Department', category: 'hrm' },
    { key: 'designation', name: 'Designation', category: 'hrm' },
    { key: 'holiday', name: 'Holiday', category: 'hrm' },
    { key: 'leave', name: 'Leave', category: 'hrm' },
    { key: 'attendance', name: 'Attendance', category: 'hrm' },
    { key: 'inquiry', name: 'Inquiry', category: 'hrm' },
    { key: 'company', name: 'Company', category: 'hrm' },
    { key: 'plan', name: 'Plans', category: 'hrm' },

    { key: 'role', name: 'Role', category: 'user_management' },
    { key: 'settings', name: 'Office Settings', category: 'user_management' },
];

export const permissionTypes = [
    { key: 'create', name: 'Create' },
    { key: 'read', name: 'Read' },
    { key: 'update', name: 'Update' },
    { key: 'delete', name: 'Delete' },
];

export const getModulesByCategory = (categoryKey) => {
    return availableModules.filter(module => module.category === categoryKey);
};

export const getModuleName = (moduleKey) => {
    const module = availableModules.find(m => m.key === moduleKey);
    return module ? module.name : moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
};

