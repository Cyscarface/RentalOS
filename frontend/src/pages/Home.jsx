import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../api';
import { MapPin, Bed, Search, Filter } from 'lucide-react';
import { SkeletonCard, LazyImage } from '../components/SkeletonCard';
import './Home.css';

const COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'];

function PropertyCard({ property }) {
    const primary = property.images?.find(i => i.is_primary) || property.images?.[0];
    return (
        <Link to={`/properties/${property.id}`} className="prop-card">
            <div className="prop-image">
                {primary
                    ? <LazyImage src={primary.url} alt={property.title} style={{ height: 180 }} />
                    : <div className="prop-image-placeholder"><span>🏠</span></div>
                }
                <span className="prop-badge">Active</span>
            </div>
            <div className="prop-body">
                <h3 className="prop-title">{property.title}</h3>
                <p className="prop-location"><MapPin size={13} /> {property.estate ?? property.sub_county ?? property.county}</p>
                <div className="prop-meta">
                    <span><Bed size={13} /> {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                    <span className="prop-rent">KSh {Number(property.rent_amount).toLocaleString()}/mo</span>
                </div>
            </div>
        </Link>
    );
}

export default function Home() {
    const [filters, setFilters] = useState({ county: '', bedrooms: '', min_rent: '', max_rent: '' });
    const [applied, setApplied] = useState({});
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['properties', applied, page],
        queryFn: () => propertyApi.list({ ...applied, page }).then(r => r.data),
    });

    const apply = () => { setApplied(filters); setPage(1); };
    const reset = () => { setFilters({ county: '', bedrooms: '', min_rent: '', max_rent: '' }); setApplied({}); setPage(1); };

    return (
        <div>
            {/* Hero */}
            <section className="hero">
                <div className="hero-bg" />
                <div className="container hero-content">
                    <div className="hero-badge">🇰🇪 Trusted property platform in Kenya</div>
                    <h1 className="hero-title">
                        Find your perfect<br /><span className="hero-accent">home in Kenya</span>
                    </h1>
                    <p className="hero-sub">Browse verified rental properties and book professional home services — all in one place.</p>
                    <div className="hero-cta">
                        <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
                        <Link to="/services" className="btn btn-outline btn-lg">Browse Services</Link>
                    </div>
                </div>
            </section>

            {/* Properties */}
            <section className="page">
                <div className="container">
                    <div className="flex-between mb-24">
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Available Properties</h2>
                            <p className="text-muted text-sm mt-8">{data?.total ?? '...'} listings found</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters-bar card card-sm mb-24">
                        <div className="filters-grid">
                            <div className="input-icon-wrap">
                                <MapPin size={15} className="input-icon" />
                                <select className="form-select input-with-icon" value={filters.county}
                                    onChange={e => setFilters(f => ({ ...f, county: e.target.value }))}>
                                    <option value="">All Counties</option>
                                    {COUNTIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <select className="form-select" value={filters.bedrooms}
                                onChange={e => setFilters(f => ({ ...f, bedrooms: e.target.value }))}>
                                <option value="">Any Bedrooms</option>
                                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? 'Bedsitter' : `${n} Bed`}</option>)}
                            </select>
                            <input className="form-input" type="number" placeholder="Min Rent (KSh)" value={filters.min_rent}
                                onChange={e => setFilters(f => ({ ...f, min_rent: e.target.value }))} />
                            <input className="form-input" type="number" placeholder="Max Rent (KSh)" value={filters.max_rent}
                                onChange={e => setFilters(f => ({ ...f, max_rent: e.target.value }))} />
                        </div>
                        <div className="flex gap-8 mt-16">
                            <button className="btn btn-primary" onClick={apply}><Search size={15} /> Search</button>
                            <button className="btn btn-ghost" onClick={reset}><Filter size={15} /> Reset</button>
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoading
                        ? <div className="prop-grid">
                            <SkeletonCard type="property" count={6} />
                        </div>
                        : data?.data?.data?.length === 0 || data?.data?.length === 0
                            ? <div className="empty-state"><p>No properties match your filters.</p></div>
                            : <div className="prop-grid">
                                {(data?.data?.data ?? data?.data ?? []).map(p => <PropertyCard key={p.id} property={p} />)}
                            </div>
                    }

                    {/* Pagination */}
                    {data && data.last_page > 1 && (
                        <div className="pagination mt-24">
                            {Array.from({ length: data.last_page }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
