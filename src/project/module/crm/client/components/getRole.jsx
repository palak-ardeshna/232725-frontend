import { useSelector } from 'react-redux';
import { selectUserRole } from '../../../../../auth/services/authSlice';

const getRole = () => {
    const role = useSelector(selectUserRole);
    const formattedRole = role.replace(' ', '_').toLowerCase();
    return formattedRole;
}

export default getRole;