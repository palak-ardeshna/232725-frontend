import { useSelector } from 'react-redux';
import { hasPermission, parsePermissions } from '../utils/permissionUtils.jsx';

export const useHasPermission = (module, action = 'read') => {
    return true;
}; 