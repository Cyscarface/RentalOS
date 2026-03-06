import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { serviceApi, bookingApi, providerProfileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Calendar, Star, User, ShieldCheck } from 'lucide-react';

export default function ProviderDashboard() {
    const { user } = useAuth();
    const { data: services } = useQuery({ queryKey: ['my-services'], queryFn: () => serviceApi.myServices().then(r => r.data) });
    const { data: bookings } = useQuery({ queryKey: ['provider-bookings'], queryFn: () => bookingApi.providerBookings().then(r => r.data) });
    const { data: profile } = useQuery({ queryKey: ['provider-profile'], queryFn: () => providerProfileApi.get().then(r => r.data) });

    const pending = (bookings?.data || []).filter(b => b.status === 'pending').length;
    const accepted = (bookings?.data || []).filter(b => b.status === 'accepted').length;
    const completed = (bookings?.data || []).filter(b => b.status === 'completed').length;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between mb-24">
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            Provider Dashboard
                            {profile?.is_verified && <ShieldCheck size={24} color="var(--teal)" title="Verified Professional" />}
                        </h1>
                        <p>Manage your services and incoming bookings</p>
                    </div>
                    {profile && (
                        <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)' }}>
                            <div className="fw-700 text-lg">{profile?.rating ? Number(profile.rating).toFixed(1) : 'New'}</div>
                            <div style={{ display: 'flex', color: 'var(--yellow)' }}>
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={profile?.rating >= i ? 'currentColor' : 'none'} color={profile?.rating >= i ? 'currentColor' : 'var(--border)'} />)}
                            </div>
                            <div className="text-xs text-muted">Reputation</div>
                        </div>
                    )}
                </div>

                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-label">Active Services</div>
                        <div className="kpi-value teal">{services?.length ?? 0}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Pending Bookings</div>
                        <div className="kpi-value">{pending}</div>
                        <div className="kpi-meta">Needs your action</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Accepted</div>
                        <div className="kpi-value">{accepted}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Completed</div>
                        <div className="kpi-value" style={{ color: '#68d391' }}>{completed}</div>
                    </div>
                </div>

                <div className="grid-3 mb-24">
                    <Link to="/provider/services" className="card flex gap-16" style={{ alignItems: 'center' }}>
                        <Wrench size={28} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-700">My Services</p><p className="text-muted text-sm">{services?.length ?? 0} listed</p></div>
                    </Link>
                    <Link to="/provider/bookings" className="card flex gap-16" style={{ alignItems: 'center' }}>
                        <Calendar size={28} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-700">Bookings</p><p className="text-muted text-sm">{pending} pending action</p></div>
                    </Link>
                    <Link to="/provider/profile" className="card flex gap-16" style={{ alignItems: 'center' }}>
                        <User size={28} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-700">My Profile</p><p className="text-muted text-sm">Update identity</p></div>
                    </Link>
                </div>

                {/* Recent bookings */}
                <div className="card">
                    <h3 className="fw-700 mb-16">Pending Bookings</h3>
                    {!(bookings?.data) || bookings.data.filter(b => b.status === 'pending').length === 0
                        ? <p className="text-muted text-sm">No pending bookings.</p>
                        : <div className="table-wrap">
                            <table>
                                <thead><tr><th>Service</th><th>Tenant</th><th>Scheduled</th><th>Status</th></tr></thead>
                                <tbody>
                                    {(bookings?.data || []).filter(b => b.status === 'pending').slice(0, 5).map(b => (
                                        <tr key={b.id}>
                                            <td className="fw-600">{b.service?.title}</td>
                                            <td className="text-muted">{b.tenant?.name}</td>
                                            <td className="text-sm text-muted">{new Date(b.scheduled_at).toLocaleDateString()}</td>
                                            <td><span className="badge badge-yellow">{b.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}
