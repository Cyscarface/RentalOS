import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertyApi, tenantProfileApi } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, Bed, DollarSign, Phone, Eye } from 'lucide-react';

export default function PropertyDetail() {
    const { id } = useParams();
    const { user } = useAuth();

    const { data: property, isLoading } = useQuery({
        queryKey: ['property', id],
        queryFn: () => propertyApi.show(id).then(r => r.data),
    });

    // Silently record view for tenants (deduped server-side within 1 hour)
    useEffect(() => {
        if (user?.role === 'tenant' && id) {
            tenantProfileApi.recordView(id).catch(() => { }); // fire-and-forget
        }
    }, [id, user?.role]);

    const requestViewing = async () => {
        if (!user) { toast.error('Please login to request a viewing.'); return; }
        try {
            await propertyApi.requestViewing(id);
            toast.success('Viewing request sent to the landlord!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed.');
        }
    };

    if (isLoading) return <div className="loading-center"><span className="spinner spinner-lg" /></div>;
    if (!property) return <div className="container page"><p className="text-muted">Property not found.</p></div>;

    const images = property.images || [];

    return (
        <div className="page">
            <div className="container">
                {/* Back */}
                <Link to="/" className="btn btn-ghost btn-sm mb-16">← Back to Listings</Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
                    {/* Main */}
                    <div>
                        {/* Images */}
                        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 340, background: 'var(--navy-700)', marginBottom: 24 }}>
                            {images[0]
                                ? <img src={images[0].url} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div className="flex-center" style={{ height: '100%', fontSize: '5rem', opacity: 0.3 }}>🏠</div>
                            }
                        </div>
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                                {images.slice(1).map(img => (
                                    <div key={img.id} style={{ width: 80, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{property.title}</h1>
                        <p className="text-muted flex gap-8 mb-16"><MapPin size={15} /> {[property.estate, property.sub_county, property.county].filter(Boolean).join(', ')}</p>

                        {property.description && (
                            <div className="card mb-16">
                                <h3 className="fw-700 mb-8">Description</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{property.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div style={{ position: 'sticky', top: 80 }}>
                        <div className="card mb-16">
                            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--teal)', marginBottom: 4 }}>
                                KSh {Number(property.rent_amount).toLocaleString()}
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/month</span>
                            </div>
                            <div className="flex gap-16 mt-16 mb-16" style={{ flexWrap: 'wrap' }}>
                                <span className="flex gap-8 text-sm"><Bed size={15} /> {property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                            </div>
                            {user?.role === 'tenant' && (
                                <button className="btn btn-primary btn-full" onClick={requestViewing}>
                                    <Eye size={16} /> Request Viewing
                                </button>
                            )}
                            {!user && (
                                <Link to="/login" className="btn btn-primary btn-full" style={{ justifyContent: 'center' }}>Login to Request Viewing</Link>
                            )}
                        </div>

                        {property.landlord && (
                            <div className="card">
                                <h4 className="fw-700 mb-12">Listed by</h4>
                                <div className="flex gap-12">
                                    <div className="user-avatar">{property.landlord.name?.[0]}</div>
                                    <div>
                                        <p className="fw-600">{property.landlord.name}</p>
                                        <p className="text-sm text-muted flex gap-8 mt-8"><Phone size={13} /> {property.landlord.phone}</p>
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
