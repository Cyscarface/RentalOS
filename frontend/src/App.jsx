import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Public
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';

// Tenant
import TenantDashboard from './pages/tenant/Dashboard';
import TenantBookings from './pages/tenant/Bookings';
import TenantPayments from './pages/tenant/Payments';
import TenantMessages from './pages/tenant/Messages';
import TenantProfile from './pages/tenant/Profile';

// Landlord
import LandlordDashboard from './pages/landlord/Dashboard';
import LandlordProperties from './pages/landlord/Properties';
import AddProperty from './pages/landlord/AddProperty';
import LandlordPayments from './pages/landlord/Payments';
import LandlordMessages from './pages/landlord/Messages';
import LandlordProfile from './pages/landlord/Profile';

// Provider
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderServices from './pages/provider/Services';
import ProviderBookings from './pages/provider/Bookings';
import ProviderProfile from './pages/provider/Profile';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProperties from './pages/admin/Properties';
import AdminRevenue from './pages/admin/Revenue';
import AdminBookings from './pages/admin/Bookings';
import AdminServices from './pages/admin/Services';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function RoleRedirect() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    const home = { tenant: '/tenant', landlord: '/landlord', provider: '/provider', admin: '/admin' };
    return <Navigate to={home[user.role] || '/login'} replace />;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Navbar />
                        <Routes>
                            {/* Public */}
                            <Route path="/" element={<Home />} />
                            <Route path="/properties/:id" element={<PropertyDetail />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/services/:id" element={<ServiceDetail />} />

                            {/* Auth */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-otp" element={<VerifyOtp />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/dashboard" element={<RoleRedirect />} />

                            {/* Tenant */}
                            <Route path="/tenant" element={<PrivateRoute role="tenant"><TenantDashboard /></PrivateRoute>} />
                            <Route path="/tenant/bookings" element={<PrivateRoute role="tenant"><TenantBookings /></PrivateRoute>} />
                            <Route path="/tenant/payments" element={<PrivateRoute role="tenant"><TenantPayments /></PrivateRoute>} />
                            <Route path="/tenant/messages" element={<PrivateRoute role="tenant"><TenantMessages /></PrivateRoute>} />
                            <Route path="/tenant/profile" element={<PrivateRoute role="tenant"><TenantProfile /></PrivateRoute>} />

                            {/* Landlord */}
                            <Route path="/landlord" element={<PrivateRoute role="landlord"><LandlordDashboard /></PrivateRoute>} />
                            <Route path="/landlord/properties" element={<PrivateRoute role="landlord"><LandlordProperties /></PrivateRoute>} />
                            <Route path="/landlord/properties/new" element={<PrivateRoute role="landlord"><AddProperty /></PrivateRoute>} />
                            <Route path="/landlord/payments" element={<PrivateRoute role="landlord"><LandlordPayments /></PrivateRoute>} />
                            <Route path="/landlord/messages" element={<PrivateRoute role="landlord"><LandlordMessages /></PrivateRoute>} />
                            <Route path="/landlord/profile" element={<PrivateRoute role="landlord"><LandlordProfile /></PrivateRoute>} />

                            {/* Provider */}
                            <Route path="/provider" element={<PrivateRoute role="provider"><ProviderDashboard /></PrivateRoute>} />
                            <Route path="/provider/services" element={<PrivateRoute role="provider"><ProviderServices /></PrivateRoute>} />
                            <Route path="/provider/bookings" element={<PrivateRoute role="provider"><ProviderBookings /></PrivateRoute>} />
                            <Route path="/provider/profile" element={<PrivateRoute role="provider"><ProviderProfile /></PrivateRoute>} />

                            {/* Admin */}
                            <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
                            <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />
                            <Route path="/admin/properties" element={<PrivateRoute role="admin"><AdminProperties /></PrivateRoute>} />
                            <Route path="/admin/services" element={<PrivateRoute role="admin"><AdminServices /></PrivateRoute>} />
                            <Route path="/admin/bookings" element={<PrivateRoute role="admin"><AdminBookings /></PrivateRoute>} />
                            <Route path="/admin/revenue" element={<PrivateRoute role="admin"><AdminRevenue /></PrivateRoute>} />

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: {
                                    background: 'var(--surface)',
                                    color: 'var(--text-bright)',
                                    border: '1px solid var(--border)',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    fontSize: '0.9rem',
                                    boxShadow: 'var(--shadow)',
                                },
                                success: { iconTheme: { primary: 'var(--primary)', secondary: 'var(--surface)' } },
                                error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface)' } },
                            }}
                        />
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
