import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
    tenant: '/tenant',
    landlord: '/landlord',
    provider: '/provider',
    admin: '/admin',
};

/** Protects a route by requiring auth + optionally a specific role */
export default function PrivateRoute({ children, role }) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (role && user.role !== role) {
        // Redirect to the user's actual dashboard if role mismatch
        return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
    }

    return children;
}
