import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api';
import toast from 'react-hot-toast';

const STATUS_BADGE = { pending: 'badge-yellow', accepted: 'badge-blue', completed: 'badge-green', declined: 'badge-red' };

export default function ProviderBookings() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['provider-bookings'], queryFn: () => bookingApi.providerBookings().then(r => r.data) });

    const action = async (id, fn, successMsg) => {
        try { await fn(id); toast.success(successMsg); qc.invalidateQueries(['provider-bookings']); }
        catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header"><h1>Bookings</h1><p>Manage incoming service bookings</p></div>

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : data?.data?.length === 0
                            ? <p className="text-muted">No bookings yet.</p>
                            : <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Service</th><th>Tenant</th><th>Scheduled</th><th>Commission</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {data?.data?.map(b => (
                                            <tr key={b.id}>
                                                <td className="fw-600">{b.service?.title}</td>
                                                <td className="text-muted">{b.tenant?.name}</td>
                                                <td className="text-sm text-muted">{new Date(b.scheduled_at).toLocaleDateString()}</td>
                                                <td className="text-sm">KSh {Number(b.commission_amount).toLocaleString()}</td>
                                                <td><span className={`badge ${STATUS_BADGE[b.status] ?? 'badge-gray'}`}>{b.status}</span></td>
                                                <td>
                                                    <div className="flex gap-8">
                                                        {b.status === 'pending' && (
                                                            <>
                                                                <button className="btn btn-primary btn-sm" onClick={() => action(b.id, bookingApi.accept, 'Booking accepted!')}>Accept</button>
                                                                <button className="btn btn-danger  btn-sm" onClick={() => action(b.id, bookingApi.decline, 'Booking declined.')}>Decline</button>
                                                            </>
                                                        )}
                                                        {b.status === 'accepted' && (
                                                            <button className="btn btn-primary btn-sm" onClick={() => action(b.id, bookingApi.complete, 'Booking marked complete!')}>Complete</button>
                                                        )}
                                                    </div>
                                                </td>
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
