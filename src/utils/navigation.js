import { useSelector } from 'react-redux';
import { selectUserRole } from '../auth/services/authSlice';

export const navigateToProfile = (navigate) => {
    const userRole = useSelector(selectUserRole);
    const path = userRole === 'admin' ? '/admin/profile' : '/profile';
    navigate(path);
}; 