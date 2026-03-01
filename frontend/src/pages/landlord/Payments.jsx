import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../api';

export default function LandlordPayments() {
    const { data, isLoading } = useQuery({
        queryKey: ['landlord-payments'],
        queryFn: () => paymentApi.landlordSummary().then(r => r.data),
    });

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Payments Received</h1>
                    <p>Track rent payments from your tenants</p>
                </div>

                <div className="kpi-grid mb-24" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="kpi-card">
                        <div className="kpi-label">Total Received</div>
                        <div className="kpi-value teal">KSh {Number(data?.total_received ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Total Transactions</div>
                        <div className="kpi-value">{data?.payments?.total ?? 0}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Completed</div>
                        <div className="kpi-value" style={{ color: '#68d391' }}>
                            {data?.payments?.data?.filter(p => p.status === 'completed').length ?? 0}
                        </div>
                    </div>
                </div>

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : data?.payments?.data?.length === 0
                            ? <p className="text-muted">No payments received yet.</p>
                            : <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Tenant</th><th>Phone</th><th>Property</th><th>Amount</th><th>M-Pesa Ref</th><th>Status</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {data?.payments?.data?.map(p => (
                                            <tr key={p.id}>
                                                <td className="fw-600">{p.tenant?.name}</td>
                                                <td className="text-muted text-sm">{p.tenant?.phone}</td>
                                                <td className="text-muted">{p.property?.title}</td>
                                                <td className="fw-600" style={{ color: 'var(--teal)' }}>KSh {Number(p.amount).toLocaleString()}</td>
                                                <td className="text-sm text-muted">{p.mpesa_reference ?? '—'}</td>
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
