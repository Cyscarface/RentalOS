import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api';
import { Wrench, Star, DollarSign } from 'lucide-react';

const CATEGORIES = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'security', 'gardening'];

function ServiceCard({ service }) {
    return (
        <Link to={`/services/${service.id}`} className="prop-card">
            <div className="prop-body" style={{ padding: 22 }}>
                <div className="flex-between mb-12">
                    <span className="badge badge-teal">{service.category}</span>
                    <span className="text-sm text-muted"><Wrench size={12} /> Provider</span>
                </div>
                <h3 className="prop-title">{service.title}</h3>
                <p className="text-muted text-sm mt-8" style={{ lineHeight: 1.5 }}>
                    {service.description?.slice(0, 80) ?? 'Professional service'}...
                </p>
                <div className="flex-between mt-16">
                    <span style={{ color: 'var(--teal)', fontWeight: 800 }}>
                        KSh {Number(service.base_price).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted">{service.provider?.name}</span>
                </div>
            </div>
        </Link>
    );
}

export default function Services() {
    const [category, setCategory] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['services', category],
        queryFn: () => serviceApi.list(category ? { category } : {}).then(r => r.data),
    });

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>Home Services</h1>
                    <p>Book trusted professionals directly through RentalOS</p>
                </div>

                {/* Category filter */}
                <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap' }}>
                    <button className={`btn btn-sm ${!category ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCategory('')}>All</button>
                    {CATEGORIES.map(c => (
                        <button key={c} className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setCategory(c)} style={{ textTransform: 'capitalize' }}>
                            {c}
                        </button>
                    ))}
                </div>

                {isLoading
                    ? <div className="loading-center"><span className="spinner spinner-lg" /></div>
                    : data?.data?.length === 0
                        ? <div className="empty-state"><p>No services available in this category.</p></div>
                        : <div className="prop-grid">
                            {data?.data?.map(s => <ServiceCard key={s.id} service={s} />)}
                        </div>
                }
            </div>
        </div>
    );
}
