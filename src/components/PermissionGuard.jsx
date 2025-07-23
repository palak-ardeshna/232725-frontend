import { useSelector } from 'react-redux';
import { hasPermission, parsePermissions } from '../utils/permissionUtils.jsx';
import { publicModules } from '../config/permissions';

const PermissionGuard = ({ module, action, fallback = null, children }) => {
    const user = useSelector(state => state.auth?.user);
    const userType = user?.userType;
    const userPermissions = parsePermissions(user?.permissions);

    // For public modules, always allow access
    if (publicModules.includes(module)) {
        return children;
    }

    const permitted = hasPermission(userType, userPermissions, module, action);

    return permitted ? children : fallback;
};

export default PermissionGuard;