import { useSelector } from 'react-redux';
import { hasPermission, parsePermissions } from '../utils/permissionUtils.jsx';

export const useHasPermission = (module, action = 'read') => {
    const user = useSelector(state => state.auth?.user);
    const userType = user?.userType;
    const userPermissions = parsePermissions(user?.permissions);
    
    return hasPermission(userType, userPermissions, module, action);
}; 