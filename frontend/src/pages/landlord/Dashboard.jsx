import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { propertyApi, paymentApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Building2, CreditCard, Plus } from 'lucide-react';

export default function LandlordDashboard() {
    const { user } = useAuth();
    const { data: properties } = useQuery({ queryKey: ['my-properties'], queryFn: () => propertyApi.myListings().then(r => r.data) });
    const { data: payments } = useQuery({ queryKey: ['landlord-payments'], queryFn: () => paymentApi.landlordSummary().then(r => r.data) });

    const active = (properties?.data || []).filter(p => p.status === 'active').length;
    const pending = (properties?.data || []).filter(p => p.status === 'pending').length;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex-between">
                    <div><h1>Landlord Dashboard</h1><p>Manage your properties and track income</p></div>
                    <Link to="/landlord/properties/new" className="btn btn-primary"><Plus size={15} /> Add Property</Link>
                </div>

                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-label">Total Revenue</div>
                        <div className="kpi-value teal">KSh {Number(payments?.total_received ?? 0).toLocaleString()}</div>
                        <div className="kpi-meta">Completed payments</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Active Listings</div>
                        <div className="kpi-value">{active}</div>
                        <div className="kpi-meta">Visible to tenants</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Pending Approval</div>
                        <div className="kpi-value">{pending}</div>
                        <div className="kpi-meta">Awaiting admin review</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Total Properties</div>
                        <div className="kpi-value">{properties?.total ?? properties?.data?.length ?? 0}</div>
                    </div>
                </div>

                <div className="grid-2">
                    <Link to="/landlord/properties" className="card flex gap-16" style={{ alignItems: 'center' }}>
                        <Building2 size={28} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-700">My Properties</p><p className="text-muted text-sm">View, edit and manage listings</p></div>
                    </Link>
                    <Link to="/landlord/payments" className="card flex gap-16" style={{ alignItems: 'center' }}>
                        <CreditCard size={28} style={{ color: 'var(--teal)' }} />
                        <div><p className="fw-700">Payments</p><p className="text-muted text-sm">KSh {Number(payments?.total_received ?? 0).toLocaleString()} received</p></div>
                    </Link>
                </div>

                {/* Recent payments */}
                <div className="card mt-24">
                    <div className="flex-between mb-16">
                        <h3 className="fw-700">Recent Payments</h3>
                        <Link to="/landlord/payments" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {!(payments?.payments?.data) || payments.payments.data.length === 0
                        ? <p className="text-muted text-sm">No payments received yet.</p>
                        : <div className="table-wrap">
                            <table>
                                <thead><tr><th>Tenant</th><th>Property</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {(payments?.payments?.data || []).slice(0, 5).map(p => (
                                        <tr key={p.id}>
                                            <td>{p.tenant?.name}</td>
                                            <td className="text-muted">{p.property?.title}</td>
                                            <td className="fw-600">KSh {Number(p.amount).toLocaleString()}</td>
                                            <td><span className={`badge badge-${p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'yellow'}`}>{p.status}</span></td>
                                            <td className="text-sm text-muted">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
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
