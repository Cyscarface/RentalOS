import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paymentApi, bookingApi, messageApi, tenantProfileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Calendar, MessageSquare, Building2, User, Home, MapPin } from 'lucide-react';

export default function TenantDashboard() {
    const { user } = useAuth();

    const { data: payments } = useQuery({ queryKey: ['payments-history'], queryFn: () => paymentApi.history().then(r => r.data) });
    const { data: bookings } = useQuery({ queryKey: ['my-bookings'], queryFn: () => bookingApi.myBookings().then(r => r.data) });
    const { data: convos } = useQuery({ queryKey: ['conversations'], queryFn: () => messageApi.conversations().then(r => r.data) });
    const { data: recentViews } = useQuery({ queryKey: ['recent-views'], queryFn: () => tenantProfileApi.recentViews().then(r => r.data), staleTime: 2 * 60 * 1000 });

    const totalPaid = (payments?.data || []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const pending = (bookings?.data || []).filter(b => b.status === 'pending').length;
    const unread = (convos || []).reduce((s, c) => s + c.unread_count, 0);

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div>
                        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
                        <p>Here's what's happening with your tenancy</p>
                    </div>
                    <Link to="/" className="btn btn-outline"><Building2 size={15} /> Browse Properties</Link>
                </div>

                {/* KPIs */}
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-label">Total Rent Paid</div>
                        <div className="kpi-value teal">KSh {totalPaid.toLocaleString()}</div>
                        <div className="kpi-meta">This year</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Pending Bookings</div>
                        <div className="kpi-value">{pending}</div>
                        <div className="kpi-meta">Awaiting provider</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Unread Messages</div>
                        <div className="kpi-value">{unread}</div>
                        <div className="kpi-meta">In conversations</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Payment History</div>
                        <div className="kpi-value">{payments?.total ?? 0}</div>
                        <div className="kpi-meta">Total transactions</div>
                    </div>
                </div>

                {/* Quick links — 4-card grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                    <Link to="/tenant/payments" className="card card-sm flex gap-12" style={{ alignItems: 'center' }}>
                        <CreditCard size={22} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-600">Payments</p><p className="text-muted text-sm">View history & pay rent</p></div>
                    </Link>
                    <Link to="/tenant/bookings" className="card card-sm flex gap-12" style={{ alignItems: 'center' }}>
                        <Calendar size={22} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-600">Bookings</p><p className="text-muted text-sm">Manage service bookings</p></div>
                    </Link>
                    <Link to="/tenant/messages" className="card card-sm flex gap-12" style={{ alignItems: 'center' }}>
                        <MessageSquare size={22} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-600">Messages</p><p className="text-muted text-sm">{unread > 0 ? `${unread} unread` : 'Chat with landlord'}</p></div>
                    </Link>
                    <Link to="/tenant/profile" className="card card-sm flex gap-12" style={{ alignItems: 'center' }}>
                        <User size={22} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-600">My Profile</p><p className="text-muted text-sm">Preferences & history</p></div>
                    </Link>
                </div>

                {/* Recently Viewed strip */}
                {recentViews && recentViews.length > 0 && (
                    <div className="card" style={{ marginBottom: 32 }}>
                        <div className="flex-between mb-16">
                            <h3 className="fw-700">Recently Viewed</h3>
                            <Link to="/tenant/profile" className="btn btn-ghost btn-sm">View All</Link>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {recentViews.slice(0, 3).map((item, i) => {
                                const p = item.property;
                                if (!p) return null;
                                return (
                                    <Link key={`${p.id}-${i}`} to={`/properties/${p.id}`} className="card card-sm"
                                        style={{ flex: '1 1 220px', display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none', minWidth: 0 }}>
                                        {p.image_url
                                            ? <img src={p.image_url} alt={p.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                                            : <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Home size={18} color="var(--text-muted)" /></div>
                                        }
                                        <div style={{ minWidth: 0 }}>
                                            <p className="fw-600 truncate" style={{ fontSize: '0.88rem' }}>{p.title}</p>
                                            <p className="text-muted text-sm truncate"><MapPin size={10} style={{ display: 'inline', marginRight: 2 }} />{p.county}</p>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 700 }}>KSh {Number(p.rent_amount).toLocaleString()}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Recent payments */}
                <div className="card">
                    <div className="flex-between mb-16">
                        <h3 className="fw-700">Recent Payments</h3>
                        <Link to="/tenant/payments" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {!(payments?.data) || payments.data.length === 0
                        ? <p className="text-muted text-sm">No payments yet.</p>
                        : <div className="table-wrap">
                            <table>
                                <thead><tr><th>Property</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {(payments?.data || []).slice(0, 5).map(p => (
                                        <tr key={p.id}>
                                            <td>{p.property?.title ?? '—'}</td>
                                            <td className="fw-600">KSh {Number(p.amount).toLocaleString()}</td>
                                            <td><span className={`badge badge-${p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'yellow'}`}>{p.status}</span></td>
                                            <td className="text-muted text-sm">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
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
