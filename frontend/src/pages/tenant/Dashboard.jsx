import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paymentApi, bookingApi, messageApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Calendar, MessageSquare, Building2 } from 'lucide-react';

export default function TenantDashboard() {
    const { user } = useAuth();

    const { data: payments } = useQuery({ queryKey: ['payments-history'], queryFn: () => paymentApi.history().then(r => r.data) });
    const { data: bookings } = useQuery({ queryKey: ['my-bookings'], queryFn: () => bookingApi.myBookings().then(r => r.data) });
    const { data: convos } = useQuery({ queryKey: ['conversations'], queryFn: () => messageApi.conversations().then(r => r.data) });

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

                {/* Quick links */}
                <div className="grid-3" style={{ marginBottom: 32 }}>
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
                </div>

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
