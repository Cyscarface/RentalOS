import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi, reviewApi } from '../../api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

const STATUS_BADGE = {
    pending: 'badge-yellow',
    accepted: 'badge-blue',
    completed: 'badge-green',
    declined: 'badge-red',
};

export default function TenantBookings() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => bookingApi.myBookings().then(r => r.data),
    });

    const [reviewing, setReviewing] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submitReview = async () => {
        setSubmitting(true);
        try {
            await reviewApi.submit({ booking_id: reviewing, rating, comment });
            toast.success('Review submitted!');
            qc.invalidateQueries(['my-bookings']);
            setReviewing(null); setComment(''); setRating(5);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>My Bookings</h1>
                    <p>Track your service bookings</p>
                </div>

                {/* Review modal */}
                {reviewing && (
                    <div className="modal-overlay" onClick={() => setReviewing(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3 className="modal-title">Leave a Review</h3>
                            <div className="form-group">
                                <label className="form-label">Rating</label>
                                <div className="flex gap-8">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button key={n} type="button" onClick={() => setRating(n)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.6rem', color: n <= rating ? '#F5A623' : 'var(--text-dim)' }}>★</button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Comment (optional)</label>
                                <textarea className="form-textarea" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." />
                            </div>
                            <div className="flex gap-8 mt-16">
                                <button className="btn btn-ghost" onClick={() => setReviewing(null)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitReview} disabled={submitting}>
                                    {submitting ? <span className="spinner" /> : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    {isLoading
                        ? <div className="loading-center"><span className="spinner" /></div>
                        : data?.data?.length === 0
                            ? <p className="text-muted">No bookings yet. <a href="/services">Browse services →</a></p>
                            : <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Service</th><th>Provider</th><th>Scheduled</th><th>Status</th><th></th></tr></thead>
                                    <tbody>
                                        {data?.data?.map(b => (
                                            <tr key={b.id}>
                                                <td className="fw-600">{b.service?.title}</td>
                                                <td className="text-muted">{b.provider?.name}</td>
                                                <td className="text-sm text-muted">{new Date(b.scheduled_at).toLocaleDateString()}</td>
                                                <td><span className={`badge ${STATUS_BADGE[b.status] ?? 'badge-gray'}`}>{b.status}</span></td>
                                                <td>
                                                    {b.status === 'completed' && !b.review && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setReviewing(b.id)}>
                                                            <Star size={13} /> Review
                                                        </button>
                                                    )}
                                                    {b.review && <span className="badge badge-green">Reviewed</span>}
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
