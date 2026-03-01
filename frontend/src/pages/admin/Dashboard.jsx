import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { Users, Building2, CreditCard, Calendar } from 'lucide-react';

export default function AdminDashboard() {
    const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminApi.dashboard().then(r => r.data) });

    const kpis = [
        { label: 'Total Users', value: data?.users_total ?? 0, icon: Users, color: 'var(--teal)' },
        { label: 'Active Properties', value: data?.properties_active ?? 0, icon: Building2, color: '#68d391' },
        { label: 'Total Revenue', value: `KSh ${Number(data?.revenue_total ?? 0).toLocaleString()}`, icon: CreditCard, color: '#F5A623' },
        { label: 'Total Bookings', value: data?.bookings_total ?? 0, icon: Calendar, color: '#90cdf4' },
        { label: 'Pending Approvals', value: data?.properties_pending ?? 0, icon: Building2, color: '#fc8181' },
        { label: 'Suspended Users', value: data?.users_suspended ?? 0, icon: Users, color: '#fc8181' },
    ];

    if (isLoading) return <div className="loading-center"><span className="spinner spinner-lg" /></div>;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Admin Dashboard</h1>
                    <p>Platform overview and key metrics</p>
                </div>

                <div className="kpi-grid">
                    {kpis.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="kpi-card">
                            <div className="flex-between mb-8">
                                <div className="kpi-label">{label}</div>
                                <Icon size={18} style={{ color }} />
                            </div>
                            <div className="kpi-value" style={{ color }}>{value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid-2 mt-24">
                    <div className="card">
                        <h3 className="fw-700 mb-12">Role Breakdown</h3>
                        {[['Tenants', data?.users_by_role?.tenant ?? 0, 'badge-blue'],
                        ['Landlords', data?.users_by_role?.landlord ?? 0, 'badge-teal'],
                        ['Providers', data?.users_by_role?.provider ?? 0, 'badge-yellow']].map(([role, count, badge]) => (
                            <div key={role} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-2)' }}>
                                <span className={`badge ${badge}`}>{role}</span>
                                <span className="fw-700">{count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h3 className="fw-700 mb-12">Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <a href="/admin/properties" className="btn btn-outline btn-full" style={{ justifyContent: 'center' }}>Review Property Approvals ({data?.properties_pending ?? 0})</a>
                            <a href="/admin/users" className="btn btn-ghost btn-full" style={{ justifyContent: 'center' }}>Manage Users</a>
                            <a href="/admin/revenue" className="btn btn-ghost btn-full" style={{ justifyContent: 'center' }}>Revenue Report</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
