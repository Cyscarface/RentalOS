import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';

const STATUS_BADGE = { pending: 'badge-yellow', accepted: 'badge-blue', completed: 'badge-green', declined: 'badge-red' };

export default function AdminBookings() {
    const { data, isLoading } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => adminApi.bookings().then(r => r.data) });

    return (
        <div className="page">
            <div className="container">
                <div className="page-header"><h1>All Bookings</h1><p>Platform-wide service booking overview</p></div>

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : <div className="table-wrap">
                            <table>
                                <thead><tr><th>Service</th><th>Tenant</th><th>Provider</th><th>Commission</th><th>Scheduled</th><th>Status</th></tr></thead>
                                <tbody>
                                    {data?.data?.map(b => (
                                        <tr key={b.id}>
                                            <td className="fw-600">{b.service?.title}</td>
                                            <td className="text-muted">{b.tenant?.name}</td>
                                            <td className="text-muted">{b.provider?.name}</td>
                                            <td className="text-sm">KSh {Number(b.commission_amount).toLocaleString()}</td>
                                            <td className="text-sm text-muted">{new Date(b.scheduled_at).toLocaleDateString()}</td>
                                            <td><span className={`badge ${STATUS_BADGE[b.status] ?? 'badge-gray'}`}>{b.status}</span></td>
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
