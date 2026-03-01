import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serviceApi, bookingApi, reviewApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Wrench, Star, Calendar, Phone } from 'lucide-react';

export default function ServiceDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(false);

    const { data: service, isLoading } = useQuery({
        queryKey: ['service', id],
        queryFn: () => serviceApi.show(id).then(r => r.data),
    });

    const { data: reviews } = useQuery({
        queryKey: ['reviews', id],
        queryFn: () => reviewApi.providerReviews(service?.provider_id).then(r => r.data),
        enabled: !!service?.provider_id,
    });

    const handleBook = async () => {
        if (!user) { toast.error('Please login to book.'); navigate('/login'); return; }
        if (!date) { toast.error('Select a date and time.'); return; }
        setBooking(true);
        try {
            await bookingApi.create({ service_id: Number(id), scheduled_at: date, notes });
            toast.success('Booking submitted! Waiting for provider to confirm.');
            navigate('/tenant/bookings');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed.');
        } finally { setBooking(false); }
    };

    if (isLoading) return <div className="loading-center"><span className="spinner spinner-lg" /></div>;
    if (!service) return <div className="container page"><p className="text-muted">Service not found.</p></div>;

    return (
        <div className="page">
            <div className="container">
                <Link to="/services" className="btn btn-ghost btn-sm mb-16">← Back to Services</Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
                    {/* Detail */}
                    <div>
                        <div className="flex gap-12 mb-12">
                            <span className="badge badge-teal">{service.category}</span>
                        </div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12 }}>{service.title}</h1>
                        {service.description && (
                            <div className="card mb-16">
                                <h3 className="fw-700 mb-8">About this Service</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{service.description}</p>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="card">
                            <div className="flex-between mb-16">
                                <h3 className="fw-700">Reviews</h3>
                                {reviews && <span className="flex gap-8"><Star size={15} style={{ color: '#F5A623' }} /> {reviews.average_rating}/5</span>}
                            </div>
                            {reviews?.reviews?.data?.length === 0 && <p className="text-muted text-sm">No reviews yet.</p>}
                            {reviews?.reviews?.data?.map(r => (
                                <div key={r.id} style={{ borderBottom: '1px solid var(--border-2)', paddingBottom: 12, marginBottom: 12 }}>
                                    <div className="flex-between mb-4">
                                        <span className="fw-600 text-sm">{r.reviewer?.name}</span>
                                        <span className="text-sm" style={{ color: '#F5A623' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                    </div>
                                    {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Book sidebar */}
                    <div style={{ position: 'sticky', top: 80 }}>
                        <div className="card mb-16">
                            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--teal)', marginBottom: 16 }}>
                                KSh {Number(service.base_price).toLocaleString()}
                            </div>
                            {user?.role === 'tenant' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Schedule Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-input"
                                            value={date}
                                            min={new Date().toISOString().slice(0, 16)}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Notes (optional)</label>
                                        <textarea className="form-textarea" rows={3} placeholder="Describe the job..." value={notes} onChange={e => setNotes(e.target.value)} />
                                    </div>
                                    <button className="btn btn-primary btn-full" onClick={handleBook} disabled={booking}>
                                        {booking ? <span className="spinner" /> : <><Calendar size={15} /> Book Now</>}
                                    </button>
                                </>
                            )}
                            {!user && <Link to="/login" className="btn btn-primary btn-full" style={{ justifyContent: 'center' }}>Login to Book</Link>}
                        </div>

                        {service.provider && (
                            <div className="card">
                                <h4 className="fw-700 mb-12">Provider</h4>
                                <div className="flex gap-12">
                                    <div className="user-avatar">{service.provider.name?.[0]}</div>
                                    <div>
                                        <p className="fw-600">{service.provider.name}</p>
                                        <p className="text-sm text-muted">{service.provider.phone}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
