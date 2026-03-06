import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { Users, Building2, CreditCard, Calendar, Wrench } from 'lucide-react';

export default function AdminDashboard() {
    const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminApi.dashboard().then(r => r.data) });

    const kpis = [
        { label: 'Total Users', value: data?.users?.total ?? 0, icon: Users, color: 'var(--teal)' },
        { label: 'Unverified Providers', value: data?.users?.unverified_providers ?? 0, icon: Users, color: '#fc8181' },
        { label: 'Active Properties', value: data?.properties?.active ?? 0, icon: Building2, color: '#68d391' },
        { label: 'Pending Properties', value: data?.properties?.pending ?? 0, icon: Building2, color: '#F5A623' },
        { label: 'Pending Services', value: data?.services?.pending ?? 0, icon: Wrench, color: '#F5A623' },
        { label: 'Total Revenue', value: `KSh ${Number(data?.payments?.total_collected ?? 0).toLocaleString()}`, icon: CreditCard, color: '#90cdf4' },
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
                        {[['Tenants', data?.users?.tenants ?? 0, 'badge-blue'],
                        ['Landlords', data?.users?.landlords ?? 0, 'badge-teal'],
                        ['Providers', data?.users?.providers ?? 0, 'badge-yellow']].map(([role, count, badge]) => (
                            <div key={role} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-2)' }}>
                                <span className={`badge ${badge}`}>{role}</span>
                                <span className="fw-700">{count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h3 className="fw-700 mb-12">Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <a href="/admin/properties" className="btn btn-outline btn-full" style={{ justifyContent: 'center' }}>Review Property Approvals ({data?.properties?.pending ?? 0})</a>
                            <a href="/admin/services" className="btn btn-outline btn-full" style={{ justifyContent: 'center' }}>Review Service Approvals ({data?.services?.pending ?? 0})</a>
                            <a href="/admin/users" className="btn btn-ghost btn-full" style={{ justifyContent: 'center' }}>Manage Users</a>
                            <a href="/admin/revenue" className="btn btn-ghost btn-full" style={{ justifyContent: 'center' }}>Revenue Report</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
