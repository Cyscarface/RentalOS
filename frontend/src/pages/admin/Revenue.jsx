import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';

export default function AdminRevenue() {
    const { data, isLoading } = useQuery({ queryKey: ['admin-revenue'], queryFn: () => adminApi.revenue().then(r => r.data) });

    if (isLoading) return <div className="loading-center"><span className="spinner spinner-lg" /></div>;

    const months = data ?? [];
    const maxRent = Math.max(...months.map(m => Number(m.total_rent || 0)), 1);

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Revenue Report</h1>
                    <p>Monthly platform revenue breakdown</p>
                </div>

                {/* Totals */}
                <div className="kpi-grid mb-24" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="kpi-card">
                        <div className="kpi-label">Total Rent Collected</div>
                        <div className="kpi-value teal">KSh {months.reduce((s, m) => s + Number(m.total_rent || 0), 0).toLocaleString()}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Platform Commission</div>
                        <div className="kpi-value" style={{ color: '#F5A623' }}>KSh {months.reduce((s, m) => s + Number(m.total_commission || 0), 0).toLocaleString()}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Months With Data</div>
                        <div className="kpi-value">{months.length}</div>
                    </div>
                </div>

                {/* Bar chart (CSS) */}
                <div className="card mb-24">
                    <h3 className="fw-700 mb-20">Monthly Rent Revenue</h3>
                    {months.length === 0
                        ? <p className="text-muted">No revenue data yet.</p>
                        : <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, padding: '0 8px' }}>
                            {months.map(m => {
                                const height = Math.max((Number(m.total_rent || 0) / maxRent) * 100, 4);
                                return (
                                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 700 }}>
                                            {m.total_rent > 0 ? `${Math.round(Number(m.total_rent) / 1000)}K` : ''}
                                        </span>
                                        <div
                                            title={`KSh ${Number(m.total_rent || 0).toLocaleString()}`}
                                            style={{
                                                width: '100%', height: `${height}%`,
                                                background: 'linear-gradient(180deg, var(--teal) 0%, var(--teal-dark) 100%)',
                                                borderRadius: '6px 6px 0 0',
                                                transition: 'height 0.4s ease',
                                                minHeight: 4,
                                            }}
                                        />
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(m.month + '-01').toLocaleDateString('en-KE', { month: 'short' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    }
                </div>

                {/* Table */}
                <div className="card">
                    <h3 className="fw-700 mb-16">Monthly Breakdown</h3>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Month</th><th>Rent Collected</th><th>Commission</th><th>Payments</th></tr></thead>
                            <tbody>
                                {months.map(m => (
                                    <tr key={m.month}>
                                        <td className="fw-600">{new Date(m.month + '-01').toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</td>
                                        <td className="fw-600" style={{ color: 'var(--teal)' }}>KSh {Number(m.total_rent || 0).toLocaleString()}</td>
                                        <td style={{ color: '#F5A623' }}>KSh {Number(m.total_commission || 0).toLocaleString()}</td>
                                        <td className="text-muted">{m.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
