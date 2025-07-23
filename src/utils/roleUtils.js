
export const filterOutEmployeeRoles = (allRoles = [], employees = []) => {
    const employeeRoleIds = new Set();


    employees.forEach(employee => {
        if (employee.role_id) {
            employeeRoleIds.add(employee.role_id);
        }
    });


    return allRoles.filter(role => !employeeRoleIds.has(role.id) && role.role_name.toLowerCase() !== 'employee');
};


export const getFilteredRoles = (rolesData, employeesData) => {
    const allRoles = rolesData?.data?.items || [];
    const employees = employeesData?.data?.items || [];

    return filterOutEmployeeRoles(allRoles, employees);
}; 