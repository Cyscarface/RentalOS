import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Home, Building2, Wrench, Calendar, MessageSquare, CreditCard, Shield, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import NotificationBell from './NotificationBell';
import Logo from './Logo';
import './Navbar.css';

const NAV_LINKS = {
    tenant: [
        { to: '/tenant', label: 'Dashboard', icon: Home },
        { to: '/tenant/payments', label: 'Payments', icon: CreditCard },
        { to: '/tenant/bookings', label: 'Bookings', icon: Calendar },
        { to: '/tenant/messages', label: 'Messages', icon: MessageSquare },
    ],
    landlord: [
        { to: '/landlord', label: 'Dashboard', icon: Home },
        { to: '/landlord/properties', label: 'Properties', icon: Building2 },
        { to: '/landlord/payments', label: 'Payments', icon: CreditCard },
        { to: '/landlord/messages', label: 'Messages', icon: MessageSquare },
    ],
    provider: [
        { to: '/provider', label: 'Dashboard', icon: Home },
        { to: '/provider/services', label: 'Services', icon: Wrench },
        { to: '/provider/bookings', label: 'Bookings', icon: Calendar },
    ],
    admin: [
        { to: '/admin', label: 'Dashboard', icon: Shield },
        { to: '/admin/users', label: 'Users', icon: Home },
        { to: '/admin/properties', label: 'Properties', icon: Building2 },
        { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
        { to: '/admin/revenue', label: 'Revenue', icon: CreditCard },
    ],
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const links = user ? (NAV_LINKS[user.role] || []) : [];

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                {/* Logo */}
                <Link to={user ? `/${user.role}` : '/'} className="navbar-logo" style={{ gap: 12 }}>
                    <Logo size={36} />
                    <span>Rental<span className="logo-accent">OS</span></span>
                </Link>

                {/* Desktop links */}
                {user && (
                    <div className="navbar-links">
                        {links.map(({ to, label, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`navbar-link ${location.pathname === to ? 'active' : ''}`}
                            >
                                <Icon size={15} />
                                {label}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Right side */}
                <div className="navbar-right">
                    {/* Theme toggle — always visible */}
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    >
                        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                    </button>

                    {user ? (
                        <>
                            <div className="navbar-user">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="user-avatar" style={{ objectFit: 'cover' }} />
                                ) : (
                                    <span className="user-avatar">{user.name?.[0]?.toUpperCase()}</span>
                                )}
                                <div className="user-info hide-mobile">
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-role">{user.role}</span>
                                </div>
                            </div>
                            <NotificationBell />
                            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                                <LogOut size={15} /> <span className="hide-mobile">Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-8">
                            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                        </div>
                    )}

                    {/* Mobile menu toggle */}
                    {user && (
                        <button className="btn-mobile-menu" onClick={() => setOpen(!open)}>
                            {open ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile nav drawer */}
            {open && user && (
                <div className="navbar-mobile">
                    {links.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`mobile-link ${location.pathname === to ? 'active' : ''}`}
                            onClick={() => setOpen(false)}
                        >
                            <Icon size={16} /> {label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
