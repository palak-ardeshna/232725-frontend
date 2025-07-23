import { moduleCategories, availableModules, permissionTypes, getModulesByCategory, getModuleName, publicModules } from '../../../config/permissions';
import { parsePermissions } from '../../../utils/permissionUtils.jsx';

export {
    moduleCategories,
    availableModules,
    permissionTypes,
    getModulesByCategory,
    getModuleName,
    publicModules
};

export { parsePermissions };

export const areAllModulePermissionsSelected = (permissions, moduleKey) => {
    if (!permissions[moduleKey]) return false;
    return permissionTypes.every(type => permissions[moduleKey][type.key]);
};

export const isAnyModulePermissionSelected = (permissions, moduleKey) => {
    if (!permissions[moduleKey]) return false;
    return permissionTypes.some(type => permissions[moduleKey][type.key] === true);
};

export const areAllCategoryPermissionsSelected = (permissions, categoryKey) => {
    const allCategoryModules = getModulesByCategory(categoryKey);
    const categoryModules = allCategoryModules.filter(module => !publicModules.includes(module.key));
    return categoryModules.every(module => areAllModulePermissionsSelected(permissions, module.key));
};

export const isAnyCategoryPermissionSelected = (permissions, categoryKey) => {
    const allCategoryModules = getModulesByCategory(categoryKey);
    const categoryModules = allCategoryModules.filter(module => !publicModules.includes(module.key));
    return categoryModules.some(module => isAnyModulePermissionSelected(permissions, module.key));
};

export const generatePermissionTableData = (permissions, categoryKey) => {
    const allModules = getModulesByCategory(categoryKey).map(m => m.key);
    const modules = allModules.filter(key => !publicModules.includes(key));

    const moduleList = Object.keys(permissions)
        .filter(key => {
            return modules.includes(key);
        })
        .sort();

    if (moduleList.length === 0) {
        return null;
    }

    const columns = [
        {
            title: 'Module',
            dataIndex: 'module',
            key: 'module',
            width: '25%',
            render: (text) => {
                const module = availableModules.find(m => m.key === text);
                return module ? module.name : text.charAt(0).toUpperCase() + text.slice(1);
            }
        },
        ...permissionTypes.map(type => ({
            title: type.name,
            dataIndex: type.key,
            key: type.key,
            width: '15%',
            align: 'center'
        }))
    ];

    const data = moduleList.map(moduleKey => {
        const module = availableModules.find(m => m.key === moduleKey);

        return {
            key: moduleKey,
            module: moduleKey,
            moduleName: module ? module.name : moduleKey,
            create: permissions[moduleKey]?.create || false,
            read: permissions[moduleKey]?.read || false,
            update: permissions[moduleKey]?.update || false,
            delete: permissions[moduleKey]?.delete || false,
        };
    });

    return { columns, data };
};

export const getCategoryModules = (categoryKey) => {
    const allModules = availableModules.filter(module => module.category === categoryKey);
    return allModules.filter(module => !publicModules.includes(module.key));
};

export const getCategoryPermissionCount = (permissions, categoryKey) => {
    const allCategoryModules = availableModules.filter(module => module.category === categoryKey);
    const categoryModules = allCategoryModules.filter(module => !publicModules.includes(module.key));
    let totalCount = 0;

    categoryModules.forEach(module => {
        if (permissions[module.key]) {
            totalCount += Object.values(permissions[module.key]).filter(Boolean).length;
        }
    });

    return totalCount;
};

export const getModulesWithPermissionCount = (permissions, categoryKey) => {
    const allCategoryModules = availableModules.filter(module => module.category === categoryKey);
    const categoryModules = allCategoryModules.filter(module => !publicModules.includes(module.key));
    let moduleCount = 0;

    categoryModules.forEach(module => {
        if (permissions[module.key] && Object.values(permissions[module.key]).some(Boolean)) {
            moduleCount++;
        }
    });

    return moduleCount;
}; 